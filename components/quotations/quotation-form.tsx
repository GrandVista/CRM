"use client";

import React, { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { calculateWeight, calculateAmount } from "@/lib/numbers";
import type { QuotationFormData, QuotationItemInput } from "@/lib/actions/quotations";
import type { Customer } from "@prisma/client";
import type { Product } from "@prisma/client";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Props = {
  customers: Customer[];
  products: Product[];
  defaultValues?: Partial<QuotationFormData> & { id?: string };
  onSubmit: (data: QuotationFormData) => Promise<void>;
  submitLabel?: string;
};

function recalcRow(
  row: QuotationItemInput,
  product: Product | undefined
): { quantityKg: number; amount: number } {
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

export function QuotationForm({
  customers,
  products,
  defaultValues,
  onSubmit,
  submitLabel = "保存",
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = React.useState<QuotationItemInput[]>(
    defaultValues?.items?.length
      ? defaultValues.items
      : [
          {
            productName: "",
            unitPrice: 0,
            rollQty: 0,
            quantityKg: 0,
            amount: 0,
            sortOrder: 0,
          },
        ]
  );

  function addRow() {
    setItems((prev) => [
      ...prev,
      {
        productName: "",
        unitPrice: 0,
        rollQty: 0,
        quantityKg: 0,
        amount: 0,
        sortOrder: prev.length,
      },
    ]);
  }

  function removeRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof QuotationItemInput, value: string | number) {
    setItems((prev) => {
      const next = prev.map((r, i) => (i === index ? { ...r, [field]: value } : r));
      const row = next[index];
      const product = row.productId ? products.find((p) => p.id === row.productId) : undefined;
      const { quantityKg, amount } = recalcRow(row, product);
      next[index] = { ...row, quantityKg, amount };
      return next;
    });
  }

  function onProductSelect(index: number, productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setItems((prev) => {
      const next = [...prev];
      const row = {
        ...next[index],
        productId: p.id,
        productName: p.name,
        category: p.category ?? undefined,
        thickness: undefined,
        width: undefined,
        length: undefined,
        unitPrice: p.defaultPrice ?? 0,
        rollQty: 0,
        quantityKg: 0,
        amount: 0,
      };
      const { quantityKg, amount } = recalcRow(row, p);
      next[index] = { ...row, quantityKg, amount };
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data: QuotationFormData = {
      customerId: (form.elements.namedItem("customerId") as HTMLSelectElement).value,
      quotationDate: (form.elements.namedItem("quotationDate") as HTMLInputElement).value,
      validUntil: (form.elements.namedItem("validUntil") as HTMLInputElement).value || undefined,
      currency: (form.elements.namedItem("currency") as HTMLSelectElement).value || "USD",
      paymentTerm: (form.elements.namedItem("paymentTerm") as HTMLInputElement).value || undefined,
      incoterm: (form.elements.namedItem("incoterm") as HTMLInputElement).value || undefined,
      remark: (form.elements.namedItem("remark") as HTMLTextAreaElement).value || undefined,
      status: (form.elements.namedItem("status") as HTMLSelectElement).value as QuotationFormData["status"],
      items: items.map((row, idx) => {
        const product = row.productId ? products.find((p) => p.id === row.productId) : undefined;
        const { quantityKg, amount } = recalcRow(row, product);
        return {
          ...row,
          sortOrder: idx,
          quantityKg,
          amount,
        };
      }),
    };
    startTransition(() => onSubmit(data));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customerId">客户 *</Label>
          <select
            id="customerId"
            name="customerId"
            required
            defaultValue={defaultValues?.customerId}
            className={cn(inputClass)}
          >
            <option value="">请选择客户</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortName || c.nameEn || c.nameCn || c.customerCode}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quotationDate">报价日期 *</Label>
          <Input
            id="quotationDate"
            name="quotationDate"
            type="date"
            required
            defaultValue={defaultValues?.quotationDate?.toString().slice(0, 10)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="validUntil">有效期至</Label>
          <Input
            id="validUntil"
            name="validUntil"
            type="date"
            defaultValue={defaultValues?.validUntil?.toString().slice(0, 10)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">币种</Label>
          <select
            id="currency"
            name="currency"
            defaultValue={defaultValues?.currency ?? "USD"}
            className={cn(inputClass)}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="CNY">CNY</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentTerm">付款条款</Label>
          <Input id="paymentTerm" name="paymentTerm" defaultValue={defaultValues?.paymentTerm} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="incoterm">贸易条款</Label>
          <Input id="incoterm" name="incoterm" defaultValue={defaultValues?.incoterm} placeholder="CIF, FOB..." />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="status">状态</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaultValues?.status ?? "DRAFT"}
            className={cn(inputClass)}
          >
            <option value="DRAFT">草稿</option>
            <option value="SENT">已发送</option>
            <option value="ACCEPTED">已接受</option>
            <option value="EXPIRED">已过期</option>
            <option value="CANCELLED">已取消</option>
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="remark">备注</Label>
          <Textarea id="remark" name="remark" rows={2} defaultValue={defaultValues?.remark} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>明细（厚度μm / 宽度mm / 长度m，填规格后自动算重量与金额）</Label>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            添加行
          </Button>
        </div>
        <div className="border rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2">产品</th>
                <th className="text-left p-2">名称</th>
                <th className="text-left p-2">厚度</th>
                <th className="text-left p-2">宽度</th>
                <th className="text-left p-2">长度</th>
                <th className="text-left p-2">单价</th>
                <th className="text-left p-2">卷数</th>
                <th className="text-left p-2">数量(kg)</th>
                <th className="text-left p-2">金额</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, index) => (
                <tr key={index} className="border-b">
                  <td className="p-1">
                    <select
                      className={cn(inputClass, "min-w-[120px]")}
                      value={row.productId ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v) onProductSelect(index, v);
                      }}
                    >
                      <option value="">选择产品</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.productCode} - {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1">
                    <Input
                      className="h-9 min-w-[100px]"
                      value={row.productName}
                      onChange={(e) => updateRow(index, "productName", e.target.value)}
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      className="h-9 w-16"
                      placeholder="μm"
                      value={row.thickness ?? ""}
                      onChange={(e) => updateRow(index, "thickness", e.target.value)}
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      className="h-9 w-16"
                      placeholder="mm"
                      value={row.width ?? ""}
                      onChange={(e) => updateRow(index, "width", e.target.value)}
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      className="h-9 w-16"
                      placeholder="m"
                      value={row.length ?? ""}
                      onChange={(e) => updateRow(index, "length", e.target.value)}
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      type="number"
                      step="0.01"
                      className="h-9 w-20"
                      value={row.unitPrice || ""}
                      onChange={(e) => updateRow(index, "unitPrice", parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      type="number"
                      step="0.01"
                      className="h-9 w-16"
                      value={row.rollQty || ""}
                      onChange={(e) => updateRow(index, "rollQty", parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      type="number"
                      step="0.01"
                      className="h-9 w-20"
                      readOnly
                      value={row.quantityKg || ""}
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      type="number"
                      step="0.01"
                      className="h-9 w-24"
                      readOnly
                      value={row.amount || ""}
                    />
                  </td>
                  <td className="p-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
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
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "保存中..." : submitLabel}
      </Button>
    </form>
  );
}
