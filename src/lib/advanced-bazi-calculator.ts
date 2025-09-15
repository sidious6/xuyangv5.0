import { BaziChart, BaziAnalysis } from './bazi-calculator';

// 天干地支对照表
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

// 节气时间表（简化版，实际应用中需要精确的节气时间）
const SOLAR_TERMS = {
  '立春': [2, 4], '雨水': [2, 19], '惊蛰': [3, 6], '春分': [3, 21],
  '清明': [4, 5], '谷雨': [4, 20], '立夏': [5, 6], '小满': [5, 21],
  '芒种': [6, 6], '夏至': [6, 21], '小暑': [7, 7], '大暑': [7, 23],
  '立秋': [8, 8], '处暑': [8, 23], '白露': [9, 8], '秋分': [9, 23],
  '寒露': [10, 8], '霜降': [10, 23], '立冬': [11, 8], '小雪': [11, 23],
  '大雪': [12, 7], '冬至': [12, 22], '小寒': [1, 6], '大寒': [1, 20]
};

// 扩展的五行关系权重
const ELEMENT_RELATIONS = {
  // 旺相休囚死权重
  prosperous: { wood: 2.0, fire: 1.5, earth: 0.5, metal: 0.3, water: 0.8 },
  // 相
  growing: { wood: 1.2, fire: 1.0, earth: 0.8, metal: 0.6, water: 1.2 },
  // 休
  resting: { wood: 0.8, fire: 0.8, earth: 1.0, metal: 1.2, water: 0.6 },
  // 囚
  imprisoned: { wood: 0.6, fire: 0.6, earth: 1.2, metal: 1.5, water: 0.4 },
  // 死
  dead: { wood: 0.4, fire: 0.4, earth: 1.5, metal: 2.0, water: 0.3 }
};

// 地支藏干详细权重（根据传统命理学）
const BRANCH_HIDDEN_STEMS_WEIGHTS = {
  '子': { '癸': 0.8 },
  '丑': { '己': 0.5, '癸': 0.3, '辛': 0.2 },
  '寅': { '甲': 0.6, '丙': 0.3, '戊': 0.1 },
  '卯': { '乙': 1.0 },
  '辰': { '戊': 0.5, '乙': 0.3, '癸': 0.2 },
  '巳': { '丙': 0.6, '庚': 0.2, '戊': 0.2 },
  '午': { '丁': 0.7, '己': 0.3 },
  '未': { '己': 0.5, '丁': 0.3, '乙': 0.2 },
  '申': { '庚': 0.6, '壬': 0.2, '戊': 0.2 },
  '酉': { '辛': 1.0 },
  '戌': { '戊': 0.5, '辛': 0.3, '丁': 0.2 },
  '亥': { '壬': 0.7, '甲': 0.3 }
};

// 十二长生状态权重
const TWELVE_STAGES_WEIGHTS = {
  '长生': 1.8,
  '沐浴': 1.2,
  '冠带': 1.5,
  '临官': 2.0,
  '帝旺': 2.5,
  '衰': 0.8,
  '病': 0.6,
  '死': 0.4,
  '墓': 0.3,
  '绝': 0.2,
  '胎': 0.5,
  '养': 0.7
};

// 天干地支五行属性
const STEM_ELEMENTS = {
  '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth', '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water'
} as const;

const BRANCH_ELEMENTS = {
  '子': 'water', '丑': 'earth', '寅': 'wood', '卯': 'wood',
  '辰': 'earth', '巳': 'fire', '午': 'fire', '未': 'earth',
  '申': 'metal', '酉': 'metal', '戌': 'earth', '亥': 'water'
} as const;

