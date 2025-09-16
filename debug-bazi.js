// 调试八字计算
const fs = require('fs');
const path = require('path');

// 模拟计算逻辑
function debugBaziCalculation() {
  console.log('=== 调试八字计算 ===');
  
  // 测试数据
  const testData = {
    birthYear: 2012,
    birthMonth: 12,
    birthDay: 17,
    birthHour: 14
  };
  
  console.log('测试数据:', testData);
  
  // 模拟八字排盘
  const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  
  // 简化的八字计算
  const yearColumn = {
    stem: HEAVENLY_STEMS[(testData.birthYear - 4) % 10],
    branch: EARTHLY_BRANCHES[(testData.birthYear - 4) % 12]
  };
  
  const monthColumn = {
    stem: HEAVENLY_STEMS[((testData.birthYear - 4) % 5) * 2 + (testData.birthMonth - 2) % 10],
    branch: EARTHLY_BRANCHES[(testData.birthMonth + 2) % 12]
  };
  
  console.log('年柱:', yearColumn.stem + yearColumn.branch);
  console.log('月柱:', monthColumn.stem + monthColumn.branch);
  
  // 天干地支五行属性
  const STEM_ELEMENTS = {
    '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire',
    '戊': 'earth', '己': 'earth', '庚': 'metal', '辛': 'metal',
    '壬': 'water', '癸': 'water'
  };
  
  const BRANCH_ELEMENTS = {
    '子': 'water', '丑': 'earth', '寅': 'wood', '卯': 'wood',
    '辰': 'earth', '巳': 'fire', '午': 'fire', '未': 'earth',
    '申': 'metal', '酉': 'metal', '戌': 'earth', '亥': 'water'
  };
  
  console.log('年干五行:', STEM_ELEMENTS[yearColumn.stem]);
  console.log('年支五行:', BRANCH_ELEMENTS[yearColumn.branch]);
  console.log('月干五行:', STEM_ELEMENTS[monthColumn.stem]);
  console.log('月支五行:', BRANCH_ELEMENTS[monthColumn.branch]);
  
  // 简单计算五行得分
  const scores = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  
  // 加分测试
  scores[STEM_ELEMENTS[yearColumn.stem]] += 15;
  scores[BRANCH_ELEMENTS[yearColumn.branch]] += 10;
  scores[STEM_ELEMENTS[monthColumn.stem]] += 15;
  scores[BRANCH_ELEMENTS[monthColumn.branch]] += 10;
  
  console.log('五行得分:', scores);
  
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  console.log('总分:', total);
  
  if (total > 0) {
    const percentages = {
      wood: Math.round((scores.wood / total) * 1000) / 10,
      fire: Math.round((scores.fire / total) * 1000) / 10,
      earth: Math.round((scores.earth / total) * 1000) / 10,
      metal: Math.round((scores.metal / total) * 1000) / 10,
      water: Math.round((scores.water / total) * 1000) / 10
    };
    console.log('五行百分比:', percentages);
    
    // 转换为中文
    const chineseRatio = {
      木: percentages.wood,
      火: percentages.fire,
      土: percentages.earth,
      金: percentages.metal,
      水: percentages.water
    };
    console.log('中文格式:', chineseRatio);
  } else {
    console.log('总分为0，使用默认值');
  }
}

debugBaziCalculation();
