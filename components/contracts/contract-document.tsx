"use client";

import React from "react";
import { formatDate } from "@/lib/utils/date";
import { amountToWords } from "@/lib/utils/number-to-words";
import { formatWeight } from "@/lib/numbers";
import { allowOptionLabelRequired } from "@/lib/allow-option";
import { ContractClauseRow } from "@/components/contracts/contract-clause-row";

/** 合同预览/打印中金额统一格式：带 $，保留两位小数，如 $1.70、$18,360.00 */
function formatUSD(value?: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** 合同表格 Quantity 列：仅 UI 格式化，两位小数 + 千分位，如 10800 -> 10,800.00 */
function formatQuantityKg(value?: number | null): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export type ContractDocumentSeller = {
  companyName?: string | null;
  companyAddress?: string | null;
  companyTel?: string | null;
  companyEmail?: string | null;
  companyFax?: string | null;
};

export type ContractDocumentBuyer = {
  name: string;
  address?: string | null;
  phone?: string | null;
};

export type ContractDocumentItem = {
  productName: string;
  thickness?: string | number | null;
  width?: string | number | null;
  length?: string | number | null;
  unitPrice: number;
  rollQty: number;
  quantityKg: number;
  amount: number;
};

export type ContractDocumentTerms = {
  estimatedShipmentDate?: string | null;
  incoterm?: string | null;
  portOfShipment?: string | null;
  portOfDestination?: string | null;
  partialShipment?: string | null;
  transhipment?: string | null;
  packingTerm?: string | null;
  paymentMethod?: string | null;
  depositRatio?: number | null;
  lcNo?: string | null;
  paymentTerm?: string | null;
  documentRequirement?: string | null;
  insuranceTerm?: string | null;
  bankInfo?: string | null;
  moreOrLessPercent?: number | null;
  remark?: string | null;
};

export type ContractDocumentProps = {
  seller: ContractDocumentSeller;
  contractNo: string;
  contractDate: string;
  buyer: ContractDocumentBuyer;
  items: ContractDocumentItem[];
  totalRolls: number;
  totalWeight: number;
  totalAmount: number;
  currency: string;
  terms: ContractDocumentTerms;
  /** FILM = 9-column table + rolls/weight/amount; RESIN = 5-column table + total amount only */
  contractType?: "FILM" | "RESIN";
  /** Optional: hide decorative styles for print */
  forPrint?: boolean;
  className?: string;
  /** When provided, render this instead of the default items table (e.g. editable table in edit page). Totals section still uses totalRolls/totalWeight/totalAmount from props. */
  itemsTable?: React.ReactNode;
};

function tdClass(forPrint?: boolean) {
  return forPrint
    ? "border border-black p-1.5 text-sm"
    : "border border-gray-300 p-2 text-sm";
}

function thClass(forPrint?: boolean) {
  return forPrint
    ? "border border-black p-1.5 text-sm font-semibold bg-gray-100"
    : "border border-gray-300 p-2 text-sm font-semibold bg-gray-100";
}

/** 条款区标签列宽度，保证内容左边缘对齐（含最长标签 Quality & Quantity...） */
const TERMS_LABEL_WIDTH = "14rem";

export function ContractDocument({
  seller,
  contractNo,
  contractDate,
  buyer,
  items,
  totalRolls,
  totalWeight,
  totalAmount,
  currency,
  terms,
  contractType = "FILM",
  forPrint = false,
  className = "",
  itemsTable: itemsTableSlot,
}: ContractDocumentProps) {
  const borderClass = forPrint ? "border border-black" : "border border-gray-300";
  const isResin = contractType === "RESIN";

  return (
    <article
      className={`bg-white text-black mx-auto text-sm box-border ${className} pt-[10mm] pr-[8mm] pb-[12mm] pl-[8mm] ${forPrint ? "w-[210mm] max-w-[210mm] print:w-full print:max-w-full" : "max-w-[210mm]"}`}
    >
      {/* 1. Seller company info (from Settings CompanyProfile) */}
      <header className="mb-6">
        <p className="text-lg font-bold">{seller.companyName || "—"}</p>
        <p className="text-sm mt-1">
          <span className="font-medium">Address</span>
          <br />
          <span className="whitespace-pre-line break-words">{seller.companyAddress || "—"}</span>
        </p>
        <p className="text-sm mt-1">
          <span className="font-medium">TEL</span>
          <br />
          {seller.companyTel || "—"}
        </p>
      </header>

      {/* 2. Title */}
      <h2 className="text-center text-xl font-bold tracking-wide mb-6">
        SALE CONTRACT
      </h2>

      {/* 3. Basic info block (Buyer: customer; ADD: customer.address; TEL: customer.phone) */}
      <section className={`${borderClass} p-4 mb-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm`}>
        <div className="col-span-2 grid grid-cols-[70px_1fr] gap-x-2 items-baseline">
          <span className="font-semibold shrink-0">Buyer:</span>
          <span className="whitespace-nowrap">{buyer.name || "—"}</span>
        </div>
        <div>
          <span className="font-semibold">ADD: </span>
          <span className="whitespace-pre-line break-words">{buyer.address || "—"}</span>
        </div>
        <div />
        <div>
          <span className="font-semibold">TEL: </span>
          <span>{buyer.phone || "—"}</span>
        </div>
        <div />
        <div>
          <span className="font-semibold">No.: </span>
          <span>{contractNo || "—"}</span>
        </div>
        <div>
          <span className="font-semibold">Date: </span>
          <span>{formatDate(contractDate)}</span>
        </div>
      </section>

      {/* 4. Details table — 无横向滚动，适配 A4；可注入可编辑表格（编辑页） */}
      {itemsTableSlot != null ? (
        itemsTableSlot
      ) : isResin ? (
        <section className="mb-4 overflow-visible print:overflow-visible">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead>
              <tr>
                <th className={`${thClass(forPrint)} w-[48px] whitespace-nowrap`}>No.</th>
                <th className={`${thClass(forPrint)} min-w-[120px] whitespace-nowrap`}>Product Name</th>
                <th className={`${thClass(forPrint)} w-[78px] whitespace-nowrap`}>Unit price</th>
                <th className={`${thClass(forPrint)} w-[82px] text-center whitespace-nowrap`}>Quantity</th>
                <th className={`${thClass(forPrint)} w-[96px] whitespace-nowrap`}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className={tdClass(forPrint)}>—</td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx}>
                    <td className={`${tdClass(forPrint)} overflow-hidden min-w-0`}>{idx + 1}</td>
                    <td className={`${tdClass(forPrint)} overflow-hidden min-w-0 break-words`}>{item.productName || "—"}</td>
                    <td className={`${tdClass(forPrint)} overflow-hidden min-w-0`}>{formatUSD(item.unitPrice)}</td>
                    <td className={`${tdClass(forPrint)} overflow-hidden min-w-0`}>{formatQuantityKg(item.quantityKg)}</td>
                    <td className={`${tdClass(forPrint)} overflow-hidden min-w-0`}>{formatUSD(item.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="mb-4 overflow-visible print:overflow-visible">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead>
              <tr>
                <th className={`${thClass(forPrint)} w-[48px] whitespace-nowrap`}>No.</th>
                <th className={`${thClass(forPrint)} min-w-[120px] whitespace-nowrap`}>Product Name</th>
                <th className={`${thClass(forPrint)} w-[78px] text-center whitespace-nowrap`}>
                  Thickness
                  <br />
                  <span className="whitespace-nowrap">(μm)</span>
                </th>
                <th className={`${thClass(forPrint)} w-[68px] text-center whitespace-nowrap`}>
                  Width
                  <br />
                  (mm)
                </th>
                <th className={`${thClass(forPrint)} w-[60px] text-center whitespace-nowrap`}>
                  Meters
                  <br />
                  (m)
                </th>
                <th className={`${thClass(forPrint)} w-[78px] whitespace-nowrap`}>Unit price</th>
                <th className={`${thClass(forPrint)} w-[60px] whitespace-nowrap`}>Roll Qty</th>
                <th className={`${thClass(forPrint)} w-[82px] text-center whitespace-nowrap`}>
                  Quantity
                  <br />
                  (kg)
                </th>
                <th className={`${thClass(forPrint)} w-[96px] whitespace-nowrap`}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className={tdClass(forPrint)}>
                    —
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx}>
                    <td className={`${tdClass(forPrint)} overflow-hidden min-w-0`}>{idx + 1}</td>
                    <td className={`${tdClass(forPrint)} overflow-hidden min-w-0 break-words`}>{item.productName || "—"}</td>
                    <td className={`${tdClass(forPrint)} overflow-hidden min-w-0`}>{item.thickness ?? "—"}</td>
                    <td className={`${tdClass(forPrint)} overflow-hidden min-w-0`}>{item.width ?? "—"}</td>
                    <td className={`${tdClass(forPrint)} overflow-hidden min-w-0`}>{item.length ?? "—"}</td>
                    <td className={`${tdClass(forPrint)} overflow-hidden min-w-0`}>{formatUSD(item.unitPrice)}</td>
                    <td className={`${tdClass(forPrint)} overflow-hidden min-w-0`}>{item.rollQty ?? "—"}</td>
                    <td className={`${tdClass(forPrint)} overflow-hidden min-w-0`}>{formatQuantityKg(item.quantityKg)}</td>
                    <td className={`${tdClass(forPrint)} overflow-hidden min-w-0`}>{formatUSD(item.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      )}

      {/* 5. Totals */}
      <section className={`${borderClass} p-3 mb-6 grid grid-cols-2 gap-x-4 gap-y-1 text-sm`}>
        {!isResin && (
          <>
            <div><span className="font-semibold">Total Rolls: </span>{totalRolls}</div>
            <div><span className="font-semibold">Total Weight: </span>{formatWeight(totalWeight)}</div>
          </>
        )}
        <div><span className="font-semibold">Total Amount: </span>{formatUSD(totalAmount)}</div>
        <div className="col-span-2">
          <span className="font-semibold">Total in Words: </span>
          <span className="italic">{amountToWords(totalAmount, currency)}</span>
        </div>
        {terms.moreOrLessPercent != null && terms.moreOrLessPercent >= 0 && (
          <div className="col-span-2 mt-1">
            {terms.moreOrLessPercent}% more or less in quantity and amount allowed.
          </div>
        )}
      </section>

      {/* 6. Terms — 两列结构：固定宽度标签 + 内容区，多行内容左边缘对齐 */}
      <section className={`${borderClass} p-4 mb-6 space-y-2 text-sm`}>
        <ContractClauseRow label="Estimate Date of Shipment:" labelWidth={TERMS_LABEL_WIDTH}>
          {formatDate(terms.estimatedShipmentDate)}
        </ContractClauseRow>
        <ContractClauseRow label="Delivery Term:" labelWidth={TERMS_LABEL_WIDTH}>
          {terms.incoterm || "—"}
        </ContractClauseRow>
        <ContractClauseRow label="Port of Shipment:" labelWidth={TERMS_LABEL_WIDTH}>
          {terms.portOfShipment || "—"}
        </ContractClauseRow>
        <ContractClauseRow label="Port of Destination:" labelWidth={TERMS_LABEL_WIDTH}>
          {terms.portOfDestination || "—"}
        </ContractClauseRow>
        <ContractClauseRow label="Partial Shipment:" labelWidth={TERMS_LABEL_WIDTH}>
          {allowOptionLabelRequired(terms.partialShipment)}
        </ContractClauseRow>
        <ContractClauseRow label="Transhipment:" labelWidth={TERMS_LABEL_WIDTH}>
          {allowOptionLabelRequired(terms.transhipment)}
        </ContractClauseRow>
        <ContractClauseRow label="Packing Standard:" labelWidth={TERMS_LABEL_WIDTH}>
          {terms.packingTerm || "—"}
        </ContractClauseRow>
        <ContractClauseRow label="Term of Payment:" labelWidth={TERMS_LABEL_WIDTH}>
          {terms.paymentTerm || "—"}
        </ContractClauseRow>
        <ContractClauseRow label="Quality & Quantity Discrepancy and Claim:" labelWidth={TERMS_LABEL_WIDTH}>
          As per standard practice.
        </ContractClauseRow>
        <ContractClauseRow label="Documents:" labelWidth={TERMS_LABEL_WIDTH}>
          {terms.documentRequirement || "—"}
        </ContractClauseRow>
        <ContractClauseRow label="Insurance:" labelWidth={TERMS_LABEL_WIDTH}>
          {terms.insuranceTerm || "—"}
        </ContractClauseRow>
        <ContractClauseRow label="Bank Information:" labelWidth={TERMS_LABEL_WIDTH}>
          {terms.bankInfo || "—"}
        </ContractClauseRow>
        {(terms.remark != null && terms.remark !== "") && (
          <ContractClauseRow label="Remark:" labelWidth={TERMS_LABEL_WIDTH}>
            {terms.remark}
          </ContractClauseRow>
        )}
      </section>

      {/* 7. Signatures */}
      <section className="mt-8 pt-6 border-t-2 border-gray-400 grid grid-cols-2 gap-8">
        <div>
          <p className="text-xs text-gray-600 mb-1">Buyer Signature</p>
          <div className="h-14 border-b border-gray-400" />
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Seller Signature</p>
          <div className="h-14 border-b border-gray-400" />
        </div>
      </section>
    </article>
  );
}
