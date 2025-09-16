import { BaziAnalysis } from './bazi-calculator';
import { calculateAdvancedBazi } from './advanced-bazi-calculator';

export interface ComprehensiveAnalysis {
  baziAnalysis: BaziAnalysis;
  fiveElementsBalance: {
    balance: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    dominantElement: string;
    weakestElement: string;
    recommendations: string[];
  };
  healthImplications: {
    constitutionalType: string;
    healthStrengths: string[];
    healthWeaknesses: string[];
    lifestyleRecommendations: string[];
  };
  dietaryRecommendations: {
    foodsToAdd: string[];
    foodsToReduce: string[];
    cookingMethods: string[];
    mealTiming: string;
  };
  exerciseRecommendations: {
    bestActivities: string[];
    activitiesToAvoid: string[];
    optimalTime: string;
    intensity: string;
  };
  emotionalGuidance: {
    emotionalTendencies: string[];
    stressManagement: string[];
    meditationFocus: string;
  };
  seasonalAdjustments: {
    spring: string;
    summer: string;
    autumn: string;
    winter: string;
  };
}

// 体质类型映射
const CONSTITUTION_TYPES = {
  wood: {
    name: '木型体质',
    characteristics: ['身材修长', '面容清秀', '性格开朗', '有决策力'],
    strengths: ['肝胆功能强', '新陈代谢旺盛', '恢复力强'],
    weaknesses: ['易怒', '情绪波动', '肝火旺盛', '眼部疲劳']
  },
  fire: {
    name: '火型体质',
    characteristics: ['面色红润', '精力充沛', '性格活泼', '反应敏捷'],
    strengths: ['心脑血管功能好', '血液循环良好', '抗寒能力强'],
    weaknesses: ['心火旺盛', '易焦虑', '失眠多梦', '口干舌燥']
  },
  earth: {
    name: '土型体质',
    characteristics: ['身材敦实', '肌肉发达', '性格稳重', '有耐心'],
    strengths: ['消化系统强', '免疫力好', '体格健壮'],
    weaknesses: ['易消化不良', '湿气重', '思虑过度', '疲劳乏力']
  },
  metal: {
    name: '金型体质',
    characteristics: ['皮肤白皙', '体格健美', '性格果断', '有原则性'],
    strengths: ['呼吸系统好', '皮肤状态佳', '抵抗力强'],
    weaknesses: ['易呼吸道感染', '皮肤干燥', '易悲伤', '便秘']
  },
  water: {
    name: '水型体质',
    characteristics: ['身材丰满', '面色黧黑', '性格温和', '有智慧'],
    strengths: ['肾功能强', '生殖系统好', '耐力强'],
    weaknesses: ['畏寒怕冷', '易水肿', '腰膝酸软', '记忆力减退']
  }
};

// 食物推荐数据库
const FOOD_RECOMMENDATIONS = {
  wood: {
    add: ['绿叶蔬菜', '豆制品', '全谷物', '绿茶', '柠檬', '苹果'],
    reduce: ['辛辣食物', '油炸食品', '酒精', '咖啡', '红肉'],
    methods: ['清炒', '蒸煮', '凉拌'],
    timing: '早餐丰富，午餐适中，晚餐清淡'
  },
  fire: {
    add: ['苦味食物', '红色蔬果', '豆类', '莲子', '百合', '苦瓜'],
    reduce: ['热性食物', '辛辣调料', '烧烤', '油炸', '酒精'],
    methods: ['水煮', '蒸制', '凉拌'],
    timing: '少食多餐，避免晚餐过晚'
  },
  earth: {
    add: ['黄色食物', '根茎类', '小米', '南瓜', '山药', '红枣'],
    reduce: ['生冷食物', '油腻食物', '甜食', '乳制品'],
    methods: ['炖煮', '蒸制', '煲汤'],
    timing: '规律进餐，细嚼慢咽'
  },
  metal: {
    add: ['白色食物', '梨', '白萝卜', '银耳', '杏仁', '百合'],
    reduce: ['辛辣刺激', '干燥食物', '烟酒', '烧烤'],
    methods: ['炖煮', '煲汤', '蒸制'],
    timing: '定时定量，避免过饱'
  },
  water: {
    add: ['黑色食物', '海鲜', '核桃', '黑芝麻', '枸杞', '黑木耳'],
    reduce: ['生冷食物', '咸味过重', '寒凉食物', '冰品'],
    methods: ['温煮', '炖汤', '温炒'],
    timing: '温热饮食，避免过晚进餐'
  }
};

