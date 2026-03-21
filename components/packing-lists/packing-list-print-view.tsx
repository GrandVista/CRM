"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PdfActionButtons } from "@/components/pdf/pdf-action-buttons";

function formatQty(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Item = {
  productName: string;
  specification: string;
  actualRollQty: number;
  actualNetWeightKg: number;
  palletQty?: number;
  grossWeightKg?: number;
  cbm?: number;
};

type Props = {
  packingListId: string;
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
  items: Item[];
  totalPallets?: number;
  totalRolls: number;
  totalNetWeight: number;
  totalGrossWeight?: number;
  totalCbm?: number;
  shippingMarks: string;
};

export function PackingListPrintView(props: Props) {
  const {
    packingListId,
    plNo,
    documentDate,
    contractNo,
    invoiceNo,
    seller,
    buyer,
    paymentMethod,
    lcNo,
    paymentTerm,
    tradeTerm,
    packingTerm,
    fromPort,
    destinationPort,
    vesselVoyageNo,
    departureDate,
    containerNo,
    sealNo,
    items,
    totalPallets,
    totalRolls,
    totalNetWeight,
    totalGrossWeight,
    totalCbm,
    shippingMarks,
  } = props;

  return (
    <>
      <div className="sticky top-0 z-10 flex-shrink-0 border-b bg-card px-4 py-3 flex flex-wrap items-center gap-3 print:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/cl/${packingListId}`}>返回</Link>
        </Button>
        <PdfActionButtons
          previewUrl={`/api/packing-lists/${packingListId}/pdf`}
          downloadUrl={`/api/packing-lists/${packingListId}/pdf?download=1`}
        />
        <Button variant="secondary" size="sm" onClick={() => window.print()}>
          打印网页
        </Button>
      </div>
      <div className="flex justify-center px-6 py-8 print:py-4 bg-gray-100 print:bg-transparent">
        <article className="bg-white text-black shadow-md rounded-md print:shadow-none max-w-[210mm] w-full box-border p-6 md:p-8 text-sm">
          <h1 className="text-xl font-bold text-center mb-6">PACKING LIST</h1>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="font-semibold mb-1">Seller</p>
              <p>{seller.companyName}</p>
              <p className="whitespace-pre-line text-gray-700">{seller.companyAddress}</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Buyer</p>
              <p>{buyer.name}</p>
              <p className="whitespace-pre-line text-gray-700">{buyer.address ?? "—"}</p>
            </div>
          </div>

          <table className="w-full text-sm mb-4">
            <tbody>
              <tr><td className="py-1 w-32 font-medium">PL No.</td><td>{plNo}</td></tr>
              <tr><td className="py-1 font-medium">Date</td><td>{documentDate}</td></tr>
              <tr><td className="py-1 font-medium">Contract No.</td><td>{contractNo}</td></tr>
              <tr><td className="py-1 font-medium">Invoice No.</td><td>{invoiceNo || "—"}</td></tr>
              {paymentMethod && (
                <>
                  <tr><td className="py-1 font-medium">Payment Method</td><td>{paymentMethod === "TT" ? "T/T" : paymentMethod === "LC" ? "L/C" : paymentMethod}</td></tr>
                  {paymentMethod === "LC" && lcNo && <tr><td className="py-1 font-medium">L/C No.</td><td>{lcNo}</td></tr>}
                </>
              )}
              <tr><td className="py-1 font-medium">Payment / Trade</td><td>{paymentTerm || "—"} / {tradeTerm || "—"}</td></tr>
              <tr><td className="py-1 font-medium">Packing</td><td>{packingTerm || "—"}</td></tr>
              <tr><td className="py-1 font-medium">From / To Port</td><td>{fromPort || "—"} / {destinationPort || "—"}</td></tr>
              <tr><td className="py-1 font-medium">Vessel / Voyage</td><td>{vesselVoyageNo || "—"}</td></tr>
              <tr><td className="py-1 font-medium">Departure</td><td>{departureDate || "—"}</td></tr>
              <tr><td className="py-1 font-medium">Container / Seal</td><td>{containerNo || "—"} / {sealNo || "—"}</td></tr>
              {shippingMarks ? <tr><td className="py-1 font-medium">Shipping Marks</td><td>{shippingMarks}</td></tr> : null}
            </tbody>
          </table>

          {/* 列：No. | Description | Specification | Roll Qty | Net Wt (kg)；已删除 Pallets / Gross (kg) / CBM */}
          <table className="w-full table-fixed border-collapse border border-black text-sm" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 48 }} />
              <col style={{ width: 200 }} />
              <col style={{ width: 220 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 100 }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-100 font-semibold">
                <th className="border border-black p-2 text-left">No.</th>
                <th className="border border-black p-2 text-left">Description</th>
                <th className="border border-black p-2 text-left">Specification</th>
                <th className="border border-black p-2 text-right">Roll Qty</th>
                <th className="border border-black p-2 text-right">Net Wt (kg)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-black p-2 text-left align-top">{idx + 1}</td>
                  <td className="border border-black p-2 text-left align-top">{row.productName}</td>
                  <td className="border border-black p-2 text-left align-top whitespace-nowrap">{row.specification || "—"}</td>
                  <td className="border border-black p-2 text-right align-top">{formatQty(row.actualRollQty)}</td>
                  <td className="border border-black p-2 text-right align-top">{formatQty(row.actualNetWeightKg)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <table className="text-sm w-64">
              <tbody>
                <tr><td className="py-1 font-medium">Total Rolls</td><td className="text-right">{formatQty(totalRolls)}</td></tr>
                <tr><td className="py-1 font-medium">Total Net Weight (kg)</td><td className="text-right">{formatQty(totalNetWeight)}</td></tr>
                <tr><td className="py-1 font-medium">Total Gross Weight (kg)</td><td className="text-right">{totalGrossWeight != null ? formatQty(totalGrossWeight) : "—"}</td></tr>
                <tr><td className="py-1 font-medium">Total Pallets</td><td className="text-right">{totalPallets != null ? totalPallets : "—"}</td></tr>
                <tr><td className="py-1 font-medium">Total CBM</td><td className="text-right">{totalCbm != null ? formatQty(totalCbm) : "—"}</td></tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </>
  );
}
