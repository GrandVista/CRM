import fs from "fs";
import path from "path";
import type PDFDocument from "pdfkit";

type PdfDoc = InstanceType<typeof PDFDocument>;

/**
 * 必须使用注册名 + doc.font(name)，禁止 doc.font(绝对路径)，否则打包环境下 pdfkit 仍会回退到内置 AFM。
 */
export const PDF_EMBEDDED_REGULAR_NAME = "regular";
export const PDF_EMBEDDED_BOLD_NAME = "bold";

export const PDF_FONT_REGULAR_PATH = path.join(process.cwd(), "public", "fonts", "NotoSansSC-Regular.otf");
export const PDF_FONT_BOLD_PATH = path.join(process.cwd(), "public", "fonts", "NotoSansSC-Bold.otf");

/**
 * 在 new PDFDocument 之后、任何绘制之前调用一次；addPage 后请再调用 reapplyEmbeddedFontRegularAfterNewPage。
 */
export function registerEmbeddedPdfFonts(doc: PdfDoc): void {
  console.log("PDF font regular:", PDF_FONT_REGULAR_PATH);
  console.log("PDF font bold:", PDF_FONT_BOLD_PATH);

  if (!fs.existsSync(PDF_FONT_REGULAR_PATH)) {
    throw new Error("Font file not found");
  }
  if (!fs.existsSync(PDF_FONT_BOLD_PATH)) {
    throw new Error("Font file not found");
  }

  doc.registerFont(PDF_EMBEDDED_REGULAR_NAME, PDF_FONT_REGULAR_PATH);
  doc.registerFont(PDF_EMBEDDED_BOLD_NAME, PDF_FONT_BOLD_PATH);
  doc.font(PDF_EMBEDDED_REGULAR_NAME);
}

/** 每个 doc.text / widthOfString / heightOfString 前都应先调用（或链式接上） */
export function setEmbeddedPdfFontRegular(doc: PdfDoc): PdfDoc {
  return doc.font(PDF_EMBEDDED_REGULAR_NAME);
}

export function setEmbeddedPdfFontBold(doc: PdfDoc): PdfDoc {
  return doc.font(PDF_EMBEDDED_BOLD_NAME);
}

export function reapplyEmbeddedFontRegularAfterNewPage(doc: PdfDoc): void {
  setEmbeddedPdfFontRegular(doc);
}
