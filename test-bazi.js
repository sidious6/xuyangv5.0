// 测试八字分析算法
const { calculateAdvancedBazi, getAdvancedBaziDescription } = require('./src/lib/advanced-bazi-calculator.ts');
const { analyzeComprehensiveFiveElements, generateComprehensiveReport } = require('./src/lib/comprehensive-five-elements.ts');

console.log('=== 八字分析算法测试 ===\n');

// 测试案例1：1988年3月15日14时30分
console.log('测试案例1：1988年3月15日14时30分');
try {
  const result1 = calculateAdvancedBazi(1988, 3, 15, 14);
  console.log('基础分析结果:');
  console.log('日主:', result1.dayMaster);
  console.log('日主五行:', result1.dayMasterElement);
  console.log('五行占比:', result1.elementPercentages);
  console.log('日主状态:', result1.strength);
  console.log('季节:', result1.season);

  const description1 = getAdvancedBaziDescription(result1);
  console.log('\n详细描述:');
  console.log(description1);

  console.log('\n' + '='.repeat(50) + '\n');
} catch (error) {
  console.error('测试案例1失败:', error);
}

// 测试案例2：1995年7月20日8时15分
console.log('测试案例2：1995年7月20日8时15分');
try {
  const result2 = calculateAdvancedBazi(1995, 7, 20, 8);
  console.log('基础分析结果:');
  console.log('日主:', result2.dayMaster);
  console.log('日主五行:', result2.dayMasterElement);
  console.log('五行占比:', result2.elementPercentages);
  console.log('日主状态:', result2.strength);
  console.log('季节:', result2.season);

  console.log('\n' + '='.repeat(50) + '\n');
} catch (error) {
  console.error('测试案例2失败:', error);
}

// 测试案例3：综合分析
console.log('测试案例3：综合分析（1990年10月25日14时30分）');
try {
  const comprehensiveResult = analyzeComprehensiveFiveElements(1990, 10, 25, 14);
  console.log('体质类型:', comprehensiveResult.healthImplications.constitutionalType);
  console.log('五行平衡度:', comprehensiveResult.fiveElementsBalance.balance);
  console.log('最强元素:', comprehensiveResult.fiveElementsBalance.dominantElement);
  console.log('最弱元素:', comprehensiveResult.fiveElementsBalance.weakestElement);
  console.log('推荐运动:', comprehensiveResult.exerciseRecommendations.bestActivities.join('、'));

  const report = generateComprehensiveReport(comprehensiveResult);
  console.log('\n综合报告:');
  console.log(report);
} catch (error) {
  console.error('综合分析测试失败:', error);
}

console.log('\n=== 测试完成 ===');