import PDFDocument from "@/lib/pdf/pdfkit-node";
import { RESIN_DELIVERY_NOTE_COMPANY_TITLE } from "@/lib/constants/resin-delivery-note-branding";
import {
  registerEmbeddedPdfFonts,
  setEmbeddedPdfFontBold,
  setEmbeddedPdfFontRegular,
} from "@/lib/pdf/fonts";

export type ResinDeliveryNotePdfInput = {
  deliveryNo: string;
  documentDate: Date;
  customerName: string;
  orderNoForTable: string;
  productName: string;
  grade: string;
  unit: string;
  quantity: number;
  carrierLine: string;
  remarkLine: string;
  reviewer?: string | null;
  invoicer?: string | null;
  shipper?: string | null;
};

function signLabelText(label: string, name: string | null | undefined): string {
  const v = name?.trim();
  return v ? `${label}：${v}` : `${label}：________________`;
}

function formatDateLine(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

/** 表格下沿到签字区顶部的空隙 (pt)，与打印页约 24px 接近 */
const GAP_TABLE_TO_SIGN_PT = 26;
/** 合计行下方的空隙 (pt) */
const GAP_AFTER_TABLE_BOTTOM_PT = 8;

/** 服务端生成 A4 纵向送货单 PDF（仅送货单内容，无 CRM 外壳） */
export function buildResinDeliveryNotePdfBuffer(data: ResinDeliveryNotePdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const M = 50;
    const pageW = 595.28;
    const innerW = pageW - M * 2;

    const doc = new PDFDocument({
      size: "A4",
      margin: M,
      info: { Title: "送货单", Author: RESIN_DELIVERY_NOTE_COMPANY_TITLE },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    registerEmbeddedPdfFonts(doc);

    const dateStr = formatDateLine(data.documentDate);
    const qtyStr = Number.isInteger(data.quantity) ? String(data.quantity) : data.quantity.toFixed(2);

    let yTop = M;
    setEmbeddedPdfFontRegular(doc).fontSize(11).text(RESIN_DELIVERY_NOTE_COMPANY_TITLE, M, yTop, {
      width: innerW,
      align: "center",
    });
    yTop = doc.y + 8;
    setEmbeddedPdfFontBold(doc).fontSize(18).text("送货单", M, yTop, { width: innerW, align: "center" });
    doc.moveDown(0.6);

    const headerLine = `购货单位：${data.customerName}    日期：${dateStr}    编号：${data.deliveryNo}`;
    setEmbeddedPdfFontRegular(doc).fontSize(10).text(headerLine, M, doc.y, { width: innerW, align: "left" });
    doc.moveDown(0.2);
    const lineY = doc.y;
    doc.moveTo(M, lineY).lineTo(M + innerW, lineY).strokeColor("#000000").lineWidth(0.5).stroke();
    doc.moveDown(0.6);

    const colWidths = [36, 92, 118, 70, 44, 56, 44];
    const headers = ["序号", "订单号", "品名", "型号", "单位", "数量", "件数"];
    const tableTop = doc.y;
    let x = M;
    headers.forEach((h, i) => {
      doc.rect(x, tableTop, colWidths[i], 22).stroke();
      setEmbeddedPdfFontRegular(doc).fontSize(9).text(h, x + 2, tableTop + 6, {
        width: colWidths[i] - 4,
        align: "center",
      });
      x += colWidths[i];
    });

    let rowY = tableTop + 22;
    x = M;
    const cells = [
      "1",
      data.orderNoForTable,
      data.productName,
      data.grade || "—",
      data.unit,
      qtyStr,
      "—",
    ];
    cells.forEach((cell, i) => {
      doc.rect(x, rowY, colWidths[i], 40).stroke();
      setEmbeddedPdfFontRegular(doc).fontSize(9).text(cell, x + 4, rowY + 12, {
        width: colWidths[i] - 8,
        align: "center",
      });
      x += colWidths[i];
    });

    rowY += 40;
    x = M;
    const mergeW = colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4];
    doc.rect(x, rowY, mergeW, 22).stroke();
    setEmbeddedPdfFontRegular(doc).fontSize(9).text("合计", x + 2, rowY + 6, { width: mergeW - 4, align: "center" });
    x += mergeW;
    doc.rect(x, rowY, colWidths[5], 22).stroke();
    setEmbeddedPdfFontRegular(doc).fontSize(9).text(qtyStr, x + 2, rowY + 6, { width: colWidths[5] - 4, align: "center" });
    x += colWidths[5];
    doc.rect(x, rowY, colWidths[6], 22).stroke();
    setEmbeddedPdfFontRegular(doc).fontSize(9).text("—", x + 2, rowY + 6, { width: colWidths[6] - 4, align: "center" });

    /** 表格（含合计行）最底边 */
    const tableBottomY = rowY + 22;
    /** 正文继续位置：紧贴表格下方 */
    let contentY = tableBottomY + GAP_AFTER_TABLE_BOTTOM_PT;

    if (data.carrierLine) {
      setEmbeddedPdfFontRegular(doc).fontSize(9).text(`承运：${data.carrierLine}`, M, contentY, { width: innerW });
      contentY = doc.y + 6;
    }
    if (data.remarkLine) {
      setEmbeddedPdfFontRegular(doc).fontSize(9).text(`备注：${data.remarkLine}`, M, contentY, { width: innerW });
      contentY = doc.y + 8;
    }

    /** 签字区：紧跟在承运/备注之后，再留 GAP_TABLE_TO_SIGN_PT（不再使用 Math.max(...,600) 贴页面底部） */
    const signY = contentY + GAP_TABLE_TO_SIGN_PT;
    const signColW = innerW / 4;
    const signTexts = [
      signLabelText("审核", data.reviewer),
      signLabelText("开票人", data.invoicer),
      signLabelText("发货人", data.shipper),
      signLabelText("收货人", null),
    ];
    signTexts.forEach((t, i) => {
      setEmbeddedPdfFontRegular(doc).fontSize(9).text(t, M + i * signColW, signY, {
        width: signColW - 8,
        align: "left",
      });
    });

    doc.end();
  });
}
