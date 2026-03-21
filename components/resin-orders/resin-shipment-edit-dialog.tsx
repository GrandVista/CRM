"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResinShipmentPersonInput } from "@/components/resin-orders/resin-shipment-person-input";
import {
  RESIN_SHIPMENT_DEFAULT_INVOICERS,
  RESIN_SHIPMENT_DEFAULT_REVIEWERS,
  RESIN_SHIPMENT_DEFAULT_SHIPPERS,
} from "@/lib/constants/resin-shipment-signoff-defaults";
import { updateResinOrderShipment } from "@/lib/actions/resin-orders";
import { useRouter } from "next/navigation";

export type ResinShipmentEditInitial = {
  id: string;
  deliveryNo: string;
  shipmentDate: string;
  quantity: number;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  remarks: string;
  shipper: string;
  reviewer: string;
  invoicer: string;
};

export function ResinShipmentEditDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: ResinShipmentEditInitial | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [shipmentDate, setShipmentDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [remarks, setRemarks] = useState("");
  const [shipper, setShipper] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [invoicer, setInvoicer] = useState("");

  useEffect(() => {
    if (!open || !initial) return;
    setError(null);
    setShipmentDate(initial.shipmentDate);
    setQuantity(String(initial.quantity));
    setVehicleNo(initial.vehicleNo);
    setDriverName(initial.driverName);
    setDriverPhone(initial.driverPhone);
    setRemarks(initial.remarks);
    setShipper(initial.shipper);
    setReviewer(initial.reviewer);
    setInvoicer(initial.invoicer);
  }, [open, initial]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!initial) return;
    startTransition(async () => {
      setError(null);
      try {
        await updateResinOrderShipment(initial.id, {
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
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "保存失败");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑发货记录</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>送货单号</Label>
              <Input value={initial?.deliveryNo ?? ""} disabled className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">送货单号不可修改</p>
            </div>
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
            <div className="space-y-1 sm:col-span-2">
              <ResinShipmentPersonInput
                label="发货人"
                fieldKey="shipper"
                options={RESIN_SHIPMENT_DEFAULT_SHIPPERS}
                value={shipper}
                onChange={setShipper}
              />
            </div>
            <div className="space-y-1">
              <ResinShipmentPersonInput
                label="审核"
                fieldKey="reviewer"
                options={RESIN_SHIPMENT_DEFAULT_REVIEWERS}
                value={reviewer}
                onChange={setReviewer}
              />
            </div>
            <div className="space-y-1">
              <ResinShipmentPersonInput
                label="开票人"
                fieldKey="invoicer"
                options={RESIN_SHIPMENT_DEFAULT_INVOICERS}
                value={invoicer}
                onChange={setInvoicer}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>备注</Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isPending || !initial}>
              {isPending ? "保存中…" : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
