"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function formatUSD(value: number, currency: string): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + ` ${currency}`;
}

function formatQty(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Item = {
  productName: string;
  specification: string;
  actualQuantityKg: number;
  actualRollQty: number;
  unitPrice: number;
  amount: number;
};

type Props = {
  commercialInvoiceId: string;
  invoiceNo: string;
  invoiceDate: string;
  contractNo: string;
  seller: { companyName: string; companyAddress: string | null; companyTel: string | null; companyEmail: string | null };
  buyer: { name: string; address: string | null };
  paymentMethod?: string | null;
  depositRatio?: number | null;
  depositAmount?: number | null;
  lcNo?: string | null;
  paymentTerm: string;
  tradeTerm: string;
  packingTerm: string;
  fromPort: string;
  destinationPort: string;
  vesselVoyageNo: string;
  departureDate: string;
  items: Item[];
  totalAmount: number;
  totalAmountInWords: string;
  depositDeduction: number;
  balanceAmount: number;
  balanceAmountInWords: string;
  shippingMarks: string;
  currency: string;
};

export function CommercialInvoicePrintView(props: Props) {
  const {
    commercialInvoiceId,
    invoiceNo,
    invoiceDate,
    contractNo,
    seller,
    buyer,
    paymentMethod,
    depositAmount,
    lcNo,
    paymentTerm,
    tradeTerm,
    packingTerm,
    fromPort,
    destinationPort,
    vesselVoyageNo,
    departureDate,
    items,
    totalAmount,
    totalAmountInWords,
    depositDeduction,
    balanceAmount,
    balanceAmountInWords,
    shippingMarks,
    currency,
  } = props;

  return (
    <>
      <div className="sticky top-0 z-10 flex-shrink-0 border-b bg-card px-4 py-3 flex items-center gap-3 print:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/commercial-invoices/${commercialInvoiceId}`}>返回</Link>
        </Button>
        <Button size="sm" onClick={() => window.print()}>打印 / 导出 PDF</Button>
      </div>
      <div className="flex justify-center px-6 py-8 print:py-4 bg-gray-100 print:bg-transparent">
        <article className="bg-white text-black shadow-md rounded-md print:shadow-none max-w-[210mm] w-full box-border p-6 md:p-8 text-sm">
          <h1 className="text-xl font-bold text-center mb-6">COMMERCIAL INVOICE</h1>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="font-semibold mb-1">Seller</p>
              <p>{seller.companyName}</p>
              <p className="whitespace-pre-line text-gray-700">{seller.companyAddress}</p>
              <p>TEL: {seller.companyTel}</p>
              <p>Email: {seller.companyEmail}</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Buyer</p>
              <p>{buyer.name}</p>
              <p className="whitespace-pre-line text-gray-700">{buyer.address ?? "—"}</p>
            </div>
          </div>

          <table className="w-full text-sm mb-4">
            <tbody>
              <tr><td className="py-1 w-32 font-medium">Invoice No.</td><td>{invoiceNo}</td></tr>
              <tr><td className="py-1 font-medium">Invoice Date</td><td>{invoiceDate}</td></tr>
              <tr><td className="py-1 font-medium">Contract No.</td><td>{contractNo}</td></tr>
              {paymentMethod === "LC" && lcNo ? <tr><td className="py-1 font-medium">L/C No.</td><td>{lcNo}</td></tr> : null}
              <tr><td className="py-1 font-medium">Payment Term</td><td>{paymentTerm || "—"}</td></tr>
              <tr><td className="py-1 font-medium">Trade Term</td><td>{tradeTerm || "—"}</td></tr>
              <tr><td className="py-1 font-medium">Packing</td><td>{packingTerm || "—"}</td></tr>
              <tr><td className="py-1 font-medium">From Port</td><td>{fromPort || "—"}</td></tr>
              <tr><td className="py-1 font-medium">To Port</td><td>{destinationPort || "—"}</td></tr>
              <tr><td className="py-1 font-medium">Vessel / Voyage</td><td>{vesselVoyageNo || "—"}</td></tr>
              <tr><td className="py-1 font-medium">Departure Date</td><td>{departureDate || "—"}</td></tr>
              {shippingMarks ? <tr><td className="py-1 font-medium">Shipping Marks</td><td>{shippingMarks}</td></tr> : null}
            </tbody>
          </table>

          {/* 列宽（px）：No. 48 | Description 120 | Specification 180 | Quantity 90 | Roll Qty 78 | Unit Price 90 | Amount 110；合计 716px，适配 A4 */}
          <table className="w-full table-fixed border-collapse border border-black text-sm" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 48 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 180 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 78 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 110 }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-100 font-semibold">
                <th className="border border-black p-2 text-left" style={{ width: 48 }}>No.</th>
                <th className="border border-black p-2 text-left" style={{ width: 120 }}>Description</th>
                <th className="border border-black p-2 text-left" style={{ width: 180 }}>Specification</th>
                <th className="border border-black p-2 text-right" style={{ width: 90 }}>Quantity (kg)</th>
                <th className="border border-black p-2 text-right" style={{ width: 78 }}>Roll Qty</th>
                <th className="border border-black p-2 text-right" style={{ width: 90 }}>Unit Price</th>
                <th className="border border-black p-2 text-right" style={{ width: 110 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-black p-2 text-left">{idx + 1}</td>
                  <td className="border border-black p-2 text-left align-top">{row.productName}</td>
                  <td className="border border-black p-2 text-left align-top whitespace-nowrap">{row.specification || "—"}</td>
                  <td className="border border-black p-2 text-right align-top">{formatQty(row.actualQuantityKg)}</td>
                  <td className="border border-black p-2 text-right align-top">{formatQty(row.actualRollQty)}</td>
                  <td className="border border-black p-2 text-right align-top">{formatUSD(row.unitPrice, currency)}</td>
                  <td className="border border-black p-2 text-right align-top">{formatUSD(row.amount, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 pt-2 border-t border-gray-300 space-y-1.5 text-sm">
            <p><span className="font-semibold">Total Amount: </span>{formatUSD(totalAmount, currency)}</p>
            {paymentMethod === "TT" && (depositAmount != null || depositDeduction > 0) && (
              <>
                <p><span className="font-semibold">Less: Deposit Amount: </span>{formatUSD(depositAmount ?? depositDeduction, currency)}</p>
                <p><span className="font-semibold">Balance Amount Due: </span>{formatUSD(balanceAmount, currency)}</p>
                {balanceAmountInWords ? <p><span className="font-semibold">Balance in Words: </span><span className="italic">{balanceAmountInWords}</span></p> : null}
              </>
            )}
            <p><span className="font-semibold">Total in Words: </span><span className="italic">{totalAmountInWords}</span></p>
          </div>
        </article>
      </div>
    </>
  );
}
