// 后天五行分析系统
// 基于内观数据的五行症状分析

export interface SymptomTag {
  element: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  category: 'emotion' | 'physical' | 'tongue' | 'lifestyle';
  symptom: string;
  severity: number; // 1-10
}

export interface QuestionnaireQuestion {
  id: string;
  question: string;
  category: string;
  options: Array<{
    text: string;
    score: number;
    element: string;
  }>;
}

export interface PostnatalAnalysis {
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
  dominantElement: string;
  recommendations: {
    strengthening: string[];
    balancing: string[];
  };
}

// 五行症状标签库
const SYMPTOM_LIBRARY: Record<string, SymptomTag[]> = {
  wood: [
    // 情绪症状
    { element: 'wood', category: 'emotion', symptom: '易怒', severity: 7 },
    { element: 'wood', category: 'emotion', symptom: '焦虑', severity: 6 },
    { element: 'wood', category: 'emotion', symptom: '压抑', severity: 6 },
    { element: 'wood', category: 'emotion', symptom: '情绪波动大', severity: 5 },

    // 身体症状
    { element: 'wood', category: 'physical', symptom: '眼睛干涩', severity: 5 },
    { element: 'wood', category: 'physical', symptom: '抽筋', severity: 6 },
    { element: 'wood', category: 'physical', symptom: '胁肋胀痛', severity: 7 },
    { element: 'wood', category: 'physical', symptom: '偏头痛', severity: 6 },
    { element: 'wood', category: 'physical', symptom: '颈椎不适', severity: 5 },
    { element: 'wood', category: 'physical', symptom: '指甲脆弱', severity: 4 },

    // 舌象
    { element: 'wood', category: 'tongue', symptom: '舌边红', severity: 6 },
    { element: 'wood', category: 'tongue', symptom: '舌边有齿痕', severity: 5 },
    { element: 'wood', category: 'tongue', symptom: '舌苔薄白', severity: 3 }
  ],

  fire: [
    // 情绪症状
    { element: 'fire', category: 'emotion', symptom: '心烦', severity: 6 },
    { element: 'fire', category: 'emotion', symptom: '失眠', severity: 7 },
    { element: 'fire', category: 'emotion', symptom: '多梦', severity: 5 },
    { element: 'fire', category: 'emotion', symptom: '心悸', severity: 6 },
    { element: 'fire', category: 'emotion', symptom: '健忘', severity: 4 },

    // 身体症状
    { element: 'fire', category: 'physical', symptom: '口腔溃疡', severity: 7 },
    { element: 'fire', category: 'physical', symptom: '口干舌燥', severity: 6 },
    { element: 'fire', category: 'physical', symptom: '心慌', severity: 6 },
    { element: 'fire', category: 'physical', symptom: '面红', severity: 5 },
    { element: 'fire', category: 'physical', symptom: '小便黄', severity: 4 },

    // 舌象
    { element: 'fire', category: 'tongue', symptom: '舌尖红', severity: 7 },
    { element: 'fire', category: 'tongue', symptom: '舌尖有芒刺', severity: 6 },
    { element: 'fire', category: 'tongue', symptom: '舌苔黄', severity: 5 }
  ],

  earth: [
    // 情绪症状
    { element: 'earth', category: 'emotion', symptom: '思虑过度', severity: 6 },
    { element: 'earth', category: 'emotion', symptom: '忧愁', severity: 5 },
    { element: 'earth', category: 'emotion', symptom: '精神不振', severity: 5 },
    { element: 'earth', category: 'emotion', symptom: '注意力不集中', severity: 4 },

    // 身体症状
    { element: 'earth', category: 'physical', symptom: '消化不良', severity: 6 },
    { element: 'earth', category: 'physical', symptom: '腹胀', severity: 6 },
    { element: 'earth', category: 'physical', symptom: '食欲不振', severity: 5 },
    { element: 'earth', category: 'physical', symptom: '身体困重', severity: 5 },
    { element: 'earth', category: 'physical', symptom: '大便不成形', severity: 5 },
    { element: 'earth', category: 'physical', symptom: '四肢乏力', severity: 4 },

    // 舌象
    { element: 'earth', category: 'tongue', symptom: '齿痕舌', severity: 6 },
    { element: 'earth', category: 'tongue', symptom: '舌苔厚腻', severity: 7 },
    { element: 'earth', category: 'tongue', symptom: '舌体胖大', severity: 5 }
  ],

  metal: [
    // 情绪症状
    { element: 'metal', category: 'emotion', symptom: '悲伤', severity: 6 },
    { element: 'metal', category: 'emotion', symptom: '忧郁', severity: 5 },
    { element: 'metal', category: 'emotion', symptom: '情绪低落', severity: 5 },
    { element: 'metal', category: 'emotion', symptom: '孤独感', severity: 4 },

    // 身体症状
    { element: 'metal', category: 'physical', symptom: '咳嗽', severity: 6 },
    { element: 'metal', category: 'physical', symptom: '皮肤干燥', severity: 5 },
    { element: 'metal', category: 'physical', symptom: '鼻塞', severity: 5 },
    { element: 'metal', category: 'physical', symptom: '便秘', severity: 6 },
    { element: 'metal', category: 'physical', symptom: '声音嘶哑', severity: 4 },
    { element: 'metal', category: 'physical', symptom: '容易感冒', severity: 5 },

    // 舌象
    { element: 'metal', category: 'tongue', symptom: '舌苔白', severity: 5 },
    { element: 'metal', category: 'tongue', symptom: '舌质淡', severity: 4 },
    { element: 'metal', category: 'tongue', symptom: '舌苔薄', severity: 3 }
  ],

  water: [
    // 情绪症状
    { element: 'water', category: 'emotion', symptom: '恐惧', severity: 6 },
    { element: 'water', category: 'emotion', symptom: '惊吓', severity: 5 },
    { element: 'water', category: 'emotion', symptom: '缺乏安全感', severity: 5 },
    { element: 'water', category: 'emotion', symptom: '胆小', severity: 4 },

    // 身体症状
    { element: 'water', category: 'physical', symptom: '腰膝酸软', severity: 6 },
    { element: 'water', category: 'physical', symptom: '乏力', severity: 5 },
    { element: 'water', category: 'physical', symptom: '夜尿频多', severity: 5 },
    { element: 'water', category: 'physical', symptom: '耳鸣', severity: 5 },
    { element: 'water', category: 'physical', symptom: '头发早白', severity: 4 },
    { element: 'water', category: 'physical', symptom: '畏寒', severity: 4 },

    // 舌象
    { element: 'water', category: 'tongue', symptom: '舌根白', severity: 5 },
    { element: 'water', category: 'tongue', symptom: '舌质淡胖', severity: 4 },
    { element: 'water', category: 'tongue', symptom: '舌苔水滑', severity: 4 }
  ]
};

