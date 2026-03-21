import PDFDocument from "@/lib/pdf/pdfkit-node";
import {
  registerEmbeddedPdfFonts,
  setEmbeddedPdfFontBold,
  setEmbeddedPdfFontRegular,
  reapplyEmbeddedFontRegularAfterNewPage,
} from "@/lib/pdf/fonts";
import { ensureVerticalSpace } from "@/lib/pdf/page-layout";
import { drawPdfCompanyLetterhead, pdfWriteBoldLabelThenValue } from "@/lib/pdf/logo-header";
import { formatQtyPdf, formatUsdPdf } from "@/lib/pdf/helpers";
import { amountToWords } from "@/lib/utils/number-to-words";
import { allowOptionLabelRequired } from "@/lib/allow-option";
import { formatDate } from "@/lib/utils/date";
import { formatWeight } from "@/lib/numbers";

type PdfDoc = InstanceType<typeof PDFDocument>;

export type ContractPdfSeller = {
  companyName?: string | null;
  companyAddress?: string | null;
  companyTel?: string | null;
  companyEmail?: string | null;
};

export type ContractPdfBuyer = {
  name: string;
  address?: string | null;
  phone?: string | null;
};

export type ContractPdfItem = {
  productName: string;
  thickness?: string | number | null;
  width?: string | number | null;
  length?: string | number | null;
  unitPrice: number;
  rollQty: number;
  quantityKg: number;
  amount: number;
};

export type ContractPdfTerms = {
  estimatedShipmentDate?: string | Date | null;
  incoterm?: string | null;
  portOfShipment?: string | null;
  portOfDestination?: string | null;
  partialShipment?: string | null;
  transhipment?: string | null;
  packingTerm?: string | null;
  paymentTerm?: string | null;
  documentRequirement?: string | null;
  insuranceTerm?: string | null;
  bankInfo?: string | null;
  moreOrLessPercent?: number | null;
  remark?: string | null;
};

export type ContractPdfInput = {
  seller: ContractPdfSeller;
  contractNo: string;
  contractDate: string;
  buyer: ContractPdfBuyer;
  items: ContractPdfItem[];
  totalRolls: number;
  totalWeight: number;
  totalAmount: number;
  currency: string;
  terms: ContractPdfTerms;
  contractType: "FILM" | "RESIN";
};

/** 对齐 components/contracts/contract-document.tsx 中 TERMS_LABEL_WIDTH ≈ 14rem */
const TERMS_LABEL_W = 152;

/**
 * 粗略估算换行后文字高度（pt），不调用 PDFKit `heightOfString`（部分项目 TS 定义不含该方法）。
 */
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

function termClause(doc: PdfDoc, M: number, innerW: number, label: string, value: string): void {
  const pad = 8;
  const v = value?.trim() || "—";
  const valueW = innerW - pad * 2 - TERMS_LABEL_W - 8;
  setEmbeddedPdfFontBold(doc).fontSize(8);
  const hLabel = approximateWrappedTextHeight(label, TERMS_LABEL_W, 8);
  setEmbeddedPdfFontRegular(doc).fontSize(8);
  const hVal = approximateWrappedTextHeight(v, valueW, 8);
  const blockH = Math.max(hLabel, hVal, 12) + 4;
  ensureVerticalSpace(doc, blockH);
  const y0 = doc.y;
  setEmbeddedPdfFontBold(doc).fontSize(8).text(label, M + pad, y0, { width: TERMS_LABEL_W });
  setEmbeddedPdfFontRegular(doc).fontSize(8).text(v, M + pad + TERMS_LABEL_W + 8, y0, { width: valueW });
  doc.y = y0 + blockH;
}

/**
 * 版式对齐网页打印页：`app/(dashboard-full)/contracts/[id]/print` → `ContractPrintView` → `ContractDocument`（forPrint）
 */
export function buildContractPdfBuffer(data: ContractPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const M = 45;
    const innerW = 595.28 - M * 2;

    const doc = new PDFDocument({
      size: "A4",
      margin: M,
      info: { Title: `Contract ${data.contractNo}`, Author: "GrandVista CRM" },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    registerEmbeddedPdfFonts(doc);

    /* ----- Header：左上 Logo + 英文公司名 + Address / TEL（与 CI/PL 统一；不含 Email） ----- */
    drawPdfCompanyLetterhead(doc, M, innerW);
    pdfWriteBoldLabelThenValue(doc, M, innerW, "Address:", data.seller.companyAddress || "—", 9);
    pdfWriteBoldLabelThenValue(doc, M, innerW, "TEL:", data.seller.companyTel || "—", 9);
    doc.moveDown(0.45);

    /* ----- 标题 ----- */
    const titleY = doc.y;
    setEmbeddedPdfFontBold(doc).fontSize(18).text("SALE CONTRACT", M, titleY, {
      width: innerW,
      align: "center",
    });
    doc.moveDown(0.55);

    /* ----- Buyer 信息框（与网页 bordered p-4 grid 结构一致） ----- */
    const boxPad = 10;
    const boxTop = doc.y;
    let ty = boxTop + boxPad;
    const textW = innerW - 2 * boxPad;
    const colHalf = (textW - 10) / 2;

    const bx = M + boxPad;
    /** 标签占位（pt），与 CI Buyer 行一致，避免 continued / 双参 text */
    const buyerLineLabelReserve = 45;
    setEmbeddedPdfFontBold(doc).fontSize(9).text("Buyer: ", bx, ty);
    setEmbeddedPdfFontRegular(doc)
      .fontSize(9)
      .text(data.buyer.name || "—", bx + buyerLineLabelReserve, ty, { width: textW - buyerLineLabelReserve });
    ty = doc.y + 6;
    setEmbeddedPdfFontBold(doc).fontSize(9).text("ADD: ", bx, ty);
    setEmbeddedPdfFontRegular(doc)
      .fontSize(9)
      .text(data.buyer.address || "—", bx + buyerLineLabelReserve, ty, { width: textW - buyerLineLabelReserve });
    ty = doc.y + 6;
    setEmbeddedPdfFontBold(doc).fontSize(9).text("TEL: ", bx, ty);
    setEmbeddedPdfFontRegular(doc)
      .fontSize(9)
      .text(data.buyer.phone || "—", bx + buyerLineLabelReserve, ty, { width: textW - buyerLineLabelReserve });
    ty = doc.y + 8;
    const yPair = ty;
    const xR = bx + colHalf + 10;
    const lwNo = 34;
    const lwDate = 36;
    setEmbeddedPdfFontBold(doc).fontSize(9).text("No.: ", bx, yPair);
    setEmbeddedPdfFontRegular(doc).fontSize(9).text(data.contractNo, bx + lwNo, yPair, { width: colHalf - lwNo - 4 });
    setEmbeddedPdfFontBold(doc).fontSize(9).text("Date: ", xR, yPair);
    setEmbeddedPdfFontRegular(doc)
      .fontSize(9)
      .text(formatDate(data.contractDate), xR + lwDate, yPair, { width: colHalf - lwDate - 4 });
    ty = Math.max(doc.y, yPair + 14);

    const boxH = ty - boxTop + boxPad;
    doc.rect(M, boxTop, innerW, boxH).stroke();
    doc.y = boxTop + boxH + 14;

    const isResin = data.contractType === "RESIN";
    const bottomLimit = () => doc.page.height - doc.page.margins.bottom;

    const breakRow = (y: number, need: number): number => {
      if (y + need <= bottomLimit()) return y;
      doc.addPage();
      reapplyEmbeddedFontRegularAfterNewPage(doc);
      return doc.page.margins.top;
    };

    /* ----- 产品表：列宽按 ContractDocument table-fixed 比例压缩到 innerW ----- */
    if (isResin) {
      const cols = [40, 235, 70, 70, 90];
      const headers = ["No.", "Product Name", "Unit price", "Quantity", "Amount"];
      const rowH = 24;
      let y = breakRow(doc.y, rowH + 8);
      let x = M;
      headers.forEach((h, i) => {
        doc.rect(x, y, cols[i], rowH).stroke();
        setEmbeddedPdfFontBold(doc).fontSize(8).text(h, x + 2, y + 7, { width: cols[i] - 4, align: "center" });
        x += cols[i];
      });
      y += rowH;
      data.items.forEach((item, idx) => {
        y = breakRow(y, rowH);
        x = M;
        const rowCells = [
          String(idx + 1),
          item.productName || "—",
          formatUsdPdf(item.unitPrice, data.currency),
          formatQtyPdf(item.quantityKg),
          formatUsdPdf(item.amount, data.currency),
        ];
        rowCells.forEach((cell, i) => {
          doc.rect(x, y, cols[i], rowH).stroke();
          const align = i === 1 ? "center" : i === 0 ? "center" : "right";
          setEmbeddedPdfFontRegular(doc)
            .fontSize(8)
            .text(cell, x + 2, y + 6, { width: cols[i] - 4, align });
          x += cols[i];
        });
        y += rowH;
      });
      doc.y = y + 10;
    } else {
      const cols = [36, 124, 50, 46, 42, 54, 42, 56, 55];
      const headers = ["No.", "Product Name", "Thk(μm)", "W(mm)", "L(m)", "U.price", "Roll", "Qty(kg)", "Amount"];
      const rowH = 24;
      let y = breakRow(doc.y, rowH + 8);
      let x = M;
      headers.forEach((h, i) => {
        doc.rect(x, y, cols[i], rowH).stroke();
        setEmbeddedPdfFontBold(doc).fontSize(7).text(h, x + 1, y + 8, { width: cols[i] - 2, align: "center" });
        x += cols[i];
      });
      y += rowH;
      data.items.forEach((item, idx) => {
        y = breakRow(y, rowH);
        x = M;
        const rowCells = [
          String(idx + 1),
          item.productName || "—",
          String(item.thickness ?? "—"),
          String(item.width ?? "—"),
          String(item.length ?? "—"),
          formatUsdPdf(item.unitPrice, data.currency),
          String(item.rollQty ?? "—"),
          formatQtyPdf(item.quantityKg),
          formatUsdPdf(item.amount, data.currency),
        ];
        rowCells.forEach((cell, i) => {
          doc.rect(x, y, cols[i], rowH).stroke();
          const align = i <= 1 ? "center" : "right";
          setEmbeddedPdfFontRegular(doc)
            .fontSize(7)
            .text(cell, x + 1, y + 6, { width: cols[i] - 2, align });
          x += cols[i];
        });
        y += rowH;
      });
      doc.y = y + 10;
    }

    /* ----- Totals 框（与网页 bordered p-3 grid 两列一致） ----- */
    ensureVerticalSpace(doc, 90);
    const totTop = doc.y;
    const totPad = 10;
    let tyy = totTop + totPad;
    const totInnerW = innerW - 2 * totPad;

    if (!isResin) {
      const xTot = M + totPad;
      const lwRolls = 78;
      const lwWeight = 92;
      setEmbeddedPdfFontBold(doc).fontSize(9).text("Total Rolls: ", xTot, tyy);
      setEmbeddedPdfFontRegular(doc)
        .fontSize(9)
        .text(String(data.totalRolls), xTot + lwRolls, tyy, { width: totInnerW - lwRolls });
      tyy = doc.y + 4;
      setEmbeddedPdfFontBold(doc).fontSize(9).text("Total Weight: ", xTot, tyy);
      setEmbeddedPdfFontRegular(doc)
        .fontSize(9)
        .text(formatWeight(data.totalWeight), xTot + lwWeight, tyy, { width: totInnerW - lwWeight });
      tyy = doc.y + 6;
    }
    const xTotBase = M + totPad;
    const lwTotAmt = 92;
    const lwTotWords = 102;
    setEmbeddedPdfFontBold(doc).fontSize(9).text("Total Amount: ", xTotBase, tyy);
    setEmbeddedPdfFontRegular(doc)
      .fontSize(9)
      .text(formatUsdPdf(data.totalAmount, data.currency), xTotBase + lwTotAmt, tyy, { width: totInnerW - lwTotAmt });
    tyy = doc.y + 4;
    const words = amountToWords(data.totalAmount, data.currency);
    setEmbeddedPdfFontBold(doc).fontSize(9).text("Total in Words: ", xTotBase, tyy);
    setEmbeddedPdfFontRegular(doc)
      .fontSize(9)
      .text(words, xTotBase + lwTotWords, tyy, { width: totInnerW - lwTotWords });
    tyy = doc.y + 4;
    if (data.terms.moreOrLessPercent != null && data.terms.moreOrLessPercent >= 0) {
      setEmbeddedPdfFontRegular(doc)
        .fontSize(9)
        .text(`${data.terms.moreOrLessPercent}% more or less in quantity and amount allowed.`, M + totPad, tyy, {
          width: totInnerW,
        });
      tyy = doc.y + 4;
    }
    const totH = tyy - totTop + totPad;
    doc.rect(M, totTop, innerW, totH).stroke();
    doc.y = totTop + totH + 14;

    /* ----- Terms（顺序与 ContractDocument + ContractClauseRow 一致） ----- */
    ensureVerticalSpace(doc, 120);
    const termsTop = doc.y;
    const termsPad = 10;
    doc.moveTo(M, termsTop).lineTo(M + innerW, termsTop).stroke();
    doc.y = termsTop + termsPad;

    termClause(doc, M, innerW, "Estimate Date of Shipment:", formatDate(data.terms.estimatedShipmentDate));
    termClause(doc, M, innerW, "Delivery Term:", data.terms.incoterm || "—");
    termClause(doc, M, innerW, "Port of Shipment:", data.terms.portOfShipment || "—");
    termClause(doc, M, innerW, "Port of Destination:", data.terms.portOfDestination || "—");
    termClause(doc, M, innerW, "Partial Shipment:", allowOptionLabelRequired(data.terms.partialShipment));
    termClause(doc, M, innerW, "Transhipment:", allowOptionLabelRequired(data.terms.transhipment));
    termClause(doc, M, innerW, "Packing Standard:", data.terms.packingTerm || "—");
    termClause(doc, M, innerW, "Term of Payment:", data.terms.paymentTerm || "—");
    termClause(doc, M, innerW, "Quality & Quantity Discrepancy and Claim:", "As per standard practice.");
    termClause(doc, M, innerW, "Documents:", data.terms.documentRequirement || "—");
    termClause(doc, M, innerW, "Insurance:", data.terms.insuranceTerm || "—");
    termClause(doc, M, innerW, "Bank Information:", data.terms.bankInfo || "—");
    if (data.terms.remark?.trim()) {
      termClause(doc, M, innerW, "Remark:", data.terms.remark);
    }

    doc.y += termsPad;
    doc.moveDown(0.35);

    /* ----- Signatures（与网页 border-t + 两列签字区） ----- */
    ensureVerticalSpace(doc, 72);
    const sigY = doc.y;
    setEmbeddedPdfFontBold(doc).fontSize(8).text("Buyer Signature", M, sigY, { width: innerW / 2 - 12 });
    setEmbeddedPdfFontBold(doc).fontSize(8).text("Seller Signature", M + innerW / 2, sigY, { width: innerW / 2 - 12 });
    setEmbeddedPdfFontRegular(doc);
    const lineY = sigY + 22;
    doc.moveTo(M, lineY).lineTo(M + innerW / 2 - 16, lineY).stroke();
    doc.moveTo(M + innerW / 2, lineY).lineTo(M + innerW - 8, lineY).stroke();

    doc.end();
  });
}
