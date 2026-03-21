import type PDFDocument from "pdfkit";
import { reapplyEmbeddedFontRegularAfterNewPage } from "@/lib/pdf/fonts";

export type PdfDoc = InstanceType<typeof PDFDocument>;

/** A4 高度 (pt) */
export const PDF_PAGE_HEIGHT_PT = 841.89;

/**
 * 若当前 y 下方空间不足则换页，避免底部 totals / 长文本被裁切。
 */
export function ensureVerticalSpace(doc: PdfDoc, minHeightPts: number): void {
  const bottom = doc.page.height - doc.page.margins.bottom - 6;
  if (doc.y + minHeightPts > bottom) {
    doc.addPage();
    reapplyEmbeddedFontRegularAfterNewPage(doc);
    doc.x = doc.page.margins.left;
    doc.y = doc.page.margins.top;
  }
}