// 详细的十二长生表
const TWELVE_STAGES_DETAILS = {
  '甲': {
    '寅': '长生', '卯': '沐浴', '辰': '冠带', '巳': '临官', '午': '帝旺', '未': '衰',
    '申': '病', '酉': '死', '戌': '墓', '亥': '绝', '子': '胎', '丑': '养'
  },
  '乙': {
    '午': '长生', '巳': '沐浴', '辰': '冠带', '卯': '临官', '寅': '帝旺', '丑': '衰',
    '子': '病', '亥': '死', '戌': '墓', '酉': '绝', '申': '胎', '未': '养'
  },
  '丙': {
    '寅': '长生', '卯': '沐浴', '辰': '冠带', '巳': '临官', '午': '帝旺', '未': '衰',
    '申': '病', '酉': '死', '戌': '墓', '亥': '绝', '子': '胎', '丑': '养'
  },
  '丁': {
    '酉': '长生', '申': '沐浴', '未': '冠带', '午': '临官', '巳': '帝旺', '辰': '衰',
    '卯': '病', '寅': '死', '丑': '墓', '子': '绝', '亥': '胎', '戌': '养'
  },
  '戊': {
    '寅': '长生', '卯': '沐浴', '辰': '冠带', '巳': '临官', '午': '帝旺', '未': '衰',
    '申': '病', '酉': '死', '戌': '墓', '亥': '绝', '子': '胎', '丑': '养'
  },
  '己': {
    '酉': '长生', '申': '沐浴', '未': '冠带', '午': '临官', '巳': '帝旺', '辰': '衰',
    '卯': '病', '寅': '死', '丑': '墓', '子': '绝', '亥': '胎', '戌': '养'
  },
  '庚': {
    '巳': '长生', '午': '沐浴', '未': '冠带', '申': '临官', '酉': '帝旺', '戌': '衰',
    '亥': '病', '子': '死', '丑': '墓', '寅': '绝', '卯': '胎', '辰': '养'
  },
  '辛': {
    '子': '长生', '亥': '沐浴', '戌': '冠带', '酉': '临官', '申': '帝旺', '未': '衰',
    '午': '病', '巳': '死', '辰': '墓', '卯': '绝', '寅': '胎', '丑': '养'
  },
  '壬': {
    '申': '长生', '酉': '沐浴', '戌': '冠带', '亥': '临官', '子': '帝旺', '丑': '衰',
    '寅': '病', '卯': '死', '辰': '墓', '巳': '绝', '午': '胎', '未': '养'
  },
  '癸': {
    '卯': '长生', '寅': '沐浴', '丑': '冠带', '子': '临官', '亥': '帝旺', '戌': '衰',
    '酉': '病', '申': '死', '未': '墓', '午': '绝', '巳': '胎', '辰': '养'
  }
} as const;

/**
 * 获取节气信息
 */
function getSolarTerm(year: number, month: number, day: number): { term: string; monthBranch: string } {
  // 简化的节气判断，实际应用中需要精确计算
  const monthToBranch = {
    2: '寅', 3: '卯', 4: '辰', 5: '巳', 6: '午', 7: '未',
    8: '申', 9: '酉', 10: '戌', 11: '亥', 12: '子', 1: '丑'
  };

  const termKeys = Object.keys(SOLAR_TERMS) as Array<keyof typeof SOLAR_TERMS>;
  for (const term of termKeys) {
    const [termMonth, termDay] = SOLAR_TERMS[term];
    if (month === termMonth && day >= termDay) {
      return { term, monthBranch: monthToBranch[month as keyof typeof monthToBranch] || '寅' };
    }
  }

  // 如果没有找到对应节气，使用月份对应的地支
  return { term: '未知', monthBranch: monthToBranch[month as keyof typeof monthToBranch] || '寅' };
}

/**
 * 高级五行力量计算
 */
