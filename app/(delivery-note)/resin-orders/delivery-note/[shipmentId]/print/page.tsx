import { notFound } from "next/navigation";
import { ResinDeliveryNotePrintView } from "@/components/resin-orders/resin-delivery-note-print-view";
import { getResinDeliveryNoteShipmentWithOrder } from "@/lib/resin-delivery-note-shipment";

export default async function ResinDeliveryNotePrintPage({
  params,
}: {
  params: Promise<{ shipmentId: string }>;
}) {
  const { shipmentId } = await params;
  const shipment = await getResinDeliveryNoteShipmentWithOrder(shipmentId);
  if (!shipment) notFound();

  const order = shipment.resinOrder;
  const shipmentD = new Date(shipment.shipmentDate);
  const documentDate = Number.isNaN(shipmentD.getTime()) ? new Date() : shipmentD;

  const orderNoForTable = order.customerPoNo?.trim() || order.orderNo;

  const carrierParts = [shipment.driverName, shipment.vehicleNo, shipment.driverPhone].filter(Boolean);
  const carrierLine = carrierParts.join(" / ");

  const remarkParts = [shipment.remarks, order.remarks].filter((x) => x && String(x).trim());
  const remarkLine = remarkParts.length ? remarkParts.join("；") : "";

  return (
    <div className="py-6 print:py-0">
      <ResinDeliveryNotePrintView
        shipmentId={shipmentId}
        deliveryNo={shipment.deliveryNo}
        documentDate={documentDate}
        customerName={order.customerName}
        orderNoForTable={orderNoForTable}
        productName={order.productName}
        grade={order.grade ?? ""}
        unit={order.unit}
        quantity={shipment.quantity}
        carrierLine={carrierLine}
        remarkLine={remarkLine}
        reviewer={shipment.reviewer ?? ""}
        invoicer={shipment.invoicer ?? ""}
        shipper={shipment.shipper ?? ""}
      />
    </div>
  );
}
