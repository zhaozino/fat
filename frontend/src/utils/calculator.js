/**
 * Mifflin-St Jeor 公式计算 BMR
 * @param {object} p - { gender, weight, height, age }
 * @returns {number} BMR 大卡
 */
export function calcBmr({ gender, weight, height, age }) {
  const base = 10 * weight + 6.25 * height - 5 * age
  return gender === 'male' ? base + 5 : base - 161
}

/**
 * 计算热量缺口
 * deficit = bmr + exercise - intake
 */
export function calcDeficit(bmr, intake, exercise) {
  return bmr + (exercise || 0) - (intake || 0)
}

/**
 * 按 7700 kcal/kg 估算减重
 */
export function estimateWeightLoss(totalDeficit) {
  return (totalDeficit / 7700).toFixed(2)
}

/**
 * 格式化今天日期 YYYY-MM-DD
 */
export function today() {
  return new Date().toISOString().slice(0, 10)
}
