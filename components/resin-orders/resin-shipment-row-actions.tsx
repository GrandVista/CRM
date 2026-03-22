"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Pencil, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getToken } from "@/lib/auth";
import {
  ResinShipmentEditDialog,
  type ResinShipmentEditInitial,
} from "@/components/resin-orders/resin-shipment-edit-dialog";

export type ResinShipmentRowData = {
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
  signedDeliveryNoteUrl: string | null;
  signedDeliveryNoteName: string | null;
  arrivalConfirmed: boolean;
  hasPurchaseOrders: boolean;
  lines: { purchaseOrderId: string; quantity: number; customerPoNo: string }[];
};

function toEditInitial(
  s: ResinShipmentRowData,
  purchaseOrderOptions: { id: string; customerPoNo: string }[],
): ResinShipmentEditInitial {
  return {
    id: s.id,
    deliveryNo: s.deliveryNo,
    shipmentDate: s.shipmentDate,
    quantity: s.quantity,
    vehicleNo: s.vehicleNo,
    driverName: s.driverName,
    driverPhone: s.driverPhone,
    remarks: s.remarks,
    shipper: s.shipper,
    reviewer: s.reviewer,
    invoicer: s.invoicer,
    hasPurchaseOrders: s.hasPurchaseOrders,
    lines: s.lines,
    purchaseOrderOptions,
  };
}

export function ResinShipmentRowActions({
  shipment,
  purchaseOrderOptions,
  isAdmin,
}: {
  shipment: ResinShipmentRowData;
  purchaseOrderOptions: { id: string; customerPoNo: string }[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const printHref = `/resin-orders/delivery-note/${shipment.id}/print`;
  const pdfPreviewHref = `/api/resin-orders/delivery-note/${shipment.id}/pdf`;
  const pdfDownloadHref = `/api/resin-orders/delivery-note/${shipment.id}/pdf?download=1`;
  const signedViewHref = `/api/resin-orders/shipments/${shipment.id}/signed-delivery-note?inline=1`;
  const hasSigned = Boolean(shipment.signedDeliveryNoteUrl);

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMessage(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const headers: Record<string, string> = {};
      const t = getToken();
      if (t) headers.Authorization = `Bearer ${t}`;
      const res = await fetch(`/api/resin-orders/shipments/${shipment.id}/signed-delivery-note`, {
        method: "POST",
        body: fd,
        credentials: "include",
        headers,
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setMessage(data.message || "上传失败");
        return;
      }
      router.refresh();
    } catch {
      setMessage("上传失败，请重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              送货单
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[10rem]">
            <DropdownMenuItem asChild>
              <Link href={printHref} target="_blank" rel="noopener noreferrer">
                查看送货单
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={pdfPreviewHref} target="_blank" rel="noopener noreferrer">
                预览 PDF
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={pdfDownloadHref}>下载 PDF</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {isAdmin ? (
          <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
            编辑
          </Button>
        ) : null}

        {isAdmin ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={onFileSelected}
            />
            {hasSigned ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <a href={signedViewHref} target="_blank" rel="noopener noreferrer">
                    查看回签单
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                >
                  重新上传
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                上传回签送货单
              </Button>
            )}
          </>
        ) : hasSigned ? (
          <Button asChild variant="ghost" size="sm">
            <a href={signedViewHref} target="_blank" rel="noopener noreferrer">
              查看回签单
            </a>
          </Button>
        ) : null}
      </div>
      {message ? <p className="text-xs text-destructive max-w-[14rem] text-right">{message}</p> : null}

      <ResinShipmentEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={isAdmin ? toEditInitial(shipment, purchaseOrderOptions) : null}
      />
    </div>
  );
}
