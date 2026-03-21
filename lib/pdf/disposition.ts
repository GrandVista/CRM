/**
 * 统一约定：默认 inline（新窗口/标签直接打开 PDF）；?download=1 → attachment 下载
 */
export function parsePdfDisposition(searchParams: URLSearchParams): "inline" | "attachment" {
  if (searchParams.get("download") === "1") return "attachment";
  return "inline";
}