// 标准化问卷题目
const QUESTIONNAIRE: QuestionnaireQuestion[] = [
  // 木相关题目
  {
    id: 'wood_anger',
    question: '最近一周是否经常感到烦躁易怒？',
    category: '情绪',
    options: [
      { text: '从没有', score: 0, element: 'wood' },
      { text: '偶尔有', score: 2, element: 'wood' },
      { text: '经常有', score: 5, element: 'wood' },
      { text: '总是如此', score: 8, element: 'wood' }
    ]
  },
  {
    id: 'wood_headache',
    question: '最近是否经常头痛或偏头痛？',
    category: '身体',
    options: [
      { text: '从没有', score: 0, element: 'wood' },
      { text: '偶尔有', score: 2, element: 'wood' },
      { text: '经常有', score: 5, element: 'wood' },
      { text: '每天都有', score: 8, element: 'wood' }
    ]
  },

  // 火相关题目
  {
    id: 'fire_sleep',
    question: '最近一周的睡眠质量如何？',
    category: '身体',
    options: [
      { text: '很好，容易入睡', score: 0, element: 'fire' },
      { text: '偶尔失眠', score: 2, element: 'fire' },
      { text: '经常失眠', score: 5, element: 'fire' },
      { text: '严重失眠', score: 8, element: 'fire' }
    ]
  },
  {
    id: 'fire_mouth',
    question: '最近是否有口腔溃疡或口干舌燥？',
    category: '身体',
    options: [
      { text: '从没有', score: 0, element: 'fire' },
      { text: '偶尔有', score: 2, element: 'fire' },
      { text: '经常有', score: 5, element: 'fire' },
      { text: '一直有', score: 8, element: 'fire' }
    ]
  },

  // 土相关题目
  {
    id: 'earth_digestion',
    question: '最近消化功能如何？',
    category: '身体',
    options: [
      { text: '很好，无不适', score: 0, element: 'earth' },
      { text: '偶尔腹胀', score: 2, element: 'earth' },
      { text: '经常消化不良', score: 5, element: 'earth' },
      { text: '严重腹胀', score: 8, element: 'earth' }
    ]
  },
  {
    id: 'earth_appetite',
    question: '最近食欲状况如何？',
    category: '身体',
    options: [
      { text: '正常', score: 0, element: 'earth' },
      { text: '稍差', score: 2, element: 'earth' },
      { text: '很差', score: 5, element: 'earth' },
      { text: '没有食欲', score: 8, element: 'earth' }
    ]
  },

  // 金相关题目
  {
    id: 'metal_cough',
    question: '最近是否有咳嗽或呼吸系统不适？',
    category: '身体',
    options: [
      { text: '从没有', score: 0, element: 'metal' },
      { text: '偶尔有', score: 2, element: 'metal' },
      { text: '经常有', score: 5, element: 'metal' },
      { text: '持续咳嗽', score: 8, element: 'metal' }
    ]
  },
  {
    id: 'metal_bowel',
    question: '最近大便情况如何？',
    category: '身体',
    options: [
      { text: '正常', score: 0, element: 'metal' },
      { text: '稍干', score: 2, element: 'metal' },
      { text: '经常便秘', score: 5, element: 'metal' },
      { text: '严重便秘', score: 8, element: 'metal' }
    ]
  },

  // 水相关题目
  {
    id: 'water_back',
    question: '最近是否有腰膝酸软的感觉？',
    category: '身体',
    options: [
      { text: '从没有', score: 0, element: 'water' },
      { text: '偶尔有', score: 2, element: 'water' },
      { text: '经常有', score: 5, element: 'water' },
      { text: '持续酸痛', score: 8, element: 'water' }
    ]
  },
  {
    id: 'water_energy',
    question: '最近精力状况如何？',
    category: '身体',
    options: [
      { text: '很充沛', score: 0, element: 'water' },
      { text: '一般', score: 2, element: 'water' },
      { text: '容易疲劳', score: 5, element: 'water' },
      { text: '非常疲惫', score: 8, element: 'water' }
    ]
  }
];