function calculateAdvancedElementScores(
  chart: BaziChart,
  dayMaster: string,
  dayMasterElement: string,
  monthBranch: string
): {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
} {
  const scores = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };

  // 1. 计算天干基础分（天干权重较高）
  const columns = ['year', 'month', 'day', 'hour'] as const;
  columns.forEach(column => {
    const stem = chart[column].stem;
    const element = STEM_ELEMENTS[stem as keyof typeof STEM_ELEMENTS];
    scores[element] += 15; // 天干基础分
  });

  // 2. 计算地支基础分
  columns.forEach(column => {
    const branch = chart[column].branch;
    const element = BRANCH_ELEMENTS[branch as keyof typeof BRANCH_ELEMENTS];
    scores[element] += 10; // 地支基础分
  });

  // 3. 计算地支藏干分数（加权计算）
  columns.forEach(column => {
    const branch = chart[column].branch;
    const hiddenStems = BRANCH_HIDDEN_STEMS_WEIGHTS[branch as keyof typeof BRANCH_HIDDEN_STEMS_WEIGHTS];
    if (hiddenStems) {
      Object.entries(hiddenStems).forEach(([stem, weight]) => {
        const element = STEM_ELEMENTS[stem as keyof typeof STEM_ELEMENTS];
        scores[element] += 8 * weight; // 藏干基础分 × 权重
      });
    }
  });

  // 4. 月令影响（最重要的因素）
  const monthElement = BRANCH_ELEMENTS[monthBranch as keyof typeof BRANCH_ELEMENTS];
  applySeasonalInfluence(scores, monthElement, dayMasterElement);

  // 5. 日主十二长生状态影响
  const dayMasterStage = TWELVE_STAGES_DETAILS[dayMaster as keyof typeof TWELVE_STAGES_DETAILS];
  if (dayMasterStage && dayMasterStage[monthBranch as keyof typeof dayMasterStage]) {
    const stage = dayMasterStage[monthBranch as keyof typeof dayMasterStage];
    const stageWeight = TWELVE_STAGES_WEIGHTS[stage as keyof typeof TWELVE_STAGES_WEIGHTS];
    scores[dayMasterElement] *= stageWeight;
  }

  // 6. 五行生克关系调整
  applyElementRelations(scores, dayMasterElement);

  // 7. 天干合化影响
  applyHeavenlyStemCombinations(scores, chart);

  // 8. 地支合化影响
  applyEarthlyBranchCombinations(scores, chart);

  return scores;
}

/**
 * 应用季节影响（旺相休囚死）
 */
function applySeasonalInfluence(
  scores: any,
  seasonElement: string,
  dayMasterElement: string
): void {
  const elementOrder = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
  const seasonIndex = elementOrder.indexOf(seasonElement as any);

  // 根据五行相生顺序确定各元素的状态
  elementOrder.forEach((element, index) => {
    let state: keyof typeof ELEMENT_RELATIONS;

    if (index === seasonIndex) {
      state = 'prosperous'; // 旺
    } else if (index === (seasonIndex + 1) % 5) {
      state = 'growing'; // 相
    } else if (index === (seasonIndex + 2) % 5) {
      state = 'resting'; // 休
    } else if (index === (seasonIndex + 3) % 5) {
      state = 'imprisoned'; // 囚
    } else {
      state = 'dead'; // 死
    }

    scores[element] *= ELEMENT_RELATIONS[state][element];
  });
}

/**
 * 应用五行生克关系
 */
function applyElementRelations(scores: any, dayMasterElement: string): void {
  const elementOrder = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
  const dayMasterIndex = elementOrder.indexOf(dayMasterElement as any);

  elementOrder.forEach((element, index) => {
    // 同五行加强
    if (element === dayMasterElement) {
      scores[element] *= 1.3;
    }

    // 生我的加强
    const generatesIndex = (dayMasterIndex - 1 + 5) % 5;
    if (index === generatesIndex) {
      scores[element] *= 1.1;
    }

    // 克我的减弱
    const restrictsIndex = (dayMasterIndex - 2 + 5) % 5;
    if (index === restrictsIndex) {
      scores[element] *= 0.9;
    }

    // 我克的减弱
    const restrictsByMeIndex = (dayMasterIndex + 2) % 5;
    if (index === restrictsByMeIndex) {
      scores[element] *= 0.95;
    }
  });
}

/**
 * 应用天干合化
 */
function applyHeavenlyStemCombinations(scores: any, chart: BaziChart): void {
  const combinations = [
    { stems: ['甲', '己'], element: 'earth', weight: 1.2 },
    { stems: ['乙', '庚'], element: 'metal', weight: 1.2 },
    { stems: ['丙', '辛'], element: 'water', weight: 1.2 },
    { stems: ['丁', '壬'], element: 'wood', weight: 1.2 },
    { stems: ['戊', '癸'], element: 'fire', weight: 1.2 }
  ];

  const allStems = [
    chart.year.stem, chart.month.stem, chart.day.stem, chart.hour.stem
  ];

  combinations.forEach(comb => {
    if (allStems.includes(comb.stems[0]) && allStems.includes(comb.stems[1])) {
      scores[comb.element] *= comb.weight;
    }
  });
}

/**
 * 应用地支合化
 */
function applyEarthlyBranchCombinations(scores: any, chart: BaziChart): void {
  const combinations = [
    { branches: ['子', '丑'], element: 'earth', weight: 1.1 },
    { branches: ['寅', '亥'], element: 'wood', weight: 1.1 },
    { branches: ['卯', '戌'], element: 'fire', weight: 1.1 },
    { branches: ['辰', '酉'], element: 'metal', weight: 1.1 },
    { branches: ['巳', '申'], element: 'water', weight: 1.1 },
    { branches: ['午', '未'], element: 'earth', weight: 1.1 }
  ];

  const allBranches = [
    chart.year.branch, chart.month.branch, chart.day.branch, chart.hour.branch
  ];

  combinations.forEach(comb => {
    if (allBranches.includes(comb.branches[0]) && allBranches.includes(comb.branches[1])) {
      scores[comb.element] *= comb.weight;
    }
  });
}

/**
 * 高级八字分析函数
 */
export function calculateAdvancedBazi(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour: number
): BaziAnalysis {
  // 复用基础的八字排盘算法
  const date = new Date(birthYear, birthMonth - 1, birthDay, birthHour);

  // 计算四柱
  const yearColumn = {
    stem: HEAVENLY_STEMS[(birthYear - 4) % 10],
    branch: EARTHLY_BRANCHES[(birthYear - 4) % 12]
  };

  const monthColumn = {
    stem: HEAVENLY_STEMS[((birthYear - 4) % 5) * 2 + (birthMonth - 2) % 10],
    branch: EARTHLY_BRANCHES[(birthMonth + 2) % 12]
  };

  const baseDate = new Date(1900, 0, 31);
  const diffDays = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  const dayColumn = {
    stem: HEAVENLY_STEMS[diffDays % 10],
    branch: EARTHLY_BRANCHES[diffDays % 12]
  };

  const hourStemStart = { '甲': '己', '乙': '庚', '丙': '辛', '丁': '壬', '戊': '癸', '己': '甲', '庚': '乙', '辛': '丙', '壬': '丁', '癸': '戊' };
  const hourBranchIndex = Math.floor(birthHour / 2) % 12;
  const startStemIndex = HEAVENLY_STEMS.indexOf(hourStemStart[dayColumn.stem as keyof typeof hourStemStart] as any);
  const hourColumn = {
    stem: HEAVENLY_STEMS[(startStemIndex + hourBranchIndex) % 10],
    branch: EARTHLY_BRANCHES[hourBranchIndex]
  };

  const chart: BaziChart = {
    year: yearColumn,
    month: monthColumn,
    day: dayColumn,
    hour: hourColumn
  };

  // 确定日主和五行属性
  const dayMaster = dayColumn.stem;
  const dayMasterElement = STEM_ELEMENTS[dayMaster as keyof typeof STEM_ELEMENTS];

  // 获取节气和季节信息
  const { term, monthBranch } = getSolarTerm(birthYear, birthMonth, birthDay);
  const seasonMap: Record<string, string> = {
    '寅': '春季', '卯': '春季', '辰': '春季',
    '巳': '夏季', '午': '夏季', '未': '夏季',
    '申': '秋季', '酉': '秋季', '戌': '秋季',
    '亥': '冬季', '子': '冬季', '丑': '冬季'
  };

  // 使用高级算法计算五行得分
  const elementScores = calculateAdvancedElementScores(chart, dayMaster, dayMasterElement, monthBranch);

  const total = Object.values(elementScores).reduce((sum, score) => sum + (score || 0), 0);
  const elementPercentages = {
    wood: total > 0 ? Math.round((elementScores.wood / total) * 1000) / 10 : 20,
    fire: total > 0 ? Math.round((elementScores.fire / total) * 1000) / 10 : 20,
    earth: total > 0 ? Math.round((elementScores.earth / total) * 1000) / 10 : 20,
    metal: total > 0 ? Math.round((elementScores.metal / total) * 1000) / 10 : 20,
    water: total > 0 ? Math.round((elementScores.water / total) * 1000) / 10 : 20
  };

  // 判断日主旺衰（基于多个因素）
  const dayMasterScore = elementScores[dayMasterElement as keyof typeof elementScores];
  const averageScore = total / 5;
  const monthElement = BRANCH_ELEMENTS[monthBranch as keyof typeof BRANCH_ELEMENTS];
  const isMonthElementSame = dayMasterElement === monthElement;

  let strength: 'strong' | 'weak' | 'balanced';
  if (isMonthElementSame && dayMasterScore > averageScore * 1.3) {
    strength = 'strong';
  } else if (!isMonthElementSame && dayMasterScore < averageScore * 0.7) {
    strength = 'weak';
  } else {
    strength = 'balanced';
  }

  return {
    chart,
    dayMaster,
    dayMasterElement,
    monthBranch,
    season: seasonMap[monthBranch] || '未知',
    elementScores,
    elementPercentages,
    strength
  };
}

/**
 * 获取详细的八字分析报告
 */
export function getAdvancedBaziDescription(analysis: BaziAnalysis): string {
  const { chart, dayMaster, season, elementPercentages, strength } = analysis;

  const elementNames = {
    wood: '木', fire: '火', earth: '土', metal: '金', water: '水'
  } as const;

  const strengthDescriptions = {
    strong: '强旺',
    weak: '衰弱',
    balanced: '平衡'
  };

  let description = `=== 高级八字分析报告 ===\n\n`;
  description += `八字：${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}\n\n`;
  description += `日主：${dayMaster}（${elementNames[analysis.dayMasterElement as keyof typeof elementNames]}）\n`;
  description += `出生季节：${season}\n`;
  description += `日主状态：${strengthDescriptions[strength]}\n\n`;

  description += `=== 先天五行力量分布 ===\n`;
  Object.entries(elementPercentages).forEach(([element, percentage]) => {
    const elementName = elementNames[element as keyof typeof elementNames];
    description += `${elementName}：${percentage}%\n`;
  });

  // 添加五行平衡建议
  description += `\n=== 五行平衡建议 ===\n`;
  const maxElement = Object.entries(elementPercentages).reduce((a, b) =>
    elementPercentages[a[0] as keyof typeof elementPercentages] > elementPercentages[b[0] as keyof typeof elementPercentages] ? a : b
  );
  const minElement = Object.entries(elementPercentages).reduce((a, b) =>
    elementPercentages[a[0] as keyof typeof elementPercentages] < elementPercentages[b[0] as keyof typeof elementPercentages] ? a : b
  );

  description += `最强五行：${elementNames[maxElement[0] as keyof typeof elementNames]} (${maxElement[1]}%)\n`;
  description += `最弱五行：${elementNames[minElement[0] as keyof typeof elementNames]} (${minElement[1]}%)\n`;

  if (strength === 'strong') {
    description += `日主强旺，建议补充${elementNames[minElement[0] as keyof typeof elementNames]}等元素来平衡。\n`;
  } else if (strength === 'weak') {
    description += `日主衰弱，建议加强${elementNames[analysis.dayMasterElement as keyof typeof elementNames]}等元素。\n`;
  } else {
    description += `五行相对平衡，保持现有状态即可。\n`;
  }

  return description;
}