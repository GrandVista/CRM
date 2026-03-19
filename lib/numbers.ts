/**
 * 通用金额、重量、卷数计算与格式化
 *
 * 重量公式（规格 → 重量）：
 * - 单位约定：thickness 厚度(μm)，width 宽度(mm)，length 长度(m)，density 密度(g/cm³)，rollQty 卷数
 * - 单卷体积(m³) = (thickness × 10⁻⁶) × (width × 10⁻³) × length = thickness × width × length × 10⁻⁹
 * - 密度 1 g/cm³ = 1000 kg/m³
 * - 单卷重量(kg) = 单卷体积(m³) × 密度(kg/m³) = thickness × width × length × 10⁻⁹ × (density × 1000)
 *               = thickness × width × length × density × 10⁻⁶
 * - 总重量(kg) = 单卷重量 × rollQty
 *             = thickness × width × length × density × rollQty × 10⁻⁶
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

export type CalculateWeightParams = {
  /** 厚度 μm */
  thickness?: number | string | null;
  /** 宽度 mm */
  width?: number | string | null;
  /** 长度 m */
  length?: number | string | null;
  /** 密度 g/cm³ */
  density?: number | string | null;
  /** 卷数 */
  rollQty?: number | string | null;
};

/**
 * 根据规格与密度计算总重量(kg)。
 * 单位：thickness μm, width mm, length m, density g/cm³, rollQty 卷数
 * 公式：quantityKg = thickness * width * length * density * rollQty * 1e-6
 * 若 rollQty 为空或 <= 0，则按 1 卷计算；任一规格或密度缺失/无效时返回 0。
 */
export function calculateWeight(params: CalculateWeightParams): number {
  const t = typeof params.thickness === "string" ? parseFloat(params.thickness) : params.thickness;
  const w = typeof params.width === "string" ? parseFloat(params.width) : params.width;
  const l = typeof params.length === "string" ? parseFloat(params.length) : params.length;
  const d = typeof params.density === "string" ? parseFloat(params.density) : params.density;
  const rRaw = typeof params.rollQty === "string" ? parseFloat(params.rollQty) : params.rollQty;
  const r = rRaw == null || Number.isNaN(rRaw) || rRaw <= 0 ? 1 : rRaw;

  if (
    t == null ||
    w == null ||
    l == null ||
    d == null ||
    Number.isNaN(t) ||
    Number.isNaN(w) ||
    Number.isNaN(l) ||
    Number.isNaN(d)
  ) {
    return 0;
  }
  if (t <= 0 || w <= 0 || l <= 0 || d <= 0) return 0;
  return t * w * l * d * r * 1e-6;
}

export type CalculateAmountParams = {
  unitPrice: number;
  quantityKg?: number | null;
};

/**
 * 行金额：严格按 quantityKg * unitPrice 计算
 */
export function calculateAmount(params: CalculateAmountParams): number {
  const { unitPrice } = params;
  const qtyKg = params.quantityKg != null && params.quantityKg > 0 ? params.quantityKg : 0;
  return unitPrice * qtyKg;
}

/** @deprecated 使用 calculateAmount */
export function calcLineAmount(
  unitPrice: number,
  quantityKg?: number,
): number {
  return calculateAmount({ unitPrice, quantityKg });
}

/** 汇总多行金额 */
export function sumAmounts(amounts: number[]): number {
  return amounts.reduce((a, b) => a + b, 0);
}

/** 汇总多行重量(kg) */
export function sumWeights(weights: number[]): number {
  return weights.reduce((a, b) => a + b, 0);
}

/** 汇总多行卷数 */
export function sumRolls(rolls: number[]): number {
  return rolls.reduce((a, b) => a + b, 0);
}
