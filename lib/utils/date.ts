/**
 * 统一日期显示格式，避免 SSR 与客户端 locale 不一致导致 hydration mismatch。
 * 格式：YYYY/MM/DD，例如 2026/03/17
 */

export function formatDate(value?: string | Date | null): string {
  if (value == null) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

/** `<input type="date">` 用本地日历日 YYYY-MM-DD */
export function toDateInputValue(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
