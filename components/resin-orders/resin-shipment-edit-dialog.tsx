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
  hasPurchaseOrders: boolean;
  lines: { purchaseOrderId: string; quantity: number; customerPoNo: string }[];
  purchaseOrderOptions: { id: string; customerPoNo: string }[];
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
  const [legacyQuantity, setLegacyQuantity] = useState("");
  const [editLines, setEditLines] = useState<{ purchaseOrderId: string; quantity: string }[]>([]);
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
    setLegacyQuantity(String(initial.quantity));
    setVehicleNo(initial.vehicleNo);
    setDriverName(initial.driverName);
    setDriverPhone(initial.driverPhone);
    setRemarks(initial.remarks);
    setShipper(initial.shipper);
    setReviewer(initial.reviewer);
    setInvoicer(initial.invoicer);
    if (initial.hasPurchaseOrders) {
      if (initial.lines.length > 0) {
        setEditLines(
          initial.lines.map((l) => ({
            purchaseOrderId: l.purchaseOrderId,
            quantity: String(l.quantity),
          })),
        );
      } else {
        setEditLines([{ purchaseOrderId: initial.purchaseOrderOptions[0]?.id ?? "", quantity: "" }]);
      }
    } else {
      setEditLines([]);
    }
  }, [open, initial]);

  function addLine() {
    if (!initial) return;
    setEditLines((prev) => [
      ...prev,
      { purchaseOrderId: initial.purchaseOrderOptions[0]?.id ?? "", quantity: "" },
    ]);
  }

  function removeLine(i: number) {
    setEditLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!initial) return;
    startTransition(async () => {
      setError(null);
      try {
        if (initial.hasPurchaseOrders) {
          const items = editLines
            .filter((l) => l.purchaseOrderId && Number(l.quantity) > 0)
            .map((l) => ({ purchaseOrderId: l.purchaseOrderId, quantity: Number(l.quantity) }));
          await updateResinOrderShipment(initial.id, {
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
        } else {
          await updateResinOrderShipment(initial.id, {
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
        }
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
            {initial?.hasPurchaseOrders ? (
              <div className="space-y-2 sm:col-span-2 rounded-md border border-border p-2">
                <div className="flex justify-between items-center">
                  <Label>分摊明细</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLine}>
                    增加一行
                  </Button>
                </div>
                {initial.lines.length === 0 ? (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    此单为旧数据未分摊；保存时将按下方行写入小订单明细。
                  </p>
                ) : null}
                {editLines.map((line, idx: number) => (
                  <div key={idx} className="flex flex-wrap gap-2 items-end">
                    <select
                      className="flex h-10 min-w-[10rem] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={line.purchaseOrderId}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditLines((prev) => prev.map((row, i) => (i === idx ? { ...row, purchaseOrderId: v } : row)));
                      }}
                    >
                      <option value="">选择采购单</option>
                      {initial.purchaseOrderOptions.map((po) => (
                        <option key={po.id} value={po.id}>
                          {po.customerPoNo}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      step="0.01"
                      className="w-24"
                      value={line.quantity}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditLines((prev) => prev.map((row, i) => (i === idx ? { ...row, quantity: v } : row)));
                      }}
                    />
                    {editLines.length > 1 ? (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(idx)}>
                        删
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                <Label>发货数量</Label>
                <Input type="number" step="0.01" value={legacyQuantity} onChange={(e) => setLegacyQuantity(e.target.value)} required />
              </div>
            )}
            <div className="space-y-1">
              <Label>发货日期</Label>
              <Input type="date" value={shipmentDate} onChange={(e) => setShipmentDate(e.target.value)} required />
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