/**
 * 从现有数据中提取症状特征
 */
export function extractSymptomsFromData(dailyData: {
  sleep?: { duration?: string; feeling?: string };
  emotions?: Array<{ emoji?: string; intensity?: number }>;
  meals?: Array<{ feeling?: string }>;
  symptoms?: Array<{ body_part?: string; severity?: number }>;
}): SymptomTag[] {
  const symptoms: SymptomTag[] = [];

  // 从睡眠数据提取症状
  if (dailyData.sleep) {
    const { duration, feeling } = dailyData.sleep;

    // 睡眠问题 - 火
    if (feeling === '昏昏沉沉' || duration === '小于6h') {
      symptoms.push({
        element: 'fire',
        category: 'physical',
        symptom: '睡眠质量差',
        severity: 6
      });
    }

    // 睡眠充足 - 水
    if (duration === '8-10h' && feeling === '精力充沛') {
      symptoms.push({
        element: 'water',
        category: 'physical',
        symptom: '睡眠充足',
        severity: -3 // 负分表示健康状态
      });
    }
  }

  // 从情绪数据提取症状
  if (dailyData.emotions && dailyData.emotions.length > 0) {
    dailyData.emotions.forEach(emotion => {
      const intensity = emotion.intensity || 5;

      switch (emotion.emoji) {
        case '😤': // 愤怒 - 木
          symptoms.push({
            element: 'wood',
            category: 'emotion',
            symptom: '易怒',
            severity: intensity
          });
          break;
        case '😔': // 悲伤 - 金
          symptoms.push({
            element: 'metal',
            category: 'emotion',
            symptom: '悲伤',
            severity: intensity
          });
          break;
        case '🤯': // 惊吓 - 水
          symptoms.push({
            element: 'water',
            category: 'emotion',
            symptom: '惊吓',
            severity: intensity
          });
          break;
        case '😊': // 过度兴奋 - 火
          if (intensity > 7) {
            symptoms.push({
              element: 'fire',
              category: 'emotion',
              symptom: '心神不宁',
              severity: intensity - 5
            });
          }
          break;
      }
    });
  }

  // 从饮食数据提取症状
  if (dailyData.meals && dailyData.meals.length > 0) {
    dailyData.meals.forEach(meal => {
      switch (meal.feeling) {
        case '有点撑':
          symptoms.push({
            element: 'earth',
            category: 'physical',
            symptom: '腹胀',
            severity: 4
          });
          break;
        case '还想吃':
          symptoms.push({
            element: 'wood',
            category: 'physical',
            symptom: '肝郁',
            severity: 3
          });
          break;
      }
    });
  }

  // 从症状数据提取
  if (dailyData.symptoms && dailyData.symptoms.length > 0) {
    dailyData.symptoms.forEach(symptom => {
      const severity = symptom.severity || 5;

      switch (symptom.body_part) {
        case '头部':
          symptoms.push({
            element: 'wood',
            category: 'physical',
            symptom: '头痛',
            severity: severity
          });
          break;
        case '胸部':
          symptoms.push({
            element: 'fire',
            category: 'physical',
            symptom: '胸闷',
            severity: severity
          });
          break;
        case '腹部':
          symptoms.push({
            element: 'earth',
            category: 'physical',
            symptom: '腹痛',
            severity: severity
          });
          break;
        case '腰背':
          symptoms.push({
            element: 'water',
            category: 'physical',
            symptom: '腰痛',
            severity: severity
          });
          break;
      }
    });
  }

  return symptoms;
}

