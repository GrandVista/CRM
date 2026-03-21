import fs from "fs";
import path from "path";
import type PDFDocument from "pdfkit";
import { setEmbeddedPdfFontBold, setEmbeddedPdfFontRegular } from "@/lib/pdf/fonts";
import { ensureVerticalSpace } from "@/lib/pdf/page-layout";

export type PdfDoc = InstanceType<typeof PDFDocument>;

/** Node 环境可读绝对路径（部署时请将 logo 置于 public/logo.png；可为 PNG 或 JPEG） */
export const PDF_LOGO_PATH = path.join(process.cwd(), "public", "logo.png");

/**
 * Logo 在 PDF 中可见区域的显示宽度（pt），落在 180~220 区间。
 * 实际为「裁剪后内容区」映射到该宽度；高度由裁剪区宽高比决定。
 */
/** 约比 200pt 缩小 12.5%，与 CI / PL 共用 */
export const PDF_LOGO_DISPLAY_WIDTH_PT = 175;

/**
 * 在原图像素中去掉白边的归一化裁剪框（相对整图 0~1，左上为原点）：
 * 可按实际 `public/logo.png` 微调；设为 full-bleed（整图）可关闭裁剪效果。
 */
/** 源图已在 `npm run logo:trim` 去边；PDF 内不再二次裁切。若源图有白边可改回比例裁剪。 */
export const PDF_LOGO_CROP_RECT = { x: 0, y: 0, w: 1, h: 1 } as const;

/** Logo 底边与英文公司名之间的间距（pt），约 5~10 */
export const PDF_LOGO_GAP_TO_NAME_PT = 7;

/** 抬头固定英文公司名（与 Address / TEL 同级说明文字，非大标题） */
export const PDF_COMPANY_EN_NAME = "Xiamen Grandvista Trading Limited";

/** 与 Address / TEL 一致 */
export const PDF_COMPANY_EN_FONT_SIZE = 9;

/** 英文公司名下方到 Address 等正文的间距（pt） */
export const PDF_HEADER_GAP_AFTER_LETTERHEAD_PT = 9;

/** 不依赖 PDFKit `heightOfString`（部分 TS 定义不完整） */
function approximateWrappedTextHeight(text: string, widthPt: number, fontSizePt: number): number {
  const lineHeight = fontSizePt * 1.25;
  const approxCharWidth = fontSizePt * 0.52;
  const charsPerLine = Math.max(4, Math.floor(widthPt / approxCharWidth));
  let totalLines = 0;
  for (const para of text.split("\n")) {
    const trimmed = para.length ? para : " ";
    totalLines += Math.max(1, Math.ceil(trimmed.length / charsPerLine));
  }
  return Math.max(lineHeight, totalLines * lineHeight);
}

/** 读取 PNG IHDR 或 JPEG SOF 的像素尺寸 */
function readRasterImageDimensions(filePath: string): { width: number; height: number } | null {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 24) return null;

  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) return null;
      const marker = buf[offset + 1];
      if (marker === 0xda || marker === 0xd9) break;
      const segLen = buf.readUInt16BE(offset + 2);
      if (segLen < 2 || offset + 2 + segLen > buf.length) break;
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
      }
      offset += 2 + segLen;
    }
    return null;
  }

  if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG" && buf.toString("ascii", 12, 16) === "IHDR") {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  return null;
}

/**
 * 裁剪白边后绘制 Logo：clip 视口 + 平移/缩放整图，使裁剪区恰好映射到 (dstW × dstH)。
 * 返回页面上 Logo 区域高度（pt），供后续排版。
 */
