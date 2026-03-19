"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CommercialInvoiceFormData, CommercialInvoiceItemInput } from "@/lib/actions/commercial-invoices";
import { cn } from "@/lib/utils";

const inputClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

type Props = {
  commercialInvoiceId: string;
  contractNo: string;
  defaultValues: {
    invoiceDate: string;
    buyerName: string;
    buyerAddress: string;
    paymentTerm: string;
    paymentMethod?: string | null;
    depositRatio?: number | null;
    depositAmount?: number | null;
    balanceAmount?: number | null;
    lcNo: string;
    tradeTerm: string;
    packingTerm: string;
    fromPort: string;
    destinationPort: string;
    vesselVoyageNo: string;
    departureDate: string;
    depositDeduction: number;
    shippingMarks: string;
    currency: string;
    remark: string;
    items: Array<{
      productName: string;
      specification: string;
      contractQuantityKg: number;
      actualQuantityKg: number;
      contractRollQty: number;
      actualRollQty: number;
      unitPrice: number;
      amount: number;
      hsCode?: string;
      remark?: string;
      sortOrder: number;
    }>;
  };
  updateCommercialInvoice: (id: string, data: CommercialInvoiceFormData) => Promise<unknown>;
};

export function CommercialInvoiceEditForm({
  commercialInvoiceId,
  contractNo,
  defaultValues,
  updateCommercialInvoice,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState(defaultValues.items);
  const [header, setHeader] = React.useState({
    invoiceDate: defaultValues.invoiceDate,
    buyerName: defaultValues.buyerName,
    buyerAddress: defaultValues.buyerAddress,
    paymentTerm: defaultValues.paymentTerm,
    lcNo: defaultValues.lcNo ?? "",
    tradeTerm: defaultValues.tradeTerm,
    packingTerm: defaultValues.packingTerm,
    fromPort: defaultValues.fromPort,
    destinationPort: defaultValues.destinationPort,
    vesselVoyageNo: defaultValues.vesselVoyageNo,
    departureDate: defaultValues.departureDate,
    depositDeduction: defaultValues.depositDeduction,
    shippingMarks: defaultValues.shippingMarks,
    currency: defaultValues.currency,
    remark: defaultValues.remark,
  });

  const updateItem = (index: number, field: keyof CommercialInvoiceItemInput, value: string | number) => {
    setItems((prev) => {
      const next = prev.map((row, i) => (i !== index ? row : { ...row, [field]: value }));
      const row = next[index] as (typeof next)[number];
      if (field === "actualQuantityKg" || field === "unitPrice") {
        const qty = field === "actualQuantityKg" ? (value as number) : row.actualQuantityKg;
        const price = field === "unitPrice" ? (value as number) : row.unitPrice;
        next[index] = { ...row, [field]: value, amount: Math.round(qty * price * 100) / 100 };
      }
      return next;
    });
  };

  const totalAmount = Math.round(items.reduce((s, i) => s + i.amount, 0) * 100) / 100;
  const rawPm = defaultValues.paymentMethod ?? null;
  const pm = rawPm === "L/C" ? "LC" : rawPm === "T/T" ? "TT" : rawPm;
  const depositRatio = defaultValues.depositRatio ?? null;
  const isTT = pm === "TT" && depositRatio != null;
  const depositAmount = isTT ? Math.round(totalAmount * (depositRatio / 100) * 100) / 100 : null;
  const balanceAmount = isTT ? Math.round((totalAmount - (depositAmount ?? 0)) * 100) / 100 : totalAmount;

  function formatAmount(value: number): string {
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
  function formatWithCurrency(value: number): string {
    const sym = header.currency === "USD" ? "$" : header.currency === "EUR" ? "€" : "¥";
    return `${sym} ${formatAmount(value)}`;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data: CommercialInvoiceFormData = {
      invoiceDate: header.invoiceDate,
      buyerName: header.buyerName || undefined,
      buyerAddress: header.buyerAddress || undefined,
      paymentTerm: header.paymentTerm || undefined,
      paymentMethod: pm ?? undefined,
      depositRatio: depositRatio ?? undefined,
      lcNo: header.lcNo || undefined,
      tradeTerm: header.tradeTerm || undefined,
      packingTerm: header.packingTerm || undefined,
      fromPort: header.fromPort || undefined,
      destinationPort: header.destinationPort || undefined,
      vesselVoyageNo: header.vesselVoyageNo || undefined,
      departureDate: header.departureDate || undefined,
      depositDeduction: depositAmount ?? 0,
      shippingMarks: header.shippingMarks || undefined,
      currency: header.currency,
      remark: header.remark || undefined,
      items: items.map((row, idx) => ({
        productName: row.productName,
        specification: row.specification || undefined,
        contractQuantityKg: row.contractQuantityKg,
        actualQuantityKg: row.actualQuantityKg,
        contractRollQty: row.contractRollQty,
        actualRollQty: row.actualRollQty,
        unitPrice: row.unitPrice,
        amount: row.amount,
        hsCode: row.hsCode || undefined,
        remark: row.remark || undefined,
        sortOrder: idx,
      })),
    };
    setSubmitError(null);
    startTransition(async () => {
      try {
        await updateCommercialInvoice(commercialInvoiceId, data);
        router.push(`/commercial-invoices/${commercialInvoiceId}`);
        router.refresh();
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "保存失败");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {submitError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {submitError}
        </div>
      )}
      <div className="rounded-md border p-4 space-y-4">
        <h3 className="font-medium">合同信息</h3>
        <p className="text-sm text-muted-foreground">合同编号：{contractNo}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>发票日期</Label>
          <Input
            type="date"
            value={header.invoiceDate}
            onChange={(e) => setHeader((h) => ({ ...h, invoiceDate: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label>币种</Label>
          <select
            className={inputClass}
            value={header.currency}
            onChange={(e) => setHeader((h) => ({ ...h, currency: e.target.value }))}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="CNY">CNY</option>
          </select>
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label>买方 / Buyer</Label>
          <Input
            value={header.buyerName}
            onChange={(e) => setHeader((h) => ({ ...h, buyerName: e.target.value }))}
            placeholder="Buyer Name"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label>地址 / Address</Label>
          <Textarea
            value={header.buyerAddress}
            onChange={(e) => setHeader((h) => ({ ...h, buyerAddress: e.target.value }))}
            placeholder="Address"
            rows={2}
            className={cn(inputClass, "min-h-20")}
          />
        </div>
        {pm && (
          <div className="space-y-2 sm:col-span-2">
            <Label>付款方式 (Payment Method)</Label>
            <p className="text-sm font-medium text-muted-foreground">
              {pm === "TT" ? "T/T" : pm === "LC" ? "L/C" : pm}
            </p>
          </div>
        )}
        {isTT && (
          <>
            <div className="space-y-2">
              <Label>订金比例 (Deposit Ratio)</Label>
              <p className="text-sm font-medium text-muted-foreground">{depositRatio}%</p>
            </div>
            <div className="space-y-2">
              <Label>订金金额 (Deposit Amount)</Label>
              <p className="text-sm font-medium">{formatWithCurrency(depositAmount ?? 0)}</p>
            </div>
            <div className="space-y-2">
              <Label>尾款金额 (Balance Amount)</Label>
              <p className="text-sm font-medium">{formatWithCurrency(balanceAmount)}</p>
            </div>
          </>
        )}
        {pm === "LC" && (
          <div className="space-y-2">
            <Label htmlFor="ci-lcNo">L/C No. <span className="text-destructive">*</span></Label>
            <Input
              id="ci-lcNo"
              value={header.lcNo}
              onChange={(e) => setHeader((h) => ({ ...h, lcNo: e.target.value }))}
              placeholder="L/C 编号（必填）"
              className={inputClass}
              required
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>付款条款</Label>
          <Input
            value={header.paymentTerm}
            onChange={(e) => setHeader((h) => ({ ...h, paymentTerm: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label>贸易条款</Label>
          <Input
            value={header.tradeTerm}
            onChange={(e) => setHeader((h) => ({ ...h, tradeTerm: e.target.value }))}
            placeholder="e.g. CIF, FOB"
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label>装运港</Label>
          <Input
            value={header.fromPort}
            onChange={(e) => setHeader((h) => ({ ...h, fromPort: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label>目的港</Label>
          <Input
            value={header.destinationPort}
            onChange={(e) => setHeader((h) => ({ ...h, destinationPort: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label>船名/航次</Label>
          <Input
            value={header.vesselVoyageNo}
            onChange={(e) => setHeader((h) => ({ ...h, vesselVoyageNo: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label>离港日期</Label>
          <Input
            type="date"
            value={header.departureDate}
            onChange={(e) => setHeader((h) => ({ ...h, departureDate: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label>唛头 Shipping Marks</Label>
          <Input
            value={header.shippingMarks}
            onChange={(e) => setHeader((h) => ({ ...h, shippingMarks: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label>备注</Label>
          <Textarea
            value={header.remark}
            onChange={(e) => setHeader((h) => ({ ...h, remark: e.target.value }))}
            rows={2}
            className={cn(inputClass, "min-h-20")}
          />
        </div>
      </div>

      <div>
        <Label className="text-base font-medium">明细（合同值为快照只读，实际值可编辑 → 金额=实际重量×单价）</Label>
        <div className="mt-2 border rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2">产品名称</th>
                <th className="text-left p-2">规格</th>
                <th className="text-left p-2">重量(kg)<br /><span className="text-muted-foreground font-normal">合同 / 实际</span></th>
                <th className="text-left p-2">卷数<br /><span className="text-muted-foreground font-normal">合同 / 实际</span></th>
                <th className="text-left p-2">单价</th>
                <th className="text-left p-2">金额</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-1">
                    <Input
                      className="h-9 min-w-[120px]"
                      value={row.productName}
                      onChange={(e) => updateItem(idx, "productName", e.target.value)}
                    />
                  </td>
                  <td className="p-1">
                    <span className="text-muted-foreground text-xs">{row.specification || "—"}</span>
                  </td>
                  <td className="p-1">
                    <span className="inline-block w-14 text-muted-foreground text-right bg-muted/50 px-2 py-1.5 rounded mr-1" title="合同">{row.contractQuantityKg}</span>
                    <Input
                      type="number"
                      step="0.01"
                      className="h-9 w-20 inline-flex"
                      value={row.actualQuantityKg ?? ""}
                      onChange={(e) => updateItem(idx, "actualQuantityKg", parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-1">
                    <span className="inline-block w-12 text-muted-foreground text-right bg-muted/50 px-2 py-1.5 rounded mr-1" title="合同">{row.contractRollQty}</span>
                    <Input
                      type="number"
                      step="0.01"
                      className="h-9 w-20 inline-flex"
                      value={row.actualRollQty ?? ""}
                      onChange={(e) => updateItem(idx, "actualRollQty", parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      type="number"
                      step="0.01"
                      className="h-9 w-24"
                      value={row.unitPrice ?? ""}
                      onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-1 align-middle">{row.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          总金额：{formatWithCurrency(totalAmount)}
          {isTT && (
            <> | 订金：{formatWithCurrency(depositAmount ?? 0)} | 尾款：{formatWithCurrency(balanceAmount)}</>
          )}
          {!isTT && <> | 应收：{formatWithCurrency(balanceAmount)}</>}
        </p>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "保存中…" : "保存"}
      </Button>
    </form>
  );
}
