/**
 * 单据编号生成工具
 * 格式: 前缀 + 年月 + 4位序号，如 QT2025030001
 */

const PREFIXES = {
  quotation: "QT",
  pi: "PI",
  contract: "CT",
  cl: "CL",
  shipment: "SH",
  payment: "PA",
} as const;

function getYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

/**
 * 生成编号。实际项目应查数据库取当月最大序号+1，这里做简单递增。
 */
export async function generateDocNo(
  type: keyof typeof PREFIXES,
  getLastNo: (prefix: string) => Promise<string | null>
): Promise<string> {
  const prefix = PREFIXES[type];
  const ym = getYearMonth();
  const fullPrefix = `${prefix}${ym}`;
  const last = await getLastNo(fullPrefix);
  let seq = 1;
  if (last) {
    const match = last.replace(fullPrefix, "").trim();
    const n = parseInt(match, 10);
    if (!isNaN(n)) seq = n + 1;
  }
  return `${fullPrefix}${String(seq).padStart(4, "0")}`;
}

/**
 * 同步版，仅用于无 DB 时 mock。正式逻辑请用 generateDocNo。
 */
export function generateDocNoSync(type: keyof typeof PREFIXES): string {
  const prefix = PREFIXES[type];
  const ym = getYearMonth();
  const seq = Math.floor(Math.random() * 9999) + 1;
  return `${prefix}${ym}${String(seq).padStart(4, "0")}`;
}
