"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addResinOrderPayment } from "@/lib/actions/resin-orders";
import { useRouter } from "next/navigation";

export function ResinOrderPaymentForm({ resinOrderId }: { resinOrderId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [remarks, setRemarks] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setError(null);
      try {
        await addResinOrderPayment(resinOrderId, {
          paymentDate,
          amount: Number(amount) || 0,
          method: method || undefined,
          referenceNo: referenceNo || undefined,
          remarks: remarks || undefined,
        });
        setAmount("");
        setMethod("");
        setReferenceNo("");
        setRemarks("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "录入收款失败");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>收款日期</Label>
          <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>收款金额</Label>
          <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
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
        <Button type="submit" disabled={isPending}>{isPending ? "保存中..." : "录入收款"}</Button>
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
    </form>
  );
}
