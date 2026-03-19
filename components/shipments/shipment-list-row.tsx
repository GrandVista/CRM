"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateShipment } from "@/lib/actions/shipments";
import { SHIPMENT_STATUS_OPTIONS } from "@/lib/constants/shipment-status";
import type { ShipmentStatusOption } from "@/lib/constants/shipment-status";

type ShipmentRow = {
  id: string;
  shipmentNo: string;
  vesselVoyage: string | null;
  etd: Date | null;
  status: string;
  contract: { contractNo: string } | null;
};

function formatDateInput(d: Date | null): string {
  if (!d) return "";
  const date = new Date(d);
  return date.toISOString().slice(0, 10);
}

export function ShipmentListRow({ shipment }: { shipment: ShipmentRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [vesselVoyageNo, setVesselVoyageNo] = useState(shipment.vesselVoyage ?? "");
  const [etd, setEtd] = useState(formatDateInput(shipment.etd));
  const [status, setStatus] = useState<ShipmentStatusOption>(
    shipment.status === "BOOKED" || shipment.status === "STUFFED" || shipment.status === "SAILED"
      ? shipment.status
      : "BOOKED"
  );
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const hasChange =
    vesselVoyageNo !== (shipment.vesselVoyage ?? "") ||
    etd !== formatDateInput(shipment.etd) ||
    status !== shipment.status;

  function handleUpdate() {
    if (!hasChange) return;
    startTransition(async () => {
      setMessage(null);
      try {
        await updateShipment(shipment.id, {
          vesselVoyage: vesselVoyageNo || null,
          etd: etd || null,
          status,
        });
        setMessage({ type: "success", text: "已更新" });
        router.refresh();
        setTimeout(() => setMessage(null), 2000);
      } catch (e) {
        setMessage({
          type: "error",
          text: e instanceof Error ? e.message : "更新失败",
        });
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{shipment.shipmentNo}</TableCell>
      <TableCell>{shipment.contract?.contractNo ?? "—"}</TableCell>
      <TableCell>
        <Input
          className="h-8 w-[140px]"
          placeholder="e.g. MSC XYZ / V.123"
          value={vesselVoyageNo}
          onChange={(e) => setVesselVoyageNo(e.target.value)}
          disabled={isPending}
        />
      </TableCell>
      <TableCell>
        <Input
          type="date"
          className="h-8 w-[130px]"
          value={etd}
          onChange={(e) => setEtd(e.target.value)}
          disabled={isPending}
        />
      </TableCell>
      <TableCell>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as ShipmentStatusOption)}
          disabled={isPending}
        >
          <SelectTrigger className="h-8 w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SHIPMENT_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasChange || isPending}
            onClick={handleUpdate}
          >
            {isPending ? "更新中…" : "更新"}
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/shipments/${shipment.id}`}>详情</Link>
          </Button>
          {message && (
            <span
              className={
                message.type === "success"
                  ? "text-sm text-green-600"
                  : "text-sm text-destructive"
              }
            >
              {message.text}
            </span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