// 运动推荐
const EXERCISE_RECOMMENDATIONS = {
  wood: {
    best: ['太极', '瑜伽', '散步', '羽毛球', '游泳'],
    avoid: ['剧烈运动', '长时间静坐', '过度力量训练'],
    time: '早晨5-7点，傍晚5-7点',
    intensity: '中等强度，有氧运动为主'
  },
  fire: {
    best: ['游泳', '慢跑', '冥想', '太极', '散步'],
    avoid: ['高温环境运动', '过度竞争性运动', '深夜运动'],
    time: '清晨或傍晚，避开正午',
    intensity: '中低强度，放松性运动'
  },
  earth: {
    best: ['快走', '瑜伽', '太极', '园艺', '家务劳动'],
    avoid: ['剧烈运动', '过度运动', '潮湿环境运动'],
    time: '上午9-11点，下午3-5点',
    intensity: '中低强度，持续性运动'
  },
  metal: {
    best: ['慢跑', '游泳', '太极', '呼吸训练', '户外散步'],
    avoid: ['污染环境运动', '过度运动', '寒冷环境运动'],
    time: '早晨5-7点，下午3-5点',
    intensity: '中等强度，注重呼吸调节'
  },
  water: {
    best: ['太极', '瑜伽', '温热瑜伽', '慢走', '水中运动'],
    avoid: ['寒冷环境运动', '剧烈运动', '长时间静止'],
    time: '上午7-9点，下午5-7点',
    intensity: '低中强度，温热性运动'
  }
};

/**
 * 综合五行分析主函数
 */
export function analyzeComprehensiveFiveElements(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour: number
): ComprehensiveAnalysis {
  // 使用高级八字分析
  const baziAnalysis = calculateAdvancedBazi(birthYear, birthMonth, birthDay, birthHour);

  // 分析五行平衡度
  const balanceAnalysis = analyzeFiveElementsBalance(baziAnalysis);

  // 健康影响分析
  const healthImplications = analyzeHealthImplications(baziAnalysis);

  // 饮食推荐
  const dietaryRecommendations = getDietaryRecommendations(baziAnalysis);

  // 运动推荐
  const exerciseRecommendations = getExerciseRecommendations(baziAnalysis);

  // 情绪指导
  const emotionalGuidance = getEmotionalGuidance(baziAnalysis);

  // 季节调整
  const seasonalAdjustments = getSeasonalAdjustments(baziAnalysis);

  return {
    baziAnalysis,
    fiveElementsBalance: balanceAnalysis,
    healthImplications,
    dietaryRecommendations,
    exerciseRecommendations,
    emotionalGuidance,
    seasonalAdjustments
  };
}

/**
 * 分析五行平衡度
 */
function analyzeFiveElementsBalance(analysis: BaziAnalysis) {
  const percentages = analysis.elementPercentages;
  const values = Object.values(percentages);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  let balance: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  if (range <= 10) balance = 'excellent';
  else if (range <= 20) balance = 'good';
  else if (range <= 30) balance = 'fair';
  else if (range <= 40) balance = 'poor';
  else balance = 'critical';

  const elementNames = {
    wood: '木', fire: '火', earth: '土', metal: '金', water: '水'
  };

  const dominantElement = Object.entries(percentages).reduce((a, b) =>
    percentages[a[0] as keyof typeof percentages] > percentages[b[0] as keyof typeof percentages] ? a : b
  )[0];

  const weakestElement = Object.entries(percentages).reduce((a, b) =>
    percentages[a[0] as keyof typeof percentages] < percentages[b[0] as keyof typeof percentages] ? a : b
  )[0];

  const recommendations = generateBalanceRecommendations(balance, dominantElement, weakestElement);

  return {
    balance,
    dominantElement: elementNames[dominantElement as keyof typeof elementNames],
    weakestElement: elementNames[weakestElement as keyof typeof elementNames],
    recommendations
  };
}

/**
 * 生成平衡建议
 */
function generateBalanceRecommendations(
  balance: string,
  dominantElement: string,
  weakestElement: string
): string[] {
  const recommendations: string[] = [];

  if (balance === 'excellent' || balance === 'good') {
    recommendations.push('五行分布相对均衡，继续保持良好的生活习惯');
    recommendations.push('定期进行五行能量检测，保持动态平衡');
  } else if (balance === 'fair') {
    recommendations.push(`${weakestElement}元素相对较弱，建议加强相关方面的调理`);
    recommendations.push(`适当减少${dominantElement}元素的过度消耗`);
  } else if (balance === 'poor') {
    recommendations.push(`需要重点补充${weakestElement}元素，调整生活作息`);
    recommendations.push(`避免${dominantElement}元素的过度使用，寻求平衡`);
    recommendations.push('建议咨询专业的五行调理师进行个性化指导');
  } else {
    recommendations.push(`五行严重失衡，${weakestElement}元素极度缺乏`);
    recommendations.push(`${dominantElement}元素过度强旺，需要重点调理`);
    recommendations.push('强烈建议进行系统的五行能量调理');
  }

  return recommendations;
}

/**
 * 健康影响分析
 */
function analyzeHealthImplications(analysis: BaziAnalysis) {
  const elementNames = {
    wood: '木', fire: '火', earth: '土', metal: '金', water: '水'
  };

  const dayMasterElement = analysis.dayMasterElement;
  const constitution = CONSTITUTION_TYPES[dayMasterElement as keyof typeof CONSTITUTION_TYPES];

  // 根据五行平衡度调整健康建议
  const percentages = analysis.elementPercentages;
  const balanceStatus = getBalanceStatus(percentages);

  return {
    constitutionalType: constitution.name,
    healthStrengths: constitution.strengths,
    healthWeaknesses: [
      ...constitution.weaknesses,
      ...balanceStatus.weaknesses
    ],
    lifestyleRecommendations: [
      '保持规律作息，避免熬夜',
      '适当运动，促进气血循环',
      '保持心情愉悦，避免情绪波动',
      '定期体检，关注身体状况',
      ...balanceStatus.recommendations
    ]
  };
}

/**
 * 获取平衡状态
 */
function getBalanceStatus(percentages: any) {
  const values = Object.values(percentages) as number[];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (range > 30) {
    weaknesses.push('五行失衡，容易出现健康问题');
    recommendations.push('注重五行平衡，进行综合调理');
  }

  // 检查各五行元素是否在合理范围内
  Object.entries(percentages).forEach(([element, percentage]) => {
    const value = percentage as number;
    if (value < 15) {
      weaknesses.push(`${element}元素不足，相关脏腑功能可能较弱`);
      recommendations.push(`加强${element}元素的补充和调理`);
    } else if (value > 35) {
      weaknesses.push(`${element}元素过旺，可能出现相关症状`);
      recommendations.push(`适当控制${element}元素的过度使用`);
    }
  });

  return { weaknesses, recommendations };
}

/**
 * 获取饮食推荐
 */
function getDietaryRecommendations(analysis: BaziAnalysis) {
  const dayMasterElement = analysis.dayMasterElement;
  const recommendations = FOOD_RECOMMENDATIONS[dayMasterElement as keyof typeof FOOD_RECOMMENDATIONS];

  // 根据五行平衡度调整饮食建议
  const percentages = analysis.elementPercentages;
  const additionalFoods: string[] = [];
  const foodsToReduce: string[] = [];

  Object.entries(percentages).forEach(([element, percentage]) => {
    if (percentage < 15) {
      // 补充不足元素的食物
      const elementFoods = getElementFoods(element);
      additionalFoods.push(...elementFoods);
    } else if (percentage > 35) {
      // 减少过旺元素的食物
      const elementFoods = getElementFoods(element);
      foodsToReduce.push(...elementFoods);
    }
  });

  return {
    foodsToAdd: [...recommendations.add, ...additionalFoods],
    foodsToReduce: [...recommendations.reduce, ...foodsToReduce],
    cookingMethods: recommendations.methods,
    mealTiming: recommendations.timing
  };
}

/**
 * 获取元素对应食物
 */
function getElementFoods(element: string): string[] {
  const elementFoodMap = {
    wood: ['绿叶蔬菜', '豆制品', '全谷物', '绿茶'],
    fire: ['红色蔬果', '苦味食物', '豆类', '莲子'],
    earth: ['黄色食物', '根茎类', '小米', '南瓜'],
    metal: ['白色食物', '梨', '白萝卜', '银耳'],
    water: ['黑色食物', '海鲜', '核桃', '黑芝麻']
  };

  return elementFoodMap[element as keyof typeof elementFoodMap] || [];
}

/**
 * 获取运动推荐
 */
function getExerciseRecommendations(analysis: BaziAnalysis) {
  const dayMasterElement = analysis.dayMasterElement;
  const recommendations = EXERCISE_RECOMMENDATIONS[dayMasterElement as keyof typeof EXERCISE_RECOMMENDATIONS];

  // 根据日主强弱调整运动强度
  let intensity = recommendations.intensity;
  if (analysis.strength === 'strong') {
    intensity = '可以适当增加运动强度，注意不过度';
  } else if (analysis.strength === 'weak') {
    intensity = '降低运动强度，以温和运动为主';
  }

  return {
    bestActivities: recommendations.best,
    activitiesToAvoid: recommendations.avoid,
    optimalTime: recommendations.time,
    intensity
  };
}

/**
 * 获取情绪指导
 */
function getEmotionalGuidance(analysis: BaziAnalysis) {
  const dayMasterElement = analysis.dayMasterElement;
  const emotionalMap = {
    wood: {
      emotionalTendencies: ['易怒', '情绪波动', '急躁', '压力大'],
      stressManagement: ['深呼吸', '冥想', '瑜伽', '散步'],
      meditationFocus: '关注肝脏健康，练习慈悲冥想'
    },
    fire: {
      emotionalTendencies: ['焦虑', '兴奋', '急躁', '失眠'],
      stressManagement: ['冥想', '游泳', '音乐疗法', '规律作息'],
      meditationFocus: '关注心脏健康，练习平静冥想'
    },
    earth: {
      emotionalTendencies: ['思虑过度', '担忧', '犹豫不决', '消化不良'],
      stressManagement: ['园艺', '家务劳动', '社交活动', '规律作息'],
      meditationFocus: '关注脾胃健康，练习专注冥想'
    },
    metal: {
      emotionalTendencies: ['悲伤', '忧虑', '完美主义', '固执'],
      stressManagement: ['艺术创作', '音乐疗法', '呼吸训练', '户外活动'],
      meditationFocus: '关注肺部健康，练习放松冥想'
    },
    water: {
      emotionalTendencies: ['恐惧', '缺乏安全感', '记忆力减退', '畏寒'],
      stressManagement: ['温热运动', '社交活动', '规律作息', '心理咨询'],
      meditationFocus: '关注肾脏健康，练习安全感冥想'
    }
  };

  return emotionalMap[dayMasterElement as keyof typeof emotionalMap] || emotionalMap.earth;
}

/**
 * 获取季节调整建议
 */
function getSeasonalAdjustments(analysis: BaziAnalysis) {
  const dayMasterElement = analysis.dayMasterElement;

  const seasonalMap = {
    wood: {
      spring: '木旺于春，注意情绪调节，避免肝火过旺',
      summer: '火生木，注意心脑血管保护，多喝水',
      autumn: '金克木，注意呼吸道健康，增加户外活动',
      winter: '水生木，注意保暖，适当进补'
    },
    fire: {
      spring: '木生火，新陈代谢旺盛，注意控制饮食',
      summer: '火旺于夏，注意防暑降温，避免过度兴奋',
      autumn: '火克金，注意呼吸系统保护，保持心情平静',
      winter: '水克火，注意保暖，增加温补食物'
    },
    earth: {
      spring: '木克土，注意消化系统保护，规律饮食',
      summer: '火生土，新陈代谢活跃，注意饮食卫生',
      autumn: '土生金，呼吸系统相对稳定，增加户外活动',
      winter: '土克水，注意保暖，避免生冷食物'
    },
    metal: {
      spring: '金克木，注意情绪调节，增加户外活动',
      summer: '火克金，注意防暑降温，保持室内通风',
      autumn: '金旺于秋，呼吸系统敏感，注意空气质量',
      winter: '金生水，新陈代谢减缓，适当增加运动'
    },
    water: {
      spring: '水生木，新陈代谢开始活跃，注意调整作息',
      summer: '水克火，注意防暑降温，多喝水',
      autumn: '金生水，呼吸系统相对稳定，增加有氧运动',
      winter: '水旺于冬，注意保暖，增加温补食物'
    }
  };

  return seasonalMap[dayMasterElement as keyof typeof seasonalMap] || seasonalMap.earth;
}

