"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addResinOrderShipment } from "@/lib/actions/resin-orders";
import { useRouter } from "next/navigation";
import { ResinShipmentPersonInput } from "@/components/resin-orders/resin-shipment-person-input";
import {
  RESIN_SHIPMENT_DEFAULT_INVOICERS,
  RESIN_SHIPMENT_DEFAULT_REVIEWERS,
  RESIN_SHIPMENT_DEFAULT_SHIPPERS,
} from "@/lib/constants/resin-shipment-signoff-defaults";
import { authFetch } from "@/lib/api-client";
import {
  mergePersonDatalistOptions,
  type ResinShipmentLastPersonDefaults,
} from "@/lib/resin-shipment-last-defaults";

export type ResinShipmentPoOption = { id: string; customerPoNo: string };

export function ResinOrderShipmentForm({
  resinOrderId,
  purchaseOrderOptions,
}: {
  resinOrderId: string;
  purchaseOrderOptions: ResinShipmentPoOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [shipmentDate, setShipmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [legacyQuantity, setLegacyQuantity] = useState("");
  const [lines, setLines] = useState<{ purchaseOrderId: string; quantity: string }[]>([
    { purchaseOrderId: purchaseOrderOptions[0]?.id ?? "", quantity: "" },
  ]);
  const [vehicleNo, setVehicleNo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [remarks, setRemarks] = useState("");
  const [shipper, setShipper] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [invoicer, setInvoicer] = useState("");
  const [lastSnapshot, setLastSnapshot] = useState<ResinShipmentLastPersonDefaults | null>(null);

  const hasPo = purchaseOrderOptions.length > 0;

  const applyDefaultsFromResponse = useCallback((data: ResinShipmentLastPersonDefaults) => {
    setLastSnapshot(data);
    if (data.shipper?.trim()) setShipper(data.shipper.trim());
    if (data.reviewer?.trim()) setReviewer(data.reviewer.trim());
    if (data.invoicer?.trim()) setInvoicer(data.invoicer.trim());
  }, []);

  const loadLastPersonDefaults = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const res = await authFetch("/api/resin-orders/shipments/last-defaults", { signal });
        if (signal?.aborted || !res.ok) return;
        const data = (await res.json()) as ResinShipmentLastPersonDefaults;
        if (signal?.aborted) return;
        applyDefaultsFromResponse(data);
      } catch {
        if (signal?.aborted) return;
      }
    },
    [applyDefaultsFromResponse],
  );

  useEffect(() => {
    const ac = new AbortController();
    void loadLastPersonDefaults(ac.signal);
    return () => ac.abort();
  }, [loadLastPersonDefaults]);

  function addLine() {
    setLines((prev) => [...prev, { purchaseOrderId: purchaseOrderOptions[0]?.id ?? "", quantity: "" }]);
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
            .filter((l) => l.purchaseOrderId && Number(l.quantity) > 0)
            .map((l) => ({ purchaseOrderId: l.purchaseOrderId, quantity: Number(l.quantity) }));
          await addResinOrderShipment(resinOrderId, {
            shipmentDate,
            items,
            vehicleNo: vehicleNo || undefined,
            driverName: driverName || undefined,
            driverPhone: driverPhone || undefined,
            remarks: remarks || undefined,
            shipper: shipper || undefined,
            reviewer: reviewer || undefined,
            invoicer: invoicer || undefined,
          });
          setLines([{ purchaseOrderId: purchaseOrderOptions[0]?.id ?? "", quantity: "" }]);
        } else {
          await addResinOrderShipment(resinOrderId, {
            shipmentDate,
            legacyQuantity: Number(legacyQuantity) || 0,
            vehicleNo: vehicleNo || undefined,
            driverName: driverName || undefined,
            driverPhone: driverPhone || undefined,
            remarks: remarks || undefined,
            shipper: shipper || undefined,
            reviewer: reviewer || undefined,
            invoicer: invoicer || undefined,
          });
          setLegacyQuantity("");
        }
        setVehicleNo("");
        setDriverName("");
        setDriverPhone("");
        setRemarks("");
        await loadLastPersonDefaults();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "新增发货失败");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {hasPo ? (
        <div className="space-y-2 rounded-md border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-base">送货明细（按小订单）</Label>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              增加一行
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            同一送货单可勾选多个客户采购单号，并分别填写本次发货数量。本单总数量 = 各行之和。
          </p>
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
                  {purchaseOrderOptions.map((po: ResinShipmentPoOption) => (
                    <option key={po.id} value={po.id}>
                      {po.customerPoNo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 w-28">
                <Label className="text-xs">数量</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={line.quantity}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLines((prev) => prev.map((row, i) => (i === idx ? { ...row, quantity: v } : row)));
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
          当前尚未添加小订单，将按<strong>旧模式</strong>仅录入总发货数量。添加小订单后，发货将按采购单号分摊。
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>发货日期</Label>
          <Input type="date" value={shipmentDate} onChange={(e) => setShipmentDate(e.target.value)} required />
        </div>
        {!hasPo ? (
          <div className="space-y-1">
            <Label>发货数量</Label>
            <Input
              type="number"
              step="0.01"
              value={legacyQuantity}
              onChange={(e) => setLegacyQuantity(e.target.value)}
              required
            />
          </div>
        ) : null}
        <div className="space-y-1">
          <Label>车牌号</Label>
          <Input value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>司机姓名</Label>
          <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>司机电话</Label>
          <Input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} />
        </div>
        <div className="space-y-1 sm:col-span-3">
          <ResinShipmentPersonInput
            label="发货人"
            fieldKey="shipper"
            options={mergePersonDatalistOptions(lastSnapshot?.shipper, RESIN_SHIPMENT_DEFAULT_SHIPPERS)}
            value={shipper}
            onChange={setShipper}
          />
        </div>
        <div className="space-y-1">
          <ResinShipmentPersonInput
            label="审核"
            fieldKey="reviewer"
            options={mergePersonDatalistOptions(lastSnapshot?.reviewer, RESIN_SHIPMENT_DEFAULT_REVIEWERS)}
            value={reviewer}
            onChange={setReviewer}
          />
        </div>
        <div className="space-y-1">
          <ResinShipmentPersonInput
            label="开票人"
            fieldKey="invoicer"
            options={mergePersonDatalistOptions(lastSnapshot?.invoicer, RESIN_SHIPMENT_DEFAULT_INVOICERS)}
            value={invoicer}
            onChange={setInvoicer}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>备注</Label>
        <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : "录入发货"}
        </Button>
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
    </form>
  );
}
