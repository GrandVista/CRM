import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { buildResinDeliveryNotePdfBuffer } from "@/lib/resin-delivery-note-pdf";
import { parsePdfDisposition } from "@/lib/pdf/disposition";
import { pdfBufferNextResponse } from "@/lib/pdf/response";
import { handleApiRouteError } from "@/lib/api-route-error-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { shipmentId } = await context.params;
    const { searchParams } = new URL(request.url);
    const disposition = parsePdfDisposition(searchParams);

    const shipment = await prisma.resinOrderShipment.findUnique({
      where: { id: shipmentId },
      include: { resinOrder: true },
    });
    if (!shipment) {
      return NextResponse.json({ success: false, message: "找不到发货记录" }, { status: 404 });
    }

    const order = shipment.resinOrder;
    const shipmentD = new Date(shipment.shipmentDate);
    const documentDate = Number.isNaN(shipmentD.getTime()) ? new Date() : shipmentD;
    const orderNoForTable = order.customerPoNo?.trim() || order.orderNo;
    const carrierParts = [shipment.driverName, shipment.vehicleNo, shipment.driverPhone].filter(Boolean);
    const carrierLine = carrierParts.join(" / ");
    const remarkParts = [shipment.remarks, order.remarks].filter((x) => x && String(x).trim());
    const remarkLine = remarkParts.length ? remarkParts.join("；") : "";

    const buffer = await buildResinDeliveryNotePdfBuffer({
      deliveryNo: shipment.deliveryNo,
      documentDate,
      customerName: order.customerName,
      orderNoForTable,
      productName: order.productName,
      grade: order.grade ?? "",
      unit: order.unit,
      quantity: shipment.quantity,
      carrierLine,
      remarkLine,
      reviewer: shipment.reviewer,
      invoicer: shipment.invoicer,
      shipper: shipment.shipper,
    });

    const safeName = `delivery-note-${shipment.deliveryNo.replace(/[^\w.-]+/g, "_")}.pdf`;
    return pdfBufferNextResponse(buffer, { disposition, filename: safeName });
  } catch (e) {
    return handleApiRouteError(e, "GET /api/resin-orders/delivery-note/[shipmentId]/pdf");
  }
}
