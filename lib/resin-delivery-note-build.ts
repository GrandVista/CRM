import type { ResinDeliveryNotePdfInput, ResinDeliveryNotePdfLine } from "@/lib/resin-delivery-note-pdf";
import type { ResinDeliveryNoteShipmentWithOrder } from "@/lib/resin-delivery-note-shipment";

export function buildResinDeliveryNotePdfInputFromShipment(
  shipment: ResinDeliveryNoteShipmentWithOrder,
): ResinDeliveryNotePdfInput {
  const order = shipment.resinOrder;
  const shipmentD = new Date(shipment.shipmentDate);
  const documentDate = Number.isNaN(shipmentD.getTime()) ? new Date() : shipmentD;
  const carrierParts = [shipment.driverName, shipment.vehicleNo, shipment.driverPhone].filter(Boolean);
  const carrierLine = carrierParts.join(" / ");
  const remarkParts = [shipment.remarks, order.remarks].filter((x: string | null | undefined) => x && String(x).trim());
  const remarkLine = remarkParts.length ? remarkParts.join("；") : "";

  if (shipment.items.length > 0) {
    const lines: ResinDeliveryNotePdfLine[] = shipment.items.map((it, idx: number) => ({
      index: idx + 1,
      orderNo: it.purchaseOrder.customerPoNo,
      productName: order.productName,
      grade: order.grade ?? "",
      unit: order.unit,
      quantity: it.quantity,
      pieces: "—",
    }));
    const totalQuantity = lines.reduce((s, l) => s + l.quantity, 0);
    return {
      deliveryNo: shipment.deliveryNo,
      documentDate,
      customerName: order.customerName,
      lines,
      totalQuantity,
      carrierLine,
      remarkLine,
      reviewer: shipment.reviewer,
      invoicer: shipment.invoicer,
      shipper: shipment.shipper,
    };
  }

  const orderNoForTable = order.customerPoNo?.trim() || order.orderNo;
  return {
    deliveryNo: shipment.deliveryNo,
    documentDate,
    customerName: order.customerName,
    lines: [
      {
        index: 1,
        orderNo: orderNoForTable,
        productName: order.productName,
        grade: order.grade ?? "",
        unit: order.unit,
        quantity: shipment.quantity,
        pieces: "—",
      },
    ],
    totalQuantity: shipment.quantity,
    carrierLine,
    remarkLine,
    reviewer: shipment.reviewer,
    invoicer: shipment.invoicer,
    shipper: shipment.shipper,
  };
}
