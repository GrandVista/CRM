"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PackingListFormData, PackingListItemInput } from "@/lib/actions/packing-lists";
import { cn } from "@/lib/utils";

const inputClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

type Props = {
  packingListId: string;
  contractNo: string;
  defaultValues: PackingListFormData & { items: Array<Record<string, unknown>> };
  updatePackingList: (id: string, data: PackingListFormData) => Promise<unknown>;
};

export function PackingListEditForm({
  packingListId,
  contractNo,
  defaultValues,
  updatePackingList,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = React.useState(defaultValues.items as PackingListItemInput[]);
  const [header, setHeader] = React.useState({
    documentDate: defaultValues.documentDate ?? "",
    invoiceNo: defaultValues.invoiceNo ?? "",
    buyerName: defaultValues.buyerName ?? "",
    buyerAddress: defaultValues.buyerAddress ?? "",
    paymentTerm: defaultValues.paymentTerm ?? "",
    lcNo: (defaultValues as { lcNo?: string }).lcNo ?? "",
    tradeTerm: defaultValues.tradeTerm ?? "",
    packingTerm: defaultValues.packingTerm ?? "",
    fromPort: defaultValues.fromPort ?? "",
    destinationPort: defaultValues.destinationPort ?? "",
    vesselVoyageNo: defaultValues.vesselVoyageNo ?? "",
    departureDate: defaultValues.departureDate ?? "",
    containerNo: defaultValues.containerNo ?? "",
    sealNo: defaultValues.sealNo ?? "",
    totalPallets: defaultValues.totalPallets ?? undefined as number | undefined,
    totalGrossWeight: defaultValues.totalGrossWeight ?? undefined as number | undefined,
    totalCbm: defaultValues.totalCbm ?? undefined as number | undefined,
    shippingMarks: defaultValues.shippingMarks ?? "",
    remark: defaultValues.remark ?? "",
  });

  const updateItem = (index: number, field: keyof PackingListItemInput, value: string | number | undefined) => {
    setItems((prev) => prev.map((row, i) => (i !== index ? row : { ...row, [field]: value })));
  };

  const totalRolls = items.reduce((s, i) => s + i.actualRollQty, 0);
  const totalNetWeight = items.reduce((s, i) => s + i.actualNetWeightKg, 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data: PackingListFormData = {
      ...header,
      lcNo: header.lcNo || undefined,
      totalRolls,
      totalNetWeight,
      items: items.map((row, idx) => ({
        productName: row.productName,
        specification: row.specification || undefined,
        contractNetWeightKg: row.contractNetWeightKg,
        actualNetWeightKg: row.actualNetWeightKg,
        contractRollQty: row.contractRollQty,
        actualRollQty: row.actualRollQty,
        palletQty: row.palletQty,
        grossWeightKg: row.grossWeightKg,
        cbm: row.cbm,
        remark: row.remark || undefined,
        sortOrder: idx,
      })),
    };
    startTransition(async () => {
      await updatePackingList(packingListId, data);
      router.push(`/cl/${packingListId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="rounded-md border p-4">
        <p className="text-sm text-muted-foreground">合同编号：{contractNo}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>单据日期</Label>
          <Input type="date" value={header.documentDate} onChange={(e) => setHeader((h) => ({ ...h, documentDate: e.target.value }))} className={inputClass} />
        </div>
        <div className="space-y-2">
          <Label>发票号</Label>
          <Input value={header.invoiceNo} onChange={(e) => setHeader((h) => ({ ...h, invoiceNo: e.target.value }))} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <Label>买方</Label>
          <Input value={header.buyerName} onChange={(e) => setHeader((h) => ({ ...h, buyerName: e.target.value }))} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <Label>地址</Label>
          <Textarea value={header.buyerAddress} onChange={(e) => setHeader((h) => ({ ...h, buyerAddress: e.target.value }))} rows={2} className={cn(inputClass, "min-h-20")} />
        </div>
        <div><Label>付款条款</Label><Input value={header.paymentTerm} onChange={(e) => setHeader((h) => ({ ...h, paymentTerm: e.target.value }))} placeholder="Payment" className={inputClass} /></div>
        {(defaultValues as { paymentMethod?: string | null }).paymentMethod === "LC" && (
          <div><Label>L/C No.</Label><Input value={header.lcNo} onChange={(e) => setHeader((h) => ({ ...h, lcNo: e.target.value }))} placeholder="L/C 编号" className={inputClass} /></div>
        )}
        <div><Label>贸易条款</Label><Input value={header.tradeTerm} onChange={(e) => setHeader((h) => ({ ...h, tradeTerm: e.target.value }))} placeholder="Trade (CIF/FOB)" className={inputClass} /></div>
        <div><Label>包装条款</Label><Input value={header.packingTerm} onChange={(e) => setHeader((h) => ({ ...h, packingTerm: e.target.value }))} placeholder="Packing" className={inputClass} /></div>
        <div><Label>装运港</Label><Input value={header.fromPort} onChange={(e) => setHeader((h) => ({ ...h, fromPort: e.target.value }))} className={inputClass} /></div>
        <div><Label>目的港</Label><Input value={header.destinationPort} onChange={(e) => setHeader((h) => ({ ...h, destinationPort: e.target.value }))} className={inputClass} /></div>
        <div><Label>船名/航次</Label><Input value={header.vesselVoyageNo} onChange={(e) => setHeader((h) => ({ ...h, vesselVoyageNo: e.target.value }))} className={inputClass} /></div>
        <div><Label>离港日期</Label><Input type="date" value={header.departureDate} onChange={(e) => setHeader((h) => ({ ...h, departureDate: e.target.value }))} className={inputClass} /></div>
        <div><Label>柜号</Label><Input value={header.containerNo} onChange={(e) => setHeader((h) => ({ ...h, containerNo: e.target.value }))} className={inputClass} /></div>
        <div><Label>封号</Label><Input value={header.sealNo} onChange={(e) => setHeader((h) => ({ ...h, sealNo: e.target.value }))} className={inputClass} /></div>
        <div><Label>总托盘数</Label><Input type="number" value={header.totalPallets ?? ""} onChange={(e) => setHeader((h) => ({ ...h, totalPallets: e.target.value ? parseInt(e.target.value, 10) : undefined }))} className={inputClass} /></div>
        <div><Label>总毛重(kg)</Label><Input type="number" step="0.01" value={header.totalGrossWeight ?? ""} onChange={(e) => setHeader((h) => ({ ...h, totalGrossWeight: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputClass} /></div>
        <div><Label>总体积(CBM)</Label><Input type="number" step="0.01" value={header.totalCbm ?? ""} onChange={(e) => setHeader((h) => ({ ...h, totalCbm: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputClass} /></div>
        <div className="sm:col-span-2"><Label>唛头</Label><Input value={header.shippingMarks} onChange={(e) => setHeader((h) => ({ ...h, shippingMarks: e.target.value }))} className={inputClass} /></div>
        <div className="sm:col-span-2"><Label>备注</Label><Textarea value={header.remark} onChange={(e) => setHeader((h) => ({ ...h, remark: e.target.value }))} rows={2} className={cn(inputClass, "min-h-20")} /></div>
      </div>

      <div>
        <Label className="text-base font-medium">明细（合同值为快照只读，实际值可编辑）</Label>
        <div className="mt-2 border rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2">产品名称</th>
                <th className="text-left p-2">规格</th>
                <th className="text-left p-2">卷数<br /><span className="text-muted-foreground font-normal">合同 / 实际</span></th>
                <th className="text-left p-2">净重(kg)<br /><span className="text-muted-foreground font-normal">合同 / 实际</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-1"><Input className="h-9 min-w-[100px]" value={row.productName} onChange={(e) => updateItem(idx, "productName", e.target.value)} /></td>
                  <td className="p-1"><span className="text-muted-foreground text-xs">{row.specification || "—"}</span></td>
                  <td className="p-1">
                    <span className="inline-block w-12 text-muted-foreground text-right bg-muted/50 px-2 py-1.5 rounded mr-1" title="合同">{row.contractRollQty}</span>
                    <Input type="number" step="0.01" className="h-9 w-20 inline-flex" value={row.actualRollQty ?? ""} onChange={(e) => updateItem(idx, "actualRollQty", parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="p-1">
                    <span className="inline-block w-14 text-muted-foreground text-right bg-muted/50 px-2 py-1.5 rounded mr-1" title="合同">{row.contractNetWeightKg}</span>
                    <Input type="number" step="0.01" className="h-9 w-20 inline-flex" value={row.actualNetWeightKg ?? ""} onChange={(e) => updateItem(idx, "actualNetWeightKg", parseFloat(e.target.value) || 0)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">汇总：总卷数 {totalRolls.toFixed(2)} | 总净重(kg) {totalNetWeight.toFixed(2)}</p>
      </div>

      <Button type="submit" disabled={isPending}>{isPending ? "保存中…" : "保存"}</Button>
    </form>
  );
}
