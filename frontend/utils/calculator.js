/**
 * Mifflin-St Jeor 公式计算 BMR
 */
function calcBmr(p) {
  var base = 10 * p.weight + 6.25 * p.height - 5 * p.age
  return p.gender === 'male' ? base + 5 : base - 161
}

/**
 * 计算热量缺口
 */
function calcDeficit(bmr, intake, exercise) {
  return bmr + (exercise || 0) - (intake || 0)
}

/**
 * 按 7700 kcal/kg 估算减重
 */
function estimateWeightLoss(totalDeficit) {
  return (totalDeficit / 7700).toFixed(2)
}

/**
 * 格式化今天日期 YYYY-MM-DD
 */
function today() {
  var d = new Date()
  var m = d.getMonth() + 1
  var day = d.getDate()
  return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day)
}

module.exports = {
  calcBmr: calcBmr,
  calcDeficit: calcDeficit,
  estimateWeightLoss: estimateWeightLoss,
  today: today
}
