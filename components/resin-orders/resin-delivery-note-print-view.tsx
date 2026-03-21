"use client";

import { formatDate } from "@/lib/utils/date";
import { PrintButton } from "@/components/ui/print-button";
import { PdfActionButtons } from "@/components/pdf/pdf-action-buttons";
import { RESIN_DELIVERY_NOTE_COMPANY_TITLE } from "@/lib/constants/resin-delivery-note-branding";

type Props = {
  shipmentId: string;
  deliveryNo: string;
  /** 显示在「日期」栏：有发货日期用发货日期，否则用打开页时的日期 */
  documentDate: Date;
  customerName: string;
  orderNoForTable: string;
  productName: string;
  grade: string;
  unit: string;
  quantity: number;
  /** 承运备注：司机、车牌等 */
  carrierLine: string;
  remarkLine: string;
  reviewer: string;
  invoicer: string;
  shipper: string;
};

function SignOffCell({ label, value }: { label: string; value: string }) {
  const v = value.trim();
  return (
    <div className="flex flex-wrap items-end gap-x-1 text-sm">
      <span className="font-medium shrink-0">{label}</span>
      <span className="inline-block min-w-[5rem] flex-1 border-b border-black text-center leading-6 min-h-[1.5rem]">
        {v || "\u00A0"}
      </span>
    </div>
  );
}

export function ResinDeliveryNotePrintView({
  shipmentId,
  deliveryNo,
  documentDate,
  customerName,
  orderNoForTable,
  productName,
  grade,
  unit,
  quantity,
  carrierLine,
  remarkLine,
  reviewer,
  invoicer,
  shipper,
}: Props) {
  const dateStr = formatDate(documentDate);
  const qtyStr = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2);
  const totalStr = qtyStr;
  return (
    <div className="resin-delivery-note-print mx-auto max-w-[210mm] bg-white p-6 text-black print:p-8 print:shadow-none">
      <style>{`
        @media print {
          .resin-delivery-note-print { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>

      <p className="text-center text-sm font-semibold tracking-wide mb-2 print:mb-2">
        {RESIN_DELIVERY_NOTE_COMPANY_TITLE}
      </p>
      <h1 className="text-center text-2xl font-bold tracking-widest mb-6">送货单</h1>

      <div className="flex flex-wrap justify-between gap-4 border-b border-black pb-2 mb-4 text-sm">
        <div className="min-w-[12rem]">
          <span className="font-medium">购货单位：</span>
          <span>{customerName}</span>
        </div>
        <div className="min-w-[8rem]">
          <span className="font-medium">日期：</span>
          <span>{dateStr}</span>
        </div>
        <div className="min-w-[10rem]">
          <span className="font-medium">编号：</span>
          <span>{deliveryNo}</span>
        </div>
      </div>

      <table className="w-full border-collapse border border-black text-sm">
        <thead>
          <tr className="bg-neutral-100 print:bg-white">
            <th className="border border-black px-1 py-2 w-10 text-center font-medium">序号</th>
            <th className="border border-black px-1 py-2 text-center font-medium">订单号</th>
            <th className="border border-black px-1 py-2 text-center font-medium">品名</th>
            <th className="border border-black px-1 py-2 text-center font-medium">型号</th>
            <th className="border border-black px-1 py-2 w-14 text-center font-medium">单位</th>
            <th className="border border-black px-1 py-2 w-20 text-center font-medium">数量</th>
            <th className="border border-black px-1 py-2 w-14 text-center font-medium">件数</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black px-1 py-3 text-center align-middle">1</td>
            <td className="border border-black px-1 py-3 text-center align-middle">{orderNoForTable}</td>
            <td className="border border-black px-1 py-3 text-center align-middle">{productName}</td>
            <td className="border border-black px-1 py-3 text-center align-middle">{grade || "—"}</td>
            <td className="border border-black px-1 py-3 text-center align-middle">{unit}</td>
            <td className="border border-black px-1 py-3 text-center align-middle">{qtyStr}</td>
            <td className="border border-black px-1 py-3 text-center align-middle">—</td>
          </tr>
          <tr>
            <td className="border border-black px-1 py-2 text-center font-medium" colSpan={5}>
              合计
            </td>
            <td className="border border-black px-1 py-2 text-center font-medium">{totalStr}</td>
            <td className="border border-black px-1 py-2 text-center">—</td>
          </tr>
        </tbody>
      </table>

      {carrierLine ? (
        <p className="mt-3 text-sm border border-black border-t-0 px-2 py-1">
          <span className="font-medium">承运：</span>
          {carrierLine}
        </p>
      ) : null}

      {remarkLine ? (
        <p className="mt-2 text-sm">
          <span className="font-medium">备注：</span>
          {remarkLine}
        </p>
      ) : null}

      {/* 与 PDF 一致：表格/备注下方约 24~28px 后即签字区，避免大块空白 */}
      <div className="mt-7 grid grid-cols-2 gap-y-8 gap-x-6 sm:grid-cols-4 print:grid-cols-4">
        <SignOffCell label="审核" value={reviewer} />
        <SignOffCell label="开票人" value={invoicer} />
        <SignOffCell label="发货人" value={shipper} />
        <SignOffCell label="收货人" value="" />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2 print:hidden">
        <PdfActionButtons
          previewUrl={`/api/resin-orders/delivery-note/${shipmentId}/pdf`}
          downloadUrl={`/api/resin-orders/delivery-note/${shipmentId}/pdf?download=1`}
        />
        <PrintButton label="打印本页" />
      </div>
    </div>
  );
}