/**
 * 计算后天五行得分
 */
export function calculatePostnatalFiveElements(symptoms: SymptomTag[]): {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
} {
  const scores = { wood: 50, fire: 50, earth: 50, metal: 50, water: 50 }; // 基础分50

  symptoms.forEach(symptom => {
    const element = symptom.element as keyof typeof scores;
    scores[element] += symptom.severity;
  });

  // 确保分数在合理范围内
  Object.keys(scores).forEach(element => {
    const key = element as keyof typeof scores;
    scores[key] = Math.max(0, Math.min(100, scores[key]));
  });

  return scores;
}

/**
 * 归一化为百分比
 */
export function normalizePostnatalScores(scores: {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}): {
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
    percentages[element] = Math.round((score / total) * 100 * 10) / 10;
  });

  return percentages;
}

/**
 * 判断主导五行
 */
export function determineDominantElement(percentages: {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}): string {
  const entries = Object.entries(percentages);
  entries.sort(([,a], [,b]) => b - a);
  return entries[0][0];
}

/**
 * 生成调理建议
 */
export function generateRecommendations(
  percentages: { wood: number; fire: number; earth: number; metal: number; water: number },
  dominantElement: string
): { strengthening: string[]; balancing: string[] } {
  const strengthening: string[] = [];
  const balancing: string[] = [];

  // 根据主导元素给出建议
  switch (dominantElement) {
    case 'wood':
      strengthening.push('多做户外运动，接触大自然');
      strengthening.push('练习深呼吸和冥想');
      balancing.push('避免过度劳累，保证充足睡眠');
      balancing.push('学习情绪管理技巧');
      break;
    case 'fire':
      strengthening.push('保持心情平和，避免过度兴奋');
      strengthening.push('适当补充水分');
      balancing.push('减少辛辣刺激食物');
      balancing.push('建立规律的作息时间');
      break;
    case 'earth':
      strengthening.push('注意饮食规律，细嚼慢咽');
      strengthening.push('适当运动促进消化');
      balancing.push('避免思虑过度');
      balancing.push('保持环境干燥');
      break;
    case 'metal':
      strengthening.push('多做有氧运动，增强肺功能');
      strengthening.push('保持环境湿度适宜');
      balancing.push('避免过度悲伤');
      balancing.push('注意保暖，避免受凉');
      break;
    case 'water':
      strengthening.push('注意腰部和足部保暖');
      strengthening.push('避免过度劳累');
      balancing.push('保持积极乐观的心态');
      balancing.push('适当进行温和运动');
      break;
  }

  return { strengthening, balancing };
}

/**
 * 主要的后天分析函数
 */
export function analyzePostnatalFiveElements(dailyData: any): PostnatalAnalysis {
  // 提取症状
  const symptoms = extractSymptomsFromData(dailyData);

  // 计算五行得分
  const scores = calculatePostnatalFiveElements(symptoms);

  // 归一化为百分比
  const percentages = normalizePostnatalScores(scores);

  // 判断主导元素
  const dominantElement = determineDominantElement(percentages);

  // 生成建议
  const recommendations = generateRecommendations(percentages, dominantElement);

  return {
    elementScores: scores,
    elementPercentages: percentages,
    dominantElement,
    recommendations
  };
}

/**
 * 获取标准问卷
 */
export function getStandardQuestionnaire(): QuestionnaireQuestion[] {
  return QUESTIONNAIRE;
}

/**
 * 处理问卷回答
 */
export function processQuestionnaireAnswers(answers: Record<string, string>): PostnatalAnalysis {
  const symptoms: SymptomTag[] = [];

  // 处理每个问题的回答
  Object.entries(answers).forEach(([questionId, optionIndex]) => {
    const question = QUESTIONNAIRE.find(q => q.id === questionId);
    if (question && optionIndex !== undefined) {
      const option = question.options[parseInt(optionIndex)];
      if (option) {
        symptoms.push({
          element: option.element as any,
          category: 'questionnaire' as any,
          symptom: question.question,
          severity: option.score
        });
      }
    }
  });

  const scores = calculatePostnatalFiveElements(symptoms);
  const percentages = normalizePostnatalScores(scores);
  const dominantElement = determineDominantElement(percentages);
  const recommendations = generateRecommendations(percentages, dominantElement);

  return {
    elementScores: scores,
    elementPercentages: percentages,
    dominantElement,
    recommendations
  };
}