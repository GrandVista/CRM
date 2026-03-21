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

export function ResinOrderShipmentForm({ resinOrderId }: { resinOrderId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [shipmentDate, setShipmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [quantity, setQuantity] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [remarks, setRemarks] = useState("");
  const [shipper, setShipper] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [invoicer, setInvoicer] = useState("");
  /** 最近一次 shipment 上的三人（用于下拉「最近使用」置顶） */
  const [lastSnapshot, setLastSnapshot] = useState<ResinShipmentLastPersonDefaults | null>(null);

  const applyDefaultsFromResponse = useCallback((data: ResinShipmentLastPersonDefaults) => {
    setLastSnapshot(data);
    if (data.shipper?.trim()) setShipper(data.shipper.trim());
    if (data.reviewer?.trim()) setReviewer(data.reviewer.trim());
    if (data.invoicer?.trim()) setInvoicer(data.invoicer.trim());
  }, []);

  const loadLastPersonDefaults = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await authFetch("/api/resin-orders/shipments/last-defaults", { signal });
      if (signal?.aborted || !res.ok) return;
      const data = (await res.json()) as ResinShipmentLastPersonDefaults;
      if (signal?.aborted) return;
      applyDefaultsFromResponse(data);
    } catch {
      if (signal?.aborted) return;
      // 静默失败：仍可用空表单 + 静态默认名单
    }
  }, [applyDefaultsFromResponse]);

  useEffect(() => {
    const ac = new AbortController();
    void loadLastPersonDefaults(ac.signal);
    return () => ac.abort();
  }, [loadLastPersonDefaults]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setError(null);
      try {
        await addResinOrderShipment(resinOrderId, {
          shipmentDate,
          quantity: Number(quantity) || 0,
          vehicleNo: vehicleNo || undefined,
          driverName: driverName || undefined,
          driverPhone: driverPhone || undefined,
          remarks: remarks || undefined,
          shipper: shipper || undefined,
          reviewer: reviewer || undefined,
          invoicer: invoicer || undefined,
        });
        setQuantity("");
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
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>发货日期</Label>
          <Input type="date" value={shipmentDate} onChange={(e) => setShipmentDate(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>发货数量</Label>
          <Input type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
        </div>
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
        <Button type="submit" disabled={isPending}>{isPending ? "保存中..." : "录入发货"}</Button>
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
    </form>
  );
}
