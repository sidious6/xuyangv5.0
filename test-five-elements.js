// 测试五行计算功能
const { calculateAdvancedBazi } = require('./src/lib/advanced-bazi-calculator.ts');

// 测试数据 - 2003年2月13日4时
const testData = {
  birthYear: 2003,
  birthMonth: 2,
  birthDay: 13,
  birthHour: 4
};

console.log('=== 五行计算测试 ===');
console.log(`测试数据: ${testData.birthYear}年${testData.birthMonth}月${testData.birthDay}日${testData.birthHour}时`);

try {
  const result = calculateAdvancedBazi(
    testData.birthYear,
    testData.birthMonth,
    testData.birthDay,
    testData.birthHour
  );

  console.log('\n=== 计算结果 ===');
  console.log('八字:', `${result.chart.year.stem}${result.chart.year.branch} ${result.chart.month.stem}${result.chart.month.branch} ${result.chart.day.stem}${result.chart.day.branch} ${result.chart.hour.stem}${result.chart.hour.branch}`);
  console.log('日主:', result.dayMaster, '(' + result.dayMasterElement + ')');
  console.log('季节:', result.season);
  console.log('强弱:', result.strength);

  console.log('\n=== 五行比例 ===');
  console.log('木:', result.elementPercentages.wood + '%');
  console.log('火:', result.elementPercentages.fire + '%');
  console.log('土:', result.elementPercentages.earth + '%');
  console.log('金:', result.elementPercentages.metal + '%');
  console.log('水:', result.elementPercentages.water + '%');

  // 检查总和是否为100%
  const total = result.elementPercentages.wood + result.elementPercentages.fire + 
                result.elementPercentages.earth + result.elementPercentages.metal + 
                result.elementPercentages.water;
  console.log('\n总和:', total + '%');

  // 转换为中文格式
  const fiveElementsRatio = {
    木: result.elementPercentages.wood,
    火: result.elementPercentages.fire,
    土: result.elementPercentages.earth,
    金: result.elementPercentages.metal,
    水: result.elementPercentages.water
  };

  console.log('\n=== 中文格式 ===');
  console.log(JSON.stringify(fiveElementsRatio, null, 2));

} catch (error) {
  console.error('计算错误:', error);
}
