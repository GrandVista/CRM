import PDFDocument from "@/lib/pdf/pdfkit-node";
import {
  registerEmbeddedPdfFonts,
  setEmbeddedPdfFontBold,
  setEmbeddedPdfFontRegular,
  reapplyEmbeddedFontRegularAfterNewPage,
} from "@/lib/pdf/fonts";
import { ensureVerticalSpace } from "@/lib/pdf/page-layout";
import { drawPdfCompanyLetterhead, pdfWriteBoldLabelThenValue } from "@/lib/pdf/logo-header";
import { formatQtyPdf } from "@/lib/pdf/helpers";

export type PackingListPdfItem = {
  productName: string;
  specification: string;
  actualRollQty: number;
  actualNetWeightKg: number;
};

export type PackingListPdfInput = {
  plNo: string;
  documentDate: string;
  contractNo: string;
  invoiceNo: string;
  seller: { companyName: string; companyAddress: string | null };
  buyer: { name: string; address: string | null };
  paymentMethod?: string | null;
  lcNo?: string | null;
  paymentTerm: string;
  tradeTerm: string;
  packingTerm: string;
  fromPort: string;
  destinationPort: string;
  vesselVoyageNo: string;
  departureDate: string;
  containerNo: string;
  sealNo: string;
  shippingMarks: string;
  items: PackingListPdfItem[];
  totalPallets?: number | null;
  totalRolls: number;
  totalNetWeight: number;
  totalGrossWeight?: number | null;
  totalCbm?: number | null;
};

const PAGE_W_PT = 595.28;

export function buildPackingListPdfBuffer(data: PackingListPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const M = 45;
    const innerW = PAGE_W_PT - M * 2;
    const doc = new PDFDocument({ size: "A4", margin: M, info: { Title: `PL ${data.plNo}` } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    registerEmbeddedPdfFonts(doc);

    /* ----- Header：左上 Logo + 英文公司名 + Address（与 Contract / CI 统一） ----- */
    drawPdfCompanyLetterhead(doc, M, innerW);
    pdfWriteBoldLabelThenValue(doc, M, innerW, "Address:", data.seller.companyAddress || "—", 9);
    doc.moveDown(0.3);

    ensureVerticalSpace(doc, 40);
    setEmbeddedPdfFontBold(doc).fontSize(16).text("PACKING LIST", M, doc.y, { width: innerW, align: "center" });
    doc.moveDown(0.55);

    setEmbeddedPdfFontBold(doc).fontSize(9).text("Buyer: ", M, doc.y, { continued: true });
    setEmbeddedPdfFontRegular(doc).fontSize(10).text(data.buyer.name, { width: innerW });
    doc.moveDown(0.2);
    pdfWriteBoldLabelThenValue(doc, M, innerW, "Address:", data.buyer.address || "—", 8);
    doc.moveDown(0.25);

    pdfWriteBoldLabelThenValue(doc, M, innerW, "PL No.:", data.plNo, 8, 3);
    pdfWriteBoldLabelThenValue(doc, M, innerW, "Date:", data.documentDate, 8, 3);
    pdfWriteBoldLabelThenValue(doc, M, innerW, "Contract No.:", data.contractNo, 8, 3);
    pdfWriteBoldLabelThenValue(doc, M, innerW, "Invoice No.:", data.invoiceNo || "—", 8, 3);
    if (data.paymentMethod) {
      const pm = data.paymentMethod === "TT" ? "T/T" : data.paymentMethod === "LC" ? "L/C" : data.paymentMethod;
      pdfWriteBoldLabelThenValue(doc, M, innerW, "Payment Method:", pm, 8, 3);
      if (data.paymentMethod === "LC" && data.lcNo) {
        pdfWriteBoldLabelThenValue(doc, M, innerW, "L/C No.:", data.lcNo, 8, 3);
      }
    }
    pdfWriteBoldLabelThenValue(
      doc,
      M,
      innerW,
      "Payment / Trade:",
      `${data.paymentTerm || "—"} / ${data.tradeTerm || "—"}`,
      8,
      3,
    );
    pdfWriteBoldLabelThenValue(doc, M, innerW, "Packing:", data.packingTerm || "—", 8, 3);
    pdfWriteBoldLabelThenValue(
      doc,
      M,
      innerW,
      "From / To Port:",
      `${data.fromPort || "—"} / ${data.destinationPort || "—"}`,
      8,
      3,
    );
    pdfWriteBoldLabelThenValue(doc, M, innerW, "Vessel / Voyage:", data.vesselVoyageNo || "—", 8, 3);
    pdfWriteBoldLabelThenValue(doc, M, innerW, "Departure:", data.departureDate || "—", 8, 3);
    pdfWriteBoldLabelThenValue(
      doc,
      M,
      innerW,
      "Container / Seal:",
      `${data.containerNo || "—"} / ${data.sealNo || "—"}`,
      8,
      3,
    );
    if (data.shippingMarks?.trim()) {
      pdfWriteBoldLabelThenValue(doc, M, innerW, "Shipping Marks:", data.shippingMarks, 8, 3);
    }
    doc.moveDown(0.25);

    const rowH = 19;
    const cols = [27, 157, 176, 71, 74];
    const headers = ["No.", "Description", "Specification", "Roll Qty", "Net Wt (kg)"];
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
        formatQtyPdf(row.actualRollQty),
        formatQtyPdf(row.actualNetWeightKg),
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

    pdfWriteBoldLabelThenValue(doc, M, innerW, "Total Rolls:", formatQtyPdf(data.totalRolls), 9);
    pdfWriteBoldLabelThenValue(doc, M, innerW, "Total Net Weight (kg):", formatQtyPdf(data.totalNetWeight), 9);
    pdfWriteBoldLabelThenValue(
      doc,
      M,
      innerW,
      "Total Gross Weight (kg):",
      data.totalGrossWeight != null ? formatQtyPdf(data.totalGrossWeight) : "—",
      9,
    );
    pdfWriteBoldLabelThenValue(
      doc,
      M,
      innerW,
      "Total Pallets:",
      data.totalPallets != null ? String(data.totalPallets) : "—",
      9,
    );
    pdfWriteBoldLabelThenValue(
      doc,
      M,
      innerW,
      "Total CBM:",
      data.totalCbm != null ? formatQtyPdf(data.totalCbm) : "—",
      9,
    );

    doc.end();
  });
}
