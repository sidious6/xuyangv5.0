import {
  FiveElementsAnalysis,
  FiveElementsAdvice,
  FiveElementsStats,
  BirthData,
  FIVE_ELEMENTS_RELATIONS
} from '@/types/five-elements';
import { calculateBazi, getBaziDescription } from './bazi-calculator';
import { analyzePostnatalFiveElements } from './postnatal-five-elements';

/**
 * 根据生辰计算基本五行分布（先天五行）
 */
export function calculateBasicFiveElements(birthData: BirthData): {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
} {
  const { birth_year, birth_month, birth_day, birth_hour } = birthData;

  try {
    // 使用专业的八字计算
    const baziAnalysis = calculateBazi(birth_year, birth_month, birth_day, birth_hour || 12);

    // 返回先天五行百分比
    return baziAnalysis.elementPercentages;
  } catch (error) {
    console.error('Error calculating Bazi:', error);
    // 如果计算失败，返回默认值
    return {
      wood: 20,
      fire: 20,
      earth: 20,
      metal: 20,
      water: 20
    };
  }
}

/**
 * 根据当日身体状态计算动态五行分布（后天五行）
 */
export function calculateDynamicFiveElements(dailyData: {
  sleep?: { duration?: string; feeling?: string };
  emotions?: Array<{ emoji?: string; intensity?: number }>;
  meals?: Array<{ feeling?: string }>;
  symptoms?: Array<{ body_part?: string; severity?: number }>;
}): {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
} {
  try {
    // 使用专业的后天五行分析
    const postnatalAnalysis = analyzePostnatalFiveElements(dailyData);

    // 返回后天五行百分比
    return postnatalAnalysis.elementPercentages;
  } catch (error) {
    console.error('Error calculating postnatal elements:', error);
    // 如果计算失败，返回默认值
    return {
      wood: 20,
      fire: 20,
      earth: 20,
      metal: 20,
      water: 20
    };
  }
}

/**
 * 计算五行平衡度
 */
export function calculateBalanceScore(elements: {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}): number {
  const values = Object.values(elements);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  // 平衡度计算：范围越小，平衡度越高
  const balance = Math.max(0, 100 - (range * 10));
  return Math.round(balance);
}

/**
 * 判断主要体质倾向
 */
export function determineConstitution(elements: {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}): { primary: string; secondary?: string } {
  const sortedEntries = Object.entries(elements)
    .sort(([,a], [,b]) => b - a);

  const primary = sortedEntries[0][0];
  const secondary = sortedEntries[1][0];

  // 判断虚实
  const avg = Object.values(elements).reduce((a, b) => a + b, 0) / 5;
  const isDeficient = elements[primary as keyof typeof elements] < avg;

  const constitutionMap = {
    wood: isDeficient ? 'wood_yin' : 'wood_yang',
    fire: isDeficient ? 'fire_yin' : 'fire_yang',
    earth: isDeficient ? 'earth_yin' : 'earth_yang',
    metal: isDeficient ? 'metal_yin' : 'metal_yang',
    water: isDeficient ? 'water_yin' : 'water_yang'
  };

  const secondaryType = secondary ? constitutionMap[secondary as keyof typeof constitutionMap] : undefined;

  return {
    primary: constitutionMap[primary as keyof typeof constitutionMap],
    secondary: secondaryType
  };
}

/**
 * 获取五行调理建议
 */
export function getFiveElementsAdvice(element: 'wood' | 'fire' | 'earth' | 'metal' | 'water'): FiveElementsAdvice {
  const relation = FIVE_ELEMENTS_RELATIONS.find(r => r.element === element)!;

  const adviceMap: Record<string, FiveElementsAdvice> = {
    wood: {
      element: 'wood',
      element_name: '木',
      advice_categories: {
        diet: [
          '多食绿色蔬菜，如菠菜、芹菜、西兰花',
          '适量酸味食物，如柠檬、山楂、酸梅',
          '少食油腻辛辣，避免过食肥甘'
        ],
        exercise: [
          '练习太极拳、八段锦等舒展运动',
          '多进行户外活动，接触大自然',
          '避免过度剧烈运动'
        ],
        lifestyle: [
          '保持规律作息，早睡早起',
          '避免熬夜，保证充足睡眠',
          '保持心情舒畅，避免抑郁'
        ],
        emotions: [
          '学会调节情绪，避免暴怒',
          '培养平和心态，保持乐观',
          '可通过冥想、听音乐放松心情'
        ],
        timing: [
          '卯时（5-7点）是肝经当令，适合运动',
          '丑时（1-3点）是肝经修复时间，应保证睡眠',
          '春季是养肝的最佳时节'
        ]
      },
      recommendations: {
        beneficial: ['绿色', '酸味', '东风', '春季', '清晨'],
        avoid: ['辛辣', '过度劳累', '情绪激动', '熬夜']
      },
      acupoints: ['太冲穴', '行间穴', '期门穴', '章门穴']
    },
    fire: {
      element: 'fire',
      element_name: '火',
      advice_categories: {
        diet: [
          '多食苦味食物，如苦瓜、莲子芯',
          '适量红色食物，如红枣、枸杞、红豆',
          '避免过食辛辣刺激食物'
        ],
        exercise: [
          '选择温和的运动方式，如散步、瑜伽',
          '避免在炎热天气剧烈运动',
          '运动后及时补充水分'
        ],
        lifestyle: [
          '避免过度劳累，注意劳逸结合',
          '保持心情愉悦，避免烦躁',
          '午时（11-13点）适当小憩'
        ],
        emotions: [
          '保持心情平和，避免过度兴奋',
          '学会缓解压力，避免焦虑',
          '培养恬淡虚无的心境'
        ],
        timing: [
          '午时（11-13点）是心经当令，适合休息',
          '午时后可进行轻松活动',
          '夏季是养心的最佳时节'
        ]
      },
      recommendations: {
        beneficial: ['红色', '苦味', '南风', '夏季', '中午'],
        avoid: ['过度兴奋', '辛辣刺激', '炎热环境', '熬夜']
      },
      acupoints: ['神门穴', '内关穴', '劳宫穴', '极泉穴']
    },
    earth: {
      element: 'earth',
      element_name: '土',
      advice_categories: {
        diet: [
          '多食黄色食物，如南瓜、小米、玉米',
          '适量甘味食物，如红枣、山药、莲子',
          '避免过食生冷油腻'
        ],
        exercise: [
          '选择适度的有氧运动，如快走、慢跑',
          '避免饭后立即运动',
          '运动强度要适中'
        ],
        lifestyle: [
          '规律饮食，避免暴饮暴食',
          '保持环境干燥，避免潮湿',
          '注意腹部保暖'
        ],
        emotions: [
          '避免过度思虑，学会放下',
          '保持心态平和，避免忧虑',
          '培养乐观开朗的性格'
        ],
        timing: [
          '辰时（7-9点）是胃经当令，适合早餐',
          '戌时（19-21点）是脾经当令，适合放松',
          '长夏季节是养脾的关键时期'
        ]
      },
      recommendations: {
        beneficial: ['黄色', '甘味', '中央', '长夏', '湿度适中'],
        avoid: ['生冷食物', '潮湿环境', '过度思虑', '饮食不规律']
      },
      acupoints: ['足三里', '三阴交', '脾俞穴', '胃俞穴']
    },
    metal: {
      element: 'metal',
      element_name: '金',
      advice_categories: {
        diet: [
          '多食白色食物，如百合、银耳、梨',
          '适量辛味食物，如生姜、葱、蒜',
          '避免过食辛辣干燥食物'
        ],
        exercise: [
          '进行深呼吸练习，增强肺功能',
          '选择户外有氧运动，如慢跑、快走',
          '避免在干燥环境中长时间运动'
        ],
        lifestyle: [
          '保持呼吸道健康，避免感冒',
          '保持环境湿度适宜，避免过干',
          '注意保暖，避免受凉'
        ],
        emotions: [
          '保持情绪稳定，避免悲伤',
          '培养开朗乐观的性格',
          '学会释放压力，避免压抑'
        ],
        timing: [
          '寅时（3-5点）是肺经当令，应保证睡眠',
          '申时（15-17点）是肺经活跃期，适合运动',
          '秋季是养肺的最佳时节'
        ]
      },
      recommendations: {
        beneficial: ['白色', '辛味', '西风', '秋季', '干燥'],
        avoid: ['过度悲伤', '干燥环境', '辛辣食物', '受凉']
      },
      acupoints: ['肺俞穴', '中府穴', '尺泽穴', '列缺穴']
    },
    water: {
      element: 'water',
      element_name: '水',
      advice_categories: {
        diet: [
          '多食黑色食物，如黑豆、黑芝麻、黑木耳',
          '适量咸味食物，如海带、紫菜、海盐',
          '避免过食生冷寒凉食物'
        ],
        exercise: [
          '选择温和的运动，如太极、瑜伽',
          '避免过度剧烈运动，以免耗损肾气',
          '运动后注意保暖，避免受凉'
        ],
        lifestyle: [
          '注意腰部和足部保暖',
          '避免过度劳累，节制房事',
          '保持充足睡眠，避免熬夜'
        ],
        emotions: [
          '避免过度恐惧和焦虑',
          '培养沉稳冷静的性格',
          '保持内心平静，避免惊恐'
        ],
        timing: [
          '酉时（17-19点）是肾经当令，适合休息',
          '子时（23-1点）是胆经当令，应保证睡眠',
          '冬季是养肾的最佳时节'
        ]
      },
      recommendations: {
        beneficial: ['黑色', '咸味', '北风', '冬季', '寒冷'],
        avoid: ['过度劳累', '受凉', '熬夜', '惊恐']
      },
      acupoints: ['肾俞穴', '涌泉穴', '太溪穴', '照海穴']
    }
  };

  return adviceMap[element];
}

/**
 * 生成完整的五行分析
 */
export function generateFiveElementsAnalysis(
  userId: string,
  birthData: BirthData,
  dailyData: any,
  date: string
): FiveElementsAnalysis {
  // 计算基本五行分布
  const basicElements = calculateBasicFiveElements(birthData);

  // 计算动态五行分布
  const dynamicElements = calculateDynamicFiveElements(dailyData);

  // 计算平衡度
  const balanceScore = calculateBalanceScore(dynamicElements);

  // 判断体质
  const constitution = determineConstitution(dynamicElements);

  return {
    id: '', // 将由数据库生成
    user_id: userId,
    date,
    basic_five_elements: basicElements,
    dynamic_five_elements: dynamicElements,
    balance_score: balanceScore,
    primary_constitution: constitution.primary,
    secondary_constitution: constitution.secondary,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}