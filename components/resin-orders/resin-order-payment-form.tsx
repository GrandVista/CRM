"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addResinOrderPayment } from "@/lib/actions/resin-orders";
import { useRouter } from "next/navigation";

export type ResinPaymentPoOption = { id: string; customerPoNo: string };

export function ResinOrderPaymentForm({
  resinOrderId,
  purchaseOrderOptions,
}: {
  resinOrderId: string;
  purchaseOrderOptions: ResinPaymentPoOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [legacyAmount, setLegacyAmount] = useState("");
  const [lines, setLines] = useState<{ purchaseOrderId: string; amount: string }[]>([
    { purchaseOrderId: purchaseOrderOptions[0]?.id ?? "", amount: "" },
  ]);
  const [method, setMethod] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [remarks, setRemarks] = useState("");

  const hasPo = purchaseOrderOptions.length > 0;

  function addLine() {
    setLines((prev) => [...prev, { purchaseOrderId: purchaseOrderOptions[0]?.id ?? "", amount: "" }]);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setError(null);
      try {
        if (hasPo) {
          const items = lines
            .filter((l) => l.purchaseOrderId && Number(l.amount) > 0)
            .map((l) => ({ purchaseOrderId: l.purchaseOrderId, amount: Number(l.amount) }));
          if (items.length === 0) {
            setError("请至少选择一个小订单并填写分摊金额");
            return;
          }
          await addResinOrderPayment(resinOrderId, {
            paymentDate,
            items,
            method: method || undefined,
            referenceNo: referenceNo || undefined,
            remarks: remarks || undefined,
          });
          setLines([{ purchaseOrderId: purchaseOrderOptions[0]?.id ?? "", amount: "" }]);
        } else {
          await addResinOrderPayment(resinOrderId, {
            paymentDate,
            legacyAmount: Number(legacyAmount) || 0,
            method: method || undefined,
            referenceNo: referenceNo || undefined,
            remarks: remarks || undefined,
          });
          setLegacyAmount("");
        }
        setMethod("");
        setReferenceNo("");
        setRemarks("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "录入收款失败");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {hasPo ? (
        <div className="space-y-2 rounded-md border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-base">收款分摊（按小订单）</Label>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              增加一行
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">本收款单总金额 = 各行分摊金额之和。</p>
          {lines.map((line, idx: number) => (
            <div key={idx} className="flex flex-wrap items-end gap-2">
              <div className="space-y-1 min-w-[12rem] flex-1">
                <Label className="text-xs">采购单号</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={line.purchaseOrderId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLines((prev) => prev.map((row, i) => (i === idx ? { ...row, purchaseOrderId: v } : row)));
                  }}
                >
                  <option value="">选择</option>
                  {purchaseOrderOptions.map((po: ResinPaymentPoOption) => (
                    <option key={po.id} value={po.id}>
                      {po.customerPoNo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 w-32">
                <Label className="text-xs">金额</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={line.amount}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLines((prev) => prev.map((row, i) => (i === idx ? { ...row, amount: v } : row)));
                  }}
                />
              </div>
              {lines.length > 1 ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(idx)}>
                  删除行
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
          尚未添加小订单时，按<strong>旧模式</strong>录入收款总金额。
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>收款日期</Label>
          <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
        </div>
        {!hasPo ? (
          <div className="space-y-1">
            <Label>收款金额</Label>
            <Input type="number" step="0.01" value={legacyAmount} onChange={(e) => setLegacyAmount(e.target.value)} required />
          </div>
        ) : null}
        <div className="space-y-1">
          <Label>收款方式</Label>
          <Input value={method} onChange={(e) => setMethod(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>参考号/流水号</Label>
          <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>备注</Label>
        <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : "录入收款"}
        </Button>
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
    </form>
  );
}
