/** GET /api/resin-orders/shipments/last-defaults 响应 */
export type ResinShipmentLastPersonDefaults = {
  shipper: string | null;
  reviewer: string | null;
  invoicer: string | null;
};

/**
 * 将「最近一次使用的名字」放在 datalist 第一位，其余为默认名单（去重）。
 */
export function mergePersonDatalistOptions(
  lastUsed: string | null | undefined,
  defaults: readonly string[],
): string[] {
  const t = lastUsed?.trim();
  if (!t) return [...defaults];
  const rest = defaults.filter((d) => d !== t);
  return [t, ...rest];
}