function drawLogoWithCrop(
  doc: PdfDoc,
  marginLeft: number,
  y0: number,
  imagePath: string,
  dims: { width: number; height: number },
): number {
  const iw = dims.width;
  const ih = dims.height;
  const { x: nx, y: ny, w: nw, h: nh } = PDF_LOGO_CROP_RECT;

  const cx = nx * iw;
  const cy = ny * ih;
  const cw = nw * iw;
  const ch = nh * ih;

  if (cw < 2 || ch < 2) {
    doc.image(imagePath, marginLeft, y0, { width: PDF_LOGO_DISPLAY_WIDTH_PT });
    return (PDF_LOGO_DISPLAY_WIDTH_PT * ih) / iw;
  }

  const dstW = PDF_LOGO_DISPLAY_WIDTH_PT;
  const scale = dstW / cw;
  const dstH = ch * scale;

  const drawW = iw * scale;
  const drawX = marginLeft - cx * scale;
  const drawY = y0 - cy * scale;

  doc.save();
  doc.rect(marginLeft, y0, dstW, dstH).clip();
  doc.image(imagePath, drawX, drawY, { width: drawW });
  doc.restore();

  return dstH;
}

/**
 * 统一抬头：左上角 Logo（可裁剪白边）+ 正下方英文公司名（左对齐），并推进 `doc.y`。
 * 后续绘制请始终显式传入左边距 `marginLeft`，勿依赖 `doc.x`。
 * Contract / CI / PL 共用。
 */
export function drawPdfCompanyLetterhead(doc: PdfDoc, marginLeft: number, innerWidth: number): void {
  const y0 = doc.y;
  const hasLogo = fs.existsSync(PDF_LOGO_PATH);
  let logoRenderedHeightPt = 0;

  if (hasLogo) {
    const dims = readRasterImageDimensions(PDF_LOGO_PATH);
    if (dims && dims.width > 0) {
      logoRenderedHeightPt = drawLogoWithCrop(doc, marginLeft, y0, PDF_LOGO_PATH, dims);
    } else {
      doc.image(PDF_LOGO_PATH, marginLeft, y0, { width: PDF_LOGO_DISPLAY_WIDTH_PT });
      logoRenderedHeightPt = PDF_LOGO_DISPLAY_WIDTH_PT * 0.35;
    }
  } else {
    console.warn("[PDF] Logo file not found:", PDF_LOGO_PATH);
  }

  const nameY = hasLogo ? y0 + logoRenderedHeightPt + PDF_LOGO_GAP_TO_NAME_PT : y0;
  setEmbeddedPdfFontRegular(doc).fontSize(PDF_COMPANY_EN_FONT_SIZE);
  const nameH = approximateWrappedTextHeight(PDF_COMPANY_EN_NAME, innerWidth, PDF_COMPANY_EN_FONT_SIZE);
  doc.text(PDF_COMPANY_EN_NAME, marginLeft, nameY, { width: innerWidth });
  doc.y = nameY + nameH + PDF_HEADER_GAP_AFTER_LETTERHEAD_PT;
}

/**
 * 粗体 `label` + 空格后接常规 `value`（可换行），用于 Address / TEL 等。
 * `label` 建议含冒号，如 `"Address:"`。
 */
export function pdfWriteBoldLabelThenValue(
  doc: PdfDoc,
  marginLeft: number,
  innerWidth: number,
  label: string,
  value: string,
  fontSize: number,
  extraSpace = 6,
): void {
  const v = value?.trim() ? value.trim() : "—";
  const labelPart = `${label.endsWith(":") ? label : `${label}:`} `;
  setEmbeddedPdfFontRegular(doc).fontSize(fontSize);
  const estH = approximateWrappedTextHeight(`${labelPart}${v}`, innerWidth, fontSize);
  ensureVerticalSpace(doc, estH + extraSpace);
  const lineY = doc.y;
  /** 粗体标签近似宽度（pt），避免 continued + `text(value, { width })` 的不兼容签名 */
  const labelReserve = Math.min(
    Math.max(Math.ceil(labelPart.length * fontSize * 0.52) + 4, fontSize * 4),
    innerWidth - 24,
  );
  setEmbeddedPdfFontBold(doc).fontSize(fontSize).text(labelPart, marginLeft, lineY);
  setEmbeddedPdfFontRegular(doc).fontSize(fontSize).text(v, marginLeft + labelReserve, lineY, {
    width: innerWidth - labelReserve,
  });
}