/**
 * 生成综合分析报告
 */
export function generateComprehensiveReport(analysis: ComprehensiveAnalysis): string {
  let report = '=== 综合五行分析报告 ===\n\n';

  report += '1. 基本信息：\n';
  report += `   - 八字：${analysis.baziAnalysis.chart.year.stem}${analysis.baziAnalysis.chart.year.branch} ${analysis.baziAnalysis.chart.month.stem}${analysis.baziAnalysis.chart.month.branch} ${analysis.baziAnalysis.chart.day.stem}${analysis.baziAnalysis.chart.day.branch} ${analysis.baziAnalysis.chart.hour.stem}${analysis.baziAnalysis.chart.hour.branch}\n`;
  report += `   - 日主：${analysis.baziAnalysis.dayMaster}（${analysis.baziAnalysis.dayMasterElement}）\n`;
  report += `   - 体质类型：${analysis.healthImplications.constitutionalType}\n\n`;

  report += '2. 五行分析：\n';
  report += `   - 平衡度：${analysis.fiveElementsBalance.balance}\n`;
  report += `   - 最强元素：${analysis.fiveElementsBalance.dominantElement}\n`;
  report += `   - 最弱元素：${analysis.fiveElementsBalance.weakestElement}\n`;
  report += `   - 五行分布：`;
  Object.entries(analysis.baziAnalysis.elementPercentages).forEach(([element, percentage]) => {
    report += `${element}${percentage}% `;
  });
  report += '\n\n';

  report += '3. 健康建议：\n';
  report += `   - 健康优势：${analysis.healthImplications.healthStrengths.join('、')}\n`;
  report += `   - 健康隐患：${analysis.healthImplications.healthWeaknesses.join('、')}\n`;
  report += `   - 生活建议：${analysis.healthImplications.lifestyleRecommendations.join('、')}\n\n`;

  report += '4. 饮食指导：\n';
  report += `   - 推荐食物：${analysis.dietaryRecommendations.foodsToAdd.join('、')}\n`;
  report += `   - 减少食物：${analysis.dietaryRecommendations.foodsToReduce.join('、')}\n`;
  report += `   - 烹饪方式：${analysis.dietaryRecommendations.cookingMethods.join('、')}\n`;
  report += `   - 进餐时间：${analysis.dietaryRecommendations.mealTiming}\n\n`;

  report += '5. 运动建议：\n';
  report += `   - 推荐运动：${analysis.exerciseRecommendations.bestActivities.join('、')}\n`;
  report += `   - 避免运动：${analysis.exerciseRecommendations.activitiesToAvoid.join('、')}\n`;
  report += `   - 最佳时间：${analysis.exerciseRecommendations.optimalTime}\n`;
  report += `   - 运动强度：${analysis.exerciseRecommendations.intensity}\n\n`;

  report += '6. 情绪指导：\n';
  report += `   - 情绪特点：${analysis.emotionalGuidance.emotionalTendencies.join('、')}\n`;
  report += `   - 压力管理：${analysis.emotionalGuidance.stressManagement.join('、')}\n`;
  report += `   - 冥想重点：${analysis.emotionalGuidance.meditationFocus}\n\n`;

  report += '7. 季节调整：\n';
  report += `   - 春季：${analysis.seasonalAdjustments.spring}\n`;
  report += `   - 夏季：${analysis.seasonalAdjustments.summer}\n`;
  report += `   - 秋季：${analysis.seasonalAdjustments.autumn}\n`;
  report += `   - 冬季：${analysis.seasonalAdjustments.winter}\n`;

  return report;
}