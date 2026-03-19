"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { calculateWeight, calculateAmount } from "@/lib/numbers";
import type { ContractItemInput } from "@/lib/actions/contracts";
import type { ContractDocumentItem } from "@/components/contracts/contract-document";
import type { Product, ContractType } from "@prisma/client";
import { cn } from "@/lib/utils";

function formatUSD(value?: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatQuantityKg(value?: number | null): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function recalcRow(row: ContractItemInput, product: Product | undefined, contractType: ContractType): { quantityKg: number; amount: number } {
  if (contractType === "RESIN") {
    const quantityKg = Number(row.quantityKg) || 0;
    return { quantityKg, amount: (row.unitPrice ?? 0) * quantityKg };
  }
  const density = product?.density ?? undefined;
  const quantityKg =
    density != null && row.thickness != null && row.width != null && row.length != null
      ? calculateWeight({
          thickness: row.thickness,
          width: row.width,
          length: row.length,
          density,
          rollQty: row.rollQty ?? 0,
        })
      : 0;
  const amount = calculateAmount({
    unitPrice: row.unitPrice ?? 0,
    quantityKg: quantityKg > 0 ? quantityKg : undefined,
  });
  return { quantityKg, amount };
}

const defaultEmptyRow: ContractItemInput = {
  productName: "",
  unitPrice: 0,
  rollQty: 0,
  quantityKg: 0,
  amount: 0,
  sortOrder: 0,
};

const cellBorder = "border border-gray-300";
const cellBorderPrint = "border border-black";
const thClass = "p-1.5 text-sm font-semibold bg-gray-100";
const tdClass = "p-1.5 text-sm";

type PreviewProps = {
  mode: "preview";
  items: ContractDocumentItem[];
  currency: string;
  forPrint?: boolean;
  contractType: ContractType;
};

type EditProps = {
  mode: "edit";
  items: ContractItemInput[];
  onItemsChange: (items: ContractItemInput[]) => void;
  products: Product[];
  currency: string;
  contractType: ContractType;
};

export type ContractItemsTableProps = (PreviewProps | EditProps) & {
  /** When in edit mode, totals are computed inside and passed to renderTotals if needed; document uses these for the totals section. */
  totalRolls?: number;
  totalWeight?: number;
  totalAmount?: number;
};

export function ContractItemsTable(props: ContractItemsTableProps) {
  if (props.mode === "preview") {
    return (
      <ContractItemsTablePreview
        items={props.items}
        forPrint={props.forPrint}
        contractType={props.contractType}
      />
    );
  }
  return (
    <ContractItemsTableEdit
      items={props.items}
      onItemsChange={props.onItemsChange}
      products={props.products}
      currency={props.currency}
      contractType={props.contractType}
    />
  );
}

function ContractItemsTablePreview({
  items,
  forPrint = false,
  contractType,
}: {
  items: ContractDocumentItem[];
  forPrint?: boolean;
  contractType: ContractType;
}) {
  const border = forPrint ? cellBorderPrint : cellBorder;
  if (contractType === "RESIN") {
    return (
      <section className="mb-4 overflow-visible print:overflow-visible">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr>
              <th className={`${border} ${thClass} w-[48px] whitespace-nowrap`}>No.</th>
              <th className={`${border} ${thClass} min-w-[120px] whitespace-nowrap`}>Product Name</th>
              <th className={`${border} ${thClass} w-[78px] whitespace-nowrap`}>Unit price</th>
              <th className={`${border} ${thClass} w-[82px] text-center whitespace-nowrap`}>Quantity</th>
              <th className={`${border} ${thClass} w-[96px] whitespace-nowrap`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className={`${border} ${tdClass}`}>—</td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx}>
                  <td className={`${border} ${tdClass} overflow-hidden min-w-0`}>{idx + 1}</td>
                  <td className={`${border} ${tdClass} overflow-hidden min-w-0 break-words`}>{item.productName || "—"}</td>
                  <td className={`${border} ${tdClass} overflow-hidden min-w-0`}>{formatUSD(item.unitPrice)}</td>
                  <td className={`${border} ${tdClass} overflow-hidden min-w-0`}>{formatQuantityKg(item.quantityKg)}</td>
                  <td className={`${border} ${tdClass} overflow-hidden min-w-0`}>{formatUSD(item.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    );
  }
  return (
    <section className="mb-4 overflow-visible print:overflow-visible">
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr>
            <th className={`${border} ${thClass} w-[48px] whitespace-nowrap`}>No.</th>
            <th className={`${border} ${thClass} min-w-[120px] whitespace-nowrap`}>Product Name</th>
            <th className={`${border} ${thClass} w-[78px] text-center whitespace-nowrap`}>Thickness<br /><span className="whitespace-nowrap">(μm)</span></th>
            <th className={`${border} ${thClass} w-[68px] text-center whitespace-nowrap`}>Width<br />(mm)</th>
            <th className={`${border} ${thClass} w-[60px] text-center whitespace-nowrap`}>Meters<br />(m)</th>
            <th className={`${border} ${thClass} w-[78px] whitespace-nowrap`}>Unit price</th>
            <th className={`${border} ${thClass} w-[60px] whitespace-nowrap`}>Roll Qty</th>
            <th className={`${border} ${thClass} w-[82px] text-center whitespace-nowrap`}>Quantity<br />(kg)</th>
            <th className={`${border} ${thClass} w-[96px] whitespace-nowrap`}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={9} className={`${border} ${tdClass}`}>—</td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <tr key={idx}>
                <td className={`${border} ${tdClass} overflow-hidden min-w-0`}>{idx + 1}</td>
                <td className={`${border} ${tdClass} overflow-hidden min-w-0 break-words`}>{item.productName || "—"}</td>
                <td className={`${border} ${tdClass} overflow-hidden min-w-0`}>{item.thickness ?? "—"}</td>
                <td className={`${border} ${tdClass} overflow-hidden min-w-0`}>{item.width ?? "—"}</td>
                <td className={`${border} ${tdClass} overflow-hidden min-w-0`}>{item.length ?? "—"}</td>
                <td className={`${border} ${tdClass} overflow-hidden min-w-0`}>{formatUSD(item.unitPrice)}</td>
                <td className={`${border} ${tdClass} overflow-hidden min-w-0`}>{item.rollQty ?? "—"}</td>
                <td className={`${border} ${tdClass} overflow-hidden min-w-0`}>{formatQuantityKg(item.quantityKg)}</td>
                <td className={`${border} ${tdClass} overflow-hidden min-w-0`}>{formatUSD(item.amount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}

const inputClass = "h-8 w-full rounded border-0 bg-transparent px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:bg-background";

function ContractItemsTableEdit({
  items,
  onItemsChange,
  products,
  contractType,
}: {
  items: ContractItemInput[];
  onItemsChange: (items: ContractItemInput[]) => void;
  products: Product[];
  currency: string;
  contractType: ContractType;
}) {
  const updateRow = (index: number, field: keyof ContractItemInput, value: string | number) => {
    onItemsChange(
      items.map((r, i) => {
        if (i !== index) return r;
        const next = { ...r, [field]: value };
        const product = next.productId ? products.find((p) => p.id === next.productId) : undefined;
        const { quantityKg, amount } = recalcRow(next, product, contractType);
        return { ...next, quantityKg, amount };
      })
    );
  };

  const addRow = () => {
    onItemsChange([
      ...items,
      { ...defaultEmptyRow, sortOrder: items.length },
    ]);
  };

  const removeRow = (index: number) => {
    if (items.length <= 1) return;
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const onProductSelect = (index: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    onItemsChange(
      items.map((r, i) => {
        if (i !== index) return r;
        const row: ContractItemInput = {
          ...r,
          productId: p.id,
          productName: p.name,
          category: p.category ?? undefined,
          thickness: undefined,
          width: undefined,
          length: undefined,
          unitPrice: p.defaultPrice ?? 0,
          quantityKg: 0,
          rollQty: 0,
          amount: 0,
        };
        const { quantityKg, amount } = recalcRow(row, p, contractType);
        return { ...row, quantityKg, amount };
      })
    );
  };

  if (contractType === "RESIN") {
    return (
      <section className="mb-4 overflow-visible">
        <div className="flex items-center justify-end gap-2 mb-1.5">
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={addRow}>
            添加行
          </Button>
        </div>
        <table className="w-full table-fixed border-collapse text-sm border border-gray-300">
          <thead>
            <tr>
              <th className={`${cellBorder} ${thClass} w-[48px] whitespace-nowrap`}>No.</th>
              <th className={`${cellBorder} ${thClass} min-w-[120px] whitespace-nowrap`}>Product Name</th>
              <th className={`${cellBorder} ${thClass} w-[78px] whitespace-nowrap`}>Unit price</th>
              <th className={`${cellBorder} ${thClass} w-[82px] text-center whitespace-nowrap`}>Quantity</th>
              <th className={`${cellBorder} ${thClass} w-[96px] whitespace-nowrap`}>Amount</th>
              <th className={`${cellBorder} ${thClass} w-10`}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, index) => (
              <tr key={index} className="border-b border-gray-300 last:border-b-0">
                <td className={`${cellBorder} ${tdClass} overflow-hidden min-w-0`}>{index + 1}</td>
                <td className={`${cellBorder} ${tdClass} p-0.5 min-w-0`}>
                  <select
                    className={cn(inputClass, "min-w-0 w-full cursor-pointer border border-transparent hover:border-gray-300 rounded")}
                    value={row.productId ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) onProductSelect(index, v);
                    }}
                  >
                    <option value="">选择或输入产品名称</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <Input
                    className={cn(inputClass, "mt-0.5 min-w-0 w-full")}
                    placeholder="或直接输入"
                    value={row.productName}
                    onChange={(e) => updateRow(index, "productName", e.target.value)}
                  />
                </td>
                <td className={`${cellBorder} ${tdClass} p-0.5 min-w-0`}>
                  <Input
                    type="number"
                    step="0.01"
                    className={cn(inputClass, "text-right")}
                    value={row.unitPrice || ""}
                    onChange={(e) => updateRow(index, "unitPrice", parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className={`${cellBorder} ${tdClass} p-0.5 min-w-0`}>
                  <Input
                    type="number"
                    step="0.01"
                    className={cn(inputClass, "text-right")}
                    value={row.quantityKg ?? ""}
                    onChange={(e) => updateRow(index, "quantityKg", parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className={`${cellBorder} ${tdClass} overflow-hidden min-w-0 text-right tabular-nums`}>
                  {formatUSD(row.amount)}
                </td>
                <td className={`${cellBorder} ${tdClass} p-0.5 w-10`}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(index)}
                    disabled={items.length <= 1}
                  >
                    ×
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    );
  }

  return (
    <section className="mb-4 overflow-visible">
      <div className="flex items-center justify-end gap-2 mb-1.5">
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={addRow}>
          添加行
        </Button>
      </div>
      <table className="w-full table-fixed border-collapse text-sm border border-gray-300">
        <thead>
          <tr>
            <th className={`${cellBorder} ${thClass} w-[48px] whitespace-nowrap`}>No.</th>
            <th className={`${cellBorder} ${thClass} min-w-[120px] whitespace-nowrap`}>Product Name</th>
            <th className={`${cellBorder} ${thClass} w-[78px] text-center whitespace-nowrap`}>Thickness<br /><span className="whitespace-nowrap">(μm)</span></th>
            <th className={`${cellBorder} ${thClass} w-[68px] text-center whitespace-nowrap`}>Width<br />(mm)</th>
            <th className={`${cellBorder} ${thClass} w-[60px] text-center whitespace-nowrap`}>Meters<br />(m)</th>
            <th className={`${cellBorder} ${thClass} w-[78px] whitespace-nowrap`}>Unit price</th>
            <th className={`${cellBorder} ${thClass} w-[60px] whitespace-nowrap`}>Roll Qty</th>
            <th className={`${cellBorder} ${thClass} w-[82px] text-center whitespace-nowrap`}>Quantity<br />(kg)</th>
            <th className={`${cellBorder} ${thClass} w-[96px] whitespace-nowrap`}>Amount</th>
            <th className={`${cellBorder} ${thClass} w-10`}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((row, index) => (
              <tr key={index} className="border-b border-gray-300 last:border-b-0">
                <td className={`${cellBorder} ${tdClass} overflow-hidden min-w-0`}>{index + 1}</td>
                <td className={`${cellBorder} ${tdClass} p-0.5 min-w-0`}>
                  <select
                    className={cn(inputClass, "min-w-0 w-full cursor-pointer border border-transparent hover:border-gray-300 rounded")}
                    value={row.productId ?? products.find((p) => p.name === row.productName)?.id ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) onProductSelect(index, v);
                    }}
                  >
                    <option value="">选择产品名称</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </td>
                <td className={`${cellBorder} ${tdClass} p-0.5 min-w-0`}>
                  <Input
                    className={cn(inputClass, "text-right")}
                    placeholder="μm"
                    value={row.thickness ?? ""}
                    onChange={(e) => updateRow(index, "thickness", e.target.value)}
                  />
                </td>
                <td className={`${cellBorder} ${tdClass} p-0.5 min-w-0`}>
                  <Input
                    className={cn(inputClass, "text-right")}
                    placeholder="mm"
                    value={row.width ?? ""}
                    onChange={(e) => updateRow(index, "width", e.target.value)}
                  />
                </td>
                <td className={`${cellBorder} ${tdClass} p-0.5 min-w-0`}>
                  <Input
                    className={cn(inputClass, "text-right")}
                    placeholder="m"
                    value={row.length ?? ""}
                    onChange={(e) => updateRow(index, "length", e.target.value)}
                  />
                </td>
                <td className={`${cellBorder} ${tdClass} p-0.5 min-w-0`}>
                  <Input
                    type="number"
                    step="0.01"
                    className={cn(inputClass, "text-right")}
                    value={row.unitPrice || ""}
                    onChange={(e) => updateRow(index, "unitPrice", parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className={`${cellBorder} ${tdClass} p-0.5 min-w-0`}>
                  <Input
                    type="number"
                    step="0.01"
                    className={cn(inputClass, "text-right")}
                    value={row.rollQty ?? ""}
                    onChange={(e) => updateRow(index, "rollQty", parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className={`${cellBorder} ${tdClass} overflow-hidden min-w-0 text-right tabular-nums`}>
                  {formatQuantityKg(row.quantityKg)}
                </td>
                <td className={`${cellBorder} ${tdClass} overflow-hidden min-w-0 text-right tabular-nums`}>
                  {formatUSD(row.amount)}
                </td>
                <td className={`${cellBorder} ${tdClass} p-0.5 w-10`}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(index)}
                    disabled={items.length <= 1}
                  >
                    ×
                  </Button>
                </td>
              </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
