/**
 * 通用金额、重量、卷数计算与格式化
 */

export function formatAmount(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ` ${currency}`;
}

export function formatWeight(kg: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(kg) + " kg";
}

export function formatQuantity(n: number, unit: string = "pcs"): string {
  return new Intl.NumberFormat("en-US").format(n) + ` ${unit}`;
}

/** 计算行金额 = unitPrice * quantityKg 或 unitPrice * rollQty，按业务取其一 */
export function calcLineAmount(
  unitPrice: number,
  quantityKg?: number,
  rollQty?: number
): number {
  if (quantityKg != null && quantityKg > 0) return unitPrice * quantityKg;
  if (rollQty != null && rollQty > 0) return unitPrice * rollQty;
  return 0;
}

/** 汇总多行金额 */
export function sumAmounts(amounts: number[]): number {
  return amounts.reduce((a, b) => a + b, 0);
}

/** 汇总多行重量 */
export function sumWeights(weights: number[]): number {
  return weights.reduce((a, b) => a + b, 0);
}

/** 汇总多行卷数 */
export function sumRolls(rolls: number[]): number {
  return rolls.reduce((a, b) => a + b, 0);
}
