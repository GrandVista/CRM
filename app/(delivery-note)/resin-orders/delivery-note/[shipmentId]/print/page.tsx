import { notFound } from "next/navigation";
import { ResinDeliveryNotePrintView } from "@/components/resin-orders/resin-delivery-note-print-view";
import { getResinDeliveryNoteShipmentWithOrder } from "@/lib/resin-delivery-note-shipment";
import { buildResinDeliveryNotePdfInputFromShipment } from "@/lib/resin-delivery-note-build";

export default async function ResinDeliveryNotePrintPage({
  params,
}: {
  params: Promise<{ shipmentId: string }>;
}) {
  const { shipmentId } = await params;
  const shipment = await getResinDeliveryNoteShipmentWithOrder(shipmentId);
  if (!shipment) notFound();

  const pdfInput = buildResinDeliveryNotePdfInputFromShipment(shipment);

  return (
    <div className="py-6 print:py-0">
      <ResinDeliveryNotePrintView
        shipmentId={shipmentId}
        deliveryNo={pdfInput.deliveryNo}
        documentDate={pdfInput.documentDate}
        customerName={pdfInput.customerName}
        lines={pdfInput.lines}
        totalQuantity={pdfInput.totalQuantity}
        carrierLine={pdfInput.carrierLine}
        remarkLine={pdfInput.remarkLine}
        reviewer={pdfInput.reviewer ?? ""}
        invoicer={pdfInput.invoicer ?? ""}
        shipper={pdfInput.shipper ?? ""}
        legacyUndistributed={shipment.items.length === 0 && shipment.quantity > 0}
      />
    </div>
  );
}
