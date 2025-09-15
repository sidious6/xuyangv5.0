// 五行分析相关类型定义

export interface FiveElementsAnalysis {
  id: string;
  user_id: string;
  date: string;
  // 基于生辰的基本五行分布（固定值）
  basic_five_elements: {
    wood: number;     // 木
    fire: number;     // 火
    earth: number;    // 土
    metal: number;    // 金
    water: number;    // 水
  };
  // 基于当日身体状态的动态五行分布
  dynamic_five_elements: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  // 五行平衡度 (0-100)
  balance_score: number;
  // 主要体质倾向
  primary_constitution: string;
  // 次要体质倾向
  secondary_constitution?: string;
  // 分析时间
  created_at: string;
  updated_at: string;
}

export interface FiveElementsAdvice {
  element: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  element_name: string;
  // 调理建议分类
  advice_categories: {
    diet: string[];        // 饮食建议
    exercise: string[];    // 运动建议
    lifestyle: string[];   // 生活建议
    emotions: string[];    // 情绪调节
    timing: string[];      // 时辰建议
  };
  // 宜忌
  recommendations: {
    beneficial: string[];  // 宜
    avoid: string[];       // 忌
  };
  // 经络穴位建议
  acupoints?: string[];
}

export interface FiveElementsStats {
  user_id: string;
  // 统计时间段
  period: 'week' | 'month' | 'quarter' | 'year';
  // 平均五行分布
  average_distribution: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  // 趋势数据
  trends: Array<{
    date: string;
    basic_distribution: {
      wood: number;
      fire: number;
      earth: number;
      metal: number;
      water: number;
    };
    dynamic_distribution: {
      wood: number;
      fire: number;
      earth: number;
      metal: number;
      water: number;
    };
    balance_score: number;
  }>;
  // 体质变化趋势
  constitution_trends: Array<{
    date: string;
    primary: string;
    secondary?: string;
  }>;
  created_at: string;
}

// 五行相克关系
export interface FiveElementsRelation {
  element: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  name: string;
  color: string;
  generates: string;      // 生（相生）
  restricts: string;     // 克（相克）
  generated_by: string;   // 被生
  restricted_by: string;  // 被克
  characteristics: string[];
  body_parts: string[];
  emotions: string[];
  seasons: string[];
  directions: string[];
}

// 预定义的五行关系数据
export const FIVE_ELEMENTS_RELATIONS: FiveElementsRelation[] = [
  {
    element: 'wood',
    name: '木',
    color: '#22c55e',
    generates: 'fire',      // 木生火
    restricts: 'earth',     // 木克土
    generated_by: 'water',  // 水生木
    restricted_by: 'metal', // 金克木
    characteristics: ['生长', '生发', '条达', '舒畅'],
    body_parts: ['肝', '胆', '筋', '目'],
    emotions: ['怒', '喜'],
    seasons: ['春季'],
    directions: ['东方']
  },
  {
    element: 'fire',
    name: '火',
    color: '#dc2626',
    generates: 'earth',     // 火生土
    restricts: 'metal',     // 火克金
    generated_by: 'wood',   // 木生火
    restricted_by: 'water', // 水克火
    characteristics: ['温热', '向上', '明亮', '化育'],
    body_parts: ['心', '小肠', '脉', '舌'],
    emotions: ['喜', '惊'],
    seasons: ['夏季'],
    directions: ['南方']
  },
  {
    element: 'earth',
    name: '土',
    color: '#eab308',
    generates: 'metal',     // 土生金
    restricts: 'water',     // 土克水
    generated_by: 'fire',   // 火生土
    restricted_by: 'wood',  // 木克土
    characteristics: ['承载', '生化', '受纳', '养育'],
    body_parts: ['脾', '胃', '肉', '口'],
    emotions: ['思', '忧'],
    seasons: ['长夏'],
    directions: ['中央']
  },
  {
    element: 'metal',
    name: '金',
    color: '#ffffff',
    generates: 'water',     // 金生水
    restricts: 'wood',      // 金克木
    generated_by: 'earth',  // 土生金
    restricted_by: 'fire',  // 火克金
    characteristics: ['沉降', '收敛', '清洁', '肃降'],
    body_parts: ['肺', '大肠', '皮', '鼻'],
    emotions: ['悲', '怒'],
    seasons: ['秋季'],
    directions: ['西方']
  },
  {
    element: 'water',
    name: '水',
    color: '#1f2937',
    generates: 'wood',      // 水生木
    restricts: 'fire',      // 水克火
    generated_by: 'metal',  // 金生水
    restricted_by: 'earth', // 土克水
    characteristics: ['寒凉', '滋润', '向下', '闭藏'],
    body_parts: ['肾', '膀胱', '骨', '耳'],
    emotions: ['恐', '思'],
    seasons: ['冬季'],
    directions: ['北方']
  }
];

// 生辰五行计算相关类型
export interface BirthData {
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour?: number;
  gender: 'male' | 'female';
}

// 体质类型映射
export const CONSTITUTION_TYPES = {
  wood_yin: '木虚体质',
  wood_yang: '木旺体质',
  fire_yin: '火虚体质',
  fire_yang: '火旺体质',
  earth_yin: '土虚体质',
  earth_yang: '土旺体质',
  metal_yin: '金虚体质',
  metal_yang: '金旺体质',
  water_yin: '水虚体质',
  water_yang: '水旺体质',
  balanced: '平衡体质'
} as const;

export type ConstitutionType = keyof typeof CONSTITUTION_TYPES;