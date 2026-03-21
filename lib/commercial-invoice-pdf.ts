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

export type CommercialInvoicePdfItem = {
  productName: string;
  specification: string;
  actualQuantityKg: number;
  actualRollQty: number;
  unitPrice: number;
  amount: number;
};

export type CommercialInvoicePdfInput = {
  invoiceNo: string;
  invoiceDate: string;
  contractNo: string;
  seller: { companyName: string; companyAddress: string | null; companyTel: string | null; companyEmail: string | null };
  buyer: { name: string; address: string | null };
  paymentMethod?: string | null;
  depositAmount?: number | null;
  lcNo?: string | null;
  paymentTerm: string;
  tradeTerm: string;
  packingTerm: string;
  fromPort: string;
  destinationPort: string;
  vesselVoyageNo: string;
  departureDate: string;
  shippingMarks: string;
  items: CommercialInvoicePdfItem[];
  totalAmount: number;
  totalAmountInWords: string;
  depositDeduction: number;
  balanceAmount: number;
  balanceAmountInWords: string;
  currency: string;
};

/** A4 可打印宽度内，列宽之和 = innerW（与边距统一） */
const PAGE_W_PT = 595.28;

export function buildCommercialInvoicePdfBuffer(data: CommercialInvoicePdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const M = 45;
    const innerW = PAGE_W_PT - M * 2;
    const doc = new PDFDocument({ size: "A4", margin: M, info: { Title: `CI ${data.invoiceNo}` } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    registerEmbeddedPdfFonts(doc);

    /* ----- Header：左上 Logo + 英文公司名 + Address / TEL / Email（与 Contract / PL 统一） ----- */
    drawPdfCompanyLetterhead(doc, M, innerW);
    pdfWriteBoldLabelThenValue(doc, M, innerW, "Address:", data.seller.companyAddress || "—", 9);
    pdfWriteBoldLabelThenValue(doc, M, innerW, "TEL:", data.seller.companyTel || "—", 9);
    pdfWriteBoldLabelThenValue(doc, M, innerW, "Email:", data.seller.companyEmail || "—", 9);
    doc.moveDown(0.3);

    ensureVerticalSpace(doc, 40);
    setEmbeddedPdfFontBold(doc).fontSize(16).text("COMMERCIAL INVOICE", M, doc.y, { width: innerW, align: "center" });
    doc.moveDown(0.55);

    setEmbeddedPdfFontBold(doc).fontSize(9).text("Buyer: ", M, doc.y, { continued: true });
    setEmbeddedPdfFontRegular(doc).fontSize(10).text(data.buyer.name || "—", { width: innerW });
    doc.moveDown(0.2);
    pdfWriteBoldLabelThenValue(doc, M, innerW, "Address:", data.buyer.address || "—", 8);
    doc.moveDown(0.25);

    const meta: [string, string][] = [
      ["Invoice No.", data.invoiceNo],
      ["Invoice Date", data.invoiceDate],
      ["Contract No.", data.contractNo],
    ];
    if (data.paymentMethod === "LC" && data.lcNo) meta.push(["L/C No.", data.lcNo]);
    meta.push(
      ["Payment Term", data.paymentTerm || "—"],
      ["Trade Term", data.tradeTerm || "—"],
      ["Packing", data.packingTerm || "—"],
      ["From Port", data.fromPort || "—"],
      ["To Port", data.destinationPort || "—"],
      ["Vessel / Voyage", data.vesselVoyageNo || "—"],
      ["Departure Date", data.departureDate || "—"],
    );
    if (data.shippingMarks?.trim()) meta.push(["Shipping Marks", data.shippingMarks]);
    meta.forEach(([k, v]) => pdfWriteBoldLabelThenValue(doc, M, innerW, `${k}:`, v, 8, 3));
    doc.moveDown(0.25);

    const rowH = 19;
    const cols = [25, 93, 113, 67, 57, 67, 83];
    const headers = ["No.", "Description", "Spec", "Qty kg", "Roll", "U.Price", "Amount"];
    const bottomLimit = () => doc.page.height - doc.page.margins.bottom;
    const breakRow = (y: number, need: number): number => {
      if (y + need <= bottomLimit()) return y;
      doc.addPage();
      reapplyEmbeddedFontRegularAfterNewPage(doc);
      return doc.page.margins.top;
    };

    let y = breakRow(doc.y, rowH + 6);
    let x = M;
    headers.forEach((h, i) => {
      doc.rect(x, y, cols[i], rowH).stroke();
      setEmbeddedPdfFontBold(doc).fontSize(7).text(h, x + 2, y + 5, { width: cols[i] - 4, align: "center" });
      x += cols[i];
    });
    y += rowH;

    data.items.forEach((row, idx) => {
      y = breakRow(y, rowH);
      x = M;
      const cells = [
        String(idx + 1),
        row.productName,
        row.specification || "—",
        formatQtyPdf(row.actualQuantityKg),
        formatQtyPdf(row.actualRollQty),
        formatUsdPdf(row.unitPrice, data.currency),
        formatUsdPdf(row.amount, data.currency),
      ];
      cells.forEach((cell, i) => {
        doc.rect(x, y, cols[i], rowH).stroke();
        setEmbeddedPdfFontRegular(doc)
          .fontSize(7)
          .text(cell, x + 2, y + 4, { width: cols[i] - 4, align: i >= 3 ? "right" : "left" });
        x += cols[i];
      });
      y += rowH;
    });

    doc.y = y + 8;

    pdfWriteBoldLabelThenValue(doc, M, innerW, "Total Amount:", formatUsdPdf(data.totalAmount, data.currency), 9);
    if (data.paymentMethod === "TT" && (data.depositAmount != null || data.depositDeduction > 0)) {
      pdfWriteBoldLabelThenValue(
        doc,
        M,
        innerW,
        "Less: Deposit Amount:",
        formatUsdPdf(data.depositAmount ?? data.depositDeduction, data.currency),
        9,
      );
      pdfWriteBoldLabelThenValue(doc, M, innerW, "Balance Amount Due:", formatUsdPdf(data.balanceAmount, data.currency), 9);
      if (data.balanceAmountInWords?.trim()) {
        pdfWriteBoldLabelThenValue(doc, M, innerW, "Balance in Words:", data.balanceAmountInWords, 9);
      }
    }
    pdfWriteBoldLabelThenValue(doc, M, innerW, "Total in Words:", data.totalAmountInWords, 9);

    doc.end();
  });
}
