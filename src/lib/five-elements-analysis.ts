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
          '属木体质特征：身材偏瘦、眼神明亮、易急躁或多思'
        ],
        exercise: [
          '木行平衡时：',
          '• 头发乌黑发亮、指甲光滑有月牙',
          '• 情绪舒展，遇事能快速"翻篇"，决策力强',
          '• 晨起口苦消失，眼睛不干涩'
        ],
        lifestyle: [
          '木行失衡信号：',
          '木不足(肝血虚)：容易头晕眼花、乳腺增生、月经偏少',
          '木过旺(肝火旺)：脾气暴躁、失眠多梦、偏头痛、眼屎多'
        ],
        emotions: [],
        timing: []
      },
      recommendations: {
        beneficial: ['疏肝理气', '养血柔肝', '清肝明目'],
        avoid: ['情绪激动', '熬夜', '过度思虑']
      },
      acupoints: ['太冲穴', '行间穴', '期门穴', '章门穴']
    },
    fire: {
      element: 'fire',
      element_name: '火',
      advice_categories: {
        diet: [
          '属火体质特征：面色红润、语速快、易兴奋或心悸'
        ],
        exercise: [
          '火行平衡时：',
          '• 面色透亮有光泽，舌色淡红均匀',
          '• 睡眠深稳，晨起精神饱满',
          '• 思维敏捷，人际互动热情适度'
        ],
        lifestyle: [
          '火行失衡信号：',
          '火不足(心阳虚)：心悸气短、手脚冰凉、舌淡苔白',
          '火过旺(心火旺)：舌尖溃疡、失眠多梦、掌心发热、口舌生疮'
        ],
        emotions: [],
        timing: []
      },
      recommendations: {
        beneficial: ['养心安神', '清心降火', '温通心阳'],
        avoid: ['过度兴奋', '辛辣刺激', '情绪波动']
      },
      acupoints: ['神门穴', '内关穴', '劳宫穴', '极泉穴']
    },
    earth: {
      element: 'earth',
      element_name: '土',
      advice_categories: {
        diet: [
          '属土体质特征：肌肉饱满、面色萎黄、易思虑过度'
        ],
        exercise: [
          '土行平衡时：',
          '• 食欲正常，吃生冷不腹泻',
          '• 肌肉紧实有力，唇色淡红润泽',
          '• 情绪稳定，不轻易"杞人忧天"'
        ],
        lifestyle: [
          '土行失衡信号：',
          '土不足(脾虚)：腹胀便溏、四肢无力、月经量少色淡',
          '土过旺(湿困脾)：痰多黏腻、身体困重、舌苔厚白'
        ],
        emotions: [],
        timing: []
      },
      recommendations: {
        beneficial: ['健脾益气', '燥湿化痰', '温中健脾'],
        avoid: ['生冷食物', '过度思虑', '暴饮暴食']
      },
      acupoints: ['足三里', '三阴交', '脾俞穴', '胃俞穴']
    },
    metal: {
      element: 'metal',
      element_name: '金',
      advice_categories: {
        diet: [
          '属金体质特征：皮肤偏白、说话声音清亮、易呼吸道敏感'
        ],
        exercise: [
          '金行平衡时：',
          '• 呼吸深长均匀，换季不咳嗽、喉咙清爽',
          '• 皮肤细腻有光泽，大便规律成型',
          '• 情绪通透，能理性处理"告别"类场景'
        ],
        lifestyle: [
          '金行失衡信号：',
          '金不足(肺气虚)：容易感冒、气短懒言、皮肤干燥脱屑',
          '金过旺(肺有热)：咳黄痰、鼻腔干燥、莫名悲伤焦虑'
        ],
        emotions: [],
        timing: []
      },
      recommendations: {
        beneficial: ['润肺养阴', '清肺化痰', '补肺益气'],
        avoid: ['悲伤情绪', '干燥环境', '空气污染']
      },
      acupoints: ['肺俞穴', '中府穴', '尺泽穴', '列缺穴']
    },
    water: {
      element: 'water',
      element_name: '水',
      advice_categories: {
        diet: [
          '属水体质特征：肤色偏黑、记忆力强、易怕冷或潮热'
        ],
        exercise: [
          '水行平衡时：',
          '• 头发浓密有弹性',
          '• 夜尿少、腰膝有力，冬季手脚温暖',
          '• 专注力强，遇事沉稳不慌'
        ],
        lifestyle: [
          '水行失衡信号：',
          '水不足(肾阴虚)：口干舌燥、失眠盗汗、足跟痛、脱发',
          '水过旺(肾阳虚)：水肿虚胖、尿频清长、性欲减退、五更泄泻'
        ],
        emotions: [],
        timing: []
      },
      recommendations: {
        beneficial: ['补肾益精', '滋阴降火', '温肾助阳'],
        avoid: ['过度劳累', '熬夜', '房事过度']
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