// 八字命理学计算库
// 实现专业的先天五行分析算法

// 天干地支对照表
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

// 天干五行属性
const STEM_ELEMENTS = {
  '甲': 'wood', '乙': 'wood',
  '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth',
  '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water'
} as const;

// 地支五行属性
const BRANCH_ELEMENTS = {
  '子': 'water', '丑': 'earth',
  '寅': 'wood', '卯': 'wood',
  '辰': 'earth', '巳': 'fire',
  '午': 'fire', '未': 'earth',
  '申': 'metal', '酉': 'metal',
  '戌': 'earth', '亥': 'water'
} as const;

// 地支藏干（每个地支中隐藏的天干）
const BRANCH_HIDDEN_STEMS = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲']
} as const;

// 十二长生表（天干在各月份的状态）
const TWELVE_STAGES = {
  '甲': {
    '寅': '长生', '卯': '沐浴', '辰': '冠带', '巳': '临官', '午': '帝旺', '未': '衰',
    '申': '病', '酉': '死', '戌': '墓', '亥': '绝', '子': '胎', '丑': '养'
  },
  '丙': {
    '寅': '长生', '卯': '沐浴', '辰': '冠带', '巳': '临官', '午': '帝旺', '未': '衰',
    '申': '病', '酉': '死', '戌': '墓', '亥': '绝', '子': '胎', '丑': '养'
  },
  '戊': {
    '寅': '长生', '卯': '沐浴', '辰': '冠带', '巳': '临官', '午': '帝旺', '未': '衰',
    '申': '病', '酉': '死', '戌': '墓', '亥': '绝', '子': '胎', '丑': '养'
  },
  '庚': {
    '巳': '长生', '午': '沐浴', '未': '冠带', '申': '临官', '酉': '帝旺', '戌': '衰',
    '亥': '病', '子': '死', '丑': '墓', '寅': '绝', '卯': '胎', '辰': '养'
  },
  '壬': {
    '申': '长生', '酉': '沐浴', '戌': '冠带', '亥': '临官', '子': '帝旺', '丑': '衰',
    '寅': '病', '卯': '死', '辰': '墓', '巳': '绝', '午': '胎', '未': '养'
  }
} as const;

// 五行相生相克权重
const ELEMENT_WEIGHTS = {
  // 生（增加力量）
  generates: { 'wood': 1.2, 'fire': 1.2, 'earth': 1.2, 'metal': 1.2, 'water': 1.2 },
  // 克（减少力量）
  restricts: { 'wood': 0.8, 'fire': 0.8, 'earth': 0.8, 'metal': 0.8, 'water': 0.8 },
  // 同（增加力量）
  same: { 'wood': 1.5, 'fire': 1.5, 'earth': 1.5, 'metal': 1.5, 'water': 1.5 },
  // 泄（减少力量）
  leaks: { 'wood': 0.7, 'fire': 0.7, 'earth': 0.7, 'metal': 0.7, 'water': 0.7 },
  // 耗（减少力量）
  consumes: { 'wood': 0.9, 'fire': 0.9, 'earth': 0.9, 'metal': 0.9, 'water': 0.9 }
};

export interface BaziChart {
  year: { stem: string; branch: string };
  month: { stem: string; branch: string };
  day: { stem: string; branch: string };
  hour: { stem: string; branch: string };
}

export interface BaziAnalysis {
  chart: BaziChart;
  dayMaster: string;
  dayMasterElement: string;
  monthBranch: string;
  season: string;
  elementScores: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  elementPercentages: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  strength: 'strong' | 'weak' | 'balanced';
}

/**
 * 农历转公历的简化算法
 * 注意：这是一个简化版本，实际应用中建议使用专业的农历转换库
 */
function solarToLunar(year: number, month: number, day: number, hour: number): Date {
  // 这里使用简化的万年历算法
  // 实际项目中应该使用更精确的农历转换库
  return new Date(year, month - 1, day, hour);
}

/**
 * 计算年柱
 */
function getYearColumn(year: number): { stem: string; branch: string } {
  const stemIndex = (year - 4) % 10;
  const branchIndex = (year - 4) % 12;
  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex]
  };
}

/**
 * 计算月柱（根据节气）
 */
function getMonthColumn(year: number, month: number, day: number): { stem: string; branch: string } {
  // 简化的月柱计算（实际应该根据节气精确计算）
  const yearStemIndex = (year - 4) % 10;
  const monthStemIndex = ((yearStemIndex % 5) * 2 + month - 2) % 10;
  const branchIndex = (month + 2) % 12; // 从寅月开始

  return {
    stem: HEAVENLY_STEMS[monthStemIndex],
    branch: EARTHLY_BRANCHES[branchIndex]
  };
}

/**
 * 计算日柱（简化算法）
 */
function getDayColumn(date: Date): { stem: string; branch: string } {
  // 这是一个简化的日柱计算算法
  // 实际应该使用更精确的算法
  const baseDate = new Date(1900, 0, 31); // 1900年1月31日为甲子日
  const diffTime = Math.abs(date.getTime() - baseDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const stemIndex = diffDays % 10;
  const branchIndex = diffDays % 12;

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex]
  };
}

/**
 * 计算时柱
 */
function getHourColumn(dayStem: string, hour: number): { stem: string; branch: string } {
  const hourBranchIndex = Math.floor(hour / 2) % 12;
  const hourBranch = EARTHLY_BRANCHES[hourBranchIndex];

  // 根据日天干确定时天干起始
  const hourStemStartMap: Record<string, string> = {
    '甲': '己', '乙': '庚', '丙': '辛', '丁': '壬', '戊': '癸',
    '己': '甲', '庚': '乙', '辛': '丙', '壬': '丁', '癸': '戊'
  };

  const startStem = hourStemStartMap[dayStem] || '甲';
  const startStemIndex = HEAVENLY_STEMS.indexOf(startStem as any);
  const stemIndex = (startStemIndex + hourBranchIndex) % 10;

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: hourBranch
  };
}

/**
 * 获取季节信息
 */
function getSeason(monthBranch: string): { season: string; element: string } {
  const seasonMap: Record<string, { season: string; element: string }> = {
    '寅': { season: '春季', element: 'wood' },
    '卯': { season: '春季', element: 'wood' },
    '辰': { season: '暮春', element: 'earth' },
    '巳': { season: '夏季', element: 'fire' },
    '午': { season: '夏季', element: 'fire' },
    '未': { season: '季夏', element: 'earth' },
    '申': { season: '秋季', element: 'metal' },
    '酉': { season: '秋季', element: 'metal' },
    '戌': { season: '暮秋', element: 'earth' },
    '亥': { season: '冬季', element: 'water' },
    '子': { season: '冬季', element: 'water' },
    '丑': { season: '暮冬', element: 'earth' }
  };

  return seasonMap[monthBranch] || { season: '未知', element: 'earth' };
}

/**
 * 计算五行力量得分
 */
function calculateElementScores(chart: BaziChart, dayMasterElement: string, seasonElement: string): {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
} {
  const scores = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };

  // 收集所有天干地支及其藏干
  const allElements: string[] = [];

  // 添加四柱天干
  allElements.push(
    STEM_ELEMENTS[chart.year.stem as keyof typeof STEM_ELEMENTS],
    STEM_ELEMENTS[chart.month.stem as keyof typeof STEM_ELEMENTS],
    STEM_ELEMENTS[chart.day.stem as keyof typeof STEM_ELEMENTS],
    STEM_ELEMENTS[chart.hour.stem as keyof typeof STEM_ELEMENTS]
  );

  // 添加四柱地支
  allElements.push(
    BRANCH_ELEMENTS[chart.year.branch as keyof typeof BRANCH_ELEMENTS],
    BRANCH_ELEMENTS[chart.month.branch as keyof typeof BRANCH_ELEMENTS],
    BRANCH_ELEMENTS[chart.day.branch as keyof typeof BRANCH_ELEMENTS],
    BRANCH_ELEMENTS[chart.hour.branch as keyof typeof BRANCH_ELEMENTS]
  );

  // 添加地支藏干
  Object.values(chart).forEach(column => {
    const hiddenStems = BRANCH_HIDDEN_STEMS[column.branch as keyof typeof BRANCH_HIDDEN_STEMS];
    hiddenStems.forEach(stem => {
      allElements.push(STEM_ELEMENTS[stem as keyof typeof STEM_ELEMENTS]);
    });
  });

  // 计算基础分值
  allElements.forEach(element => {
    scores[element as keyof typeof scores] += 10;
  });

  // 根据月令进行加权（月令权重40%）
  const monthWeight = 1.4;
  scores[seasonElement as keyof typeof scores] *= monthWeight;

  // 根据日主状态进行加权
  const dayMasterWeight = 1.2;
  scores[dayMasterElement as keyof typeof scores] *= dayMasterWeight;

  // 根据五行生克关系进行最终调整
  const finalScores = adjustScoresByRelations(scores, dayMasterElement);

  return finalScores;
}

/**
 * 根据五行生克关系调整分数
 */
function adjustScoresByRelations(scores: any, dayMasterElement: string): any {
  const elementOrder = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
  const dayMasterIndex = elementOrder.indexOf(dayMasterElement as any);

  const adjustedScores = { ...scores };

  elementOrder.forEach((element, index) => {
    const currentScore = scores[element];

    // 同五行加强
    if (element === dayMasterElement) {
      adjustedScores[element] = currentScore * ELEMENT_WEIGHTS.same[element];
    }

    // 生我的加强
    const generatesIndex = (dayMasterIndex - 1 + 5) % 5;
    if (element === elementOrder[generatesIndex]) {
      adjustedScores[element] = currentScore * ELEMENT_WEIGHTS.generates[element];
    }

    // 克我的减弱
    const restrictsIndex = (dayMasterIndex - 2 + 5) % 5;
    if (element === elementOrder[restrictsIndex]) {
      adjustedScores[element] = currentScore * ELEMENT_WEIGHTS.restricts[element];
    }
  });

  return adjustedScores;
}

/**
 * 归一化分数为百分比
 */
function normalizeToPercentages(scores: { wood: number; fire: number; earth: number; metal: number; water: number }): {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
} {
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);

  if (total === 0) {
    return { wood: 20, fire: 20, earth: 20, metal: 20, water: 20 };
  }

  const percentages = {} as any;
  Object.entries(scores).forEach(([element, score]) => {
    percentages[element] = Math.round((score / total) * 100 * 10) / 10; // 保留一位小数
  });

  return percentages;
}

/**
 * 判断日主旺衰
 */
function determineDayMasterStrength(
  dayMasterElement: string,
  seasonElement: string,
  scores: { wood: number; fire: number; earth: number; metal: number; water: number }
): 'strong' | 'weak' | 'balanced' {
  const dayMasterScore = scores[dayMasterElement as keyof typeof scores];
  const averageScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / 5;

  // 日主得月令（在相同季节）为强
  const isInSeason = dayMasterElement === seasonElement;

  if (isInSeason && dayMasterScore > averageScore * 1.2) {
    return 'strong';
  } else if (!isInSeason && dayMasterScore < averageScore * 0.8) {
    return 'weak';
  } else {
    return 'balanced';
  }
}

/**
 * 主要的八字分析函数
 */
export function calculateBazi(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour: number
): BaziAnalysis {
  // 创建日期对象
  const date = new Date(birthYear, birthMonth - 1, birthDay, birthHour);

  // 计算四柱
  const yearColumn = getYearColumn(birthYear);
  const monthColumn = getMonthColumn(birthYear, birthMonth, birthDay);
  const dayColumn = getDayColumn(date);
  const hourColumn = getHourColumn(dayColumn.stem, birthHour);

  const chart: BaziChart = {
    year: yearColumn,
    month: monthColumn,
    day: dayColumn,
    hour: hourColumn
  };

  // 确定日主和五行属性
  const dayMaster = dayColumn.stem;
  const dayMasterElement = STEM_ELEMENTS[dayMaster as keyof typeof STEM_ELEMENTS];

  // 获取季节信息
  const { season, element: seasonElement } = getSeason(monthColumn.branch);

  // 计算五行得分
  const elementScores = calculateElementScores(chart, dayMasterElement, seasonElement);

  // 归一化为百分比
  const elementPercentages = normalizeToPercentages(elementScores);

  // 判断日主旺衰
  const strength = determineDayMasterStrength(dayMasterElement, seasonElement, elementScores);

  return {
    chart,
    dayMaster,
    dayMasterElement,
    monthBranch: monthColumn.branch,
    season,
    elementScores,
    elementPercentages,
    strength
  };
}

/**
 * 获取八字分析结果的中文描述
 */
export function getBaziDescription(analysis: BaziAnalysis): string {
  const { chart, dayMaster, season, elementPercentages, strength } = analysis;

  const elementNames = {
    wood: '木',
    fire: '火',
    earth: '土',
    metal: '金',
    water: '水'
  } as const;

  const strengthDescriptions = {
    strong: '强旺',
    weak: '衰弱',
    balanced: '平衡'
  };

  let description = `您的八字为：${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}\n\n`;
  description += `日主（代表您自己）是${dayMaster}，属${elementNames[analysis.dayMasterElement as keyof typeof elementNames]}。\n`;
  description += `出生在${season}，日主状态${strengthDescriptions[strength]}。\n\n`;

  description += '先天五行分布：\n';
  Object.entries(elementPercentages).forEach(([element, percentage]) => {
    const elementName = elementNames[element as keyof typeof elementNames];
    description += `${elementName}：${percentage}%\n`;
  });

  return description;
}