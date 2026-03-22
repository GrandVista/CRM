import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { getResinDeliveryNoteShipmentWithOrder } from "@/lib/resin-delivery-note-shipment";
import { buildResinDeliveryNotePdfBuffer } from "@/lib/resin-delivery-note-pdf";
import { buildResinDeliveryNotePdfInputFromShipment } from "@/lib/resin-delivery-note-build";
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

    const shipment = await getResinDeliveryNoteShipmentWithOrder(shipmentId);
    if (!shipment) {
      return NextResponse.json({ success: false, message: "找不到发货记录" }, { status: 404 });
    }

    const pdfInput = buildResinDeliveryNotePdfInputFromShipment(shipment);
    const buffer = await buildResinDeliveryNotePdfBuffer(pdfInput);

    const safeName = `delivery-note-${shipment.deliveryNo.replace(/[^\w.-]+/g, "_")}.pdf`;
    return pdfBufferNextResponse(buffer, { disposition, filename: safeName });
  } catch (e) {
    return handleApiRouteError(e, "GET /api/resin-orders/delivery-note/[shipmentId]/pdf");
  }
}
