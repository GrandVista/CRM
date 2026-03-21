import { NextResponse } from "next/server";
import { getPackingListById } from "@/lib/actions/packing-lists";
import { getCompanyProfile } from "@/lib/actions/settings";
import { getCustomerDisplayName } from "@/lib/utils";
import { requireAuth } from "@/lib/server-auth";
import { parsePdfDisposition } from "@/lib/pdf/disposition";
import { pdfBufferNextResponse } from "@/lib/pdf/response";
import { buildPackingListPdfBuffer } from "@/lib/packing-list-pdf";
import { handleApiRouteError } from "@/lib/api-route-error-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const disposition = parsePdfDisposition(searchParams);

    const [pl, companyProfile] = await Promise.all([getPackingListById(id), getCompanyProfile()]);
    if (!pl) {
      return NextResponse.json({ message: "装箱单不存在" }, { status: 404 });
    }

    const seller = {
      companyName: companyProfile?.companyName ?? "",
      companyAddress: companyProfile?.companyAddress ?? null,
    };
    const buyer = {
      name: pl.buyerName || getCustomerDisplayName(pl.customer ?? null) || "",
      address: pl.buyerAddress ?? null,
    };
    const items = (pl.items ?? []).map((i) => ({
      productName: i.productName,
      specification: i.specification ?? "",
      actualRollQty: i.actualRollQty,
      actualNetWeightKg: i.actualNetWeightKg,
    }));

    const buffer = await buildPackingListPdfBuffer({
      plNo: pl.clNo,
      documentDate: (pl.documentDate ?? pl.shipmentDate ?? new Date()).toISOString().slice(0, 10),
      contractNo: pl.contract?.contractNo ?? "",
      invoiceNo: pl.invoiceNo ?? "",
      seller,
      buyer,
      paymentMethod: pl.paymentMethod ?? null,
      lcNo: pl.lcNo ?? null,
      paymentTerm: pl.paymentTerm ?? "",
      tradeTerm: pl.tradeTerm ?? "",
      packingTerm: pl.packingTerm ?? "",
      fromPort: pl.fromPort ?? "",
      destinationPort: pl.destinationPort ?? "",
      vesselVoyageNo: pl.vesselVoyageNo ?? "",
      departureDate: pl.departureDate?.toISOString().slice(0, 10) ?? "",
      containerNo: pl.containerNo ?? "",
      sealNo: pl.sealNo ?? "",
      shippingMarks: pl.shippingMarks ?? "",
      items,
      totalPallets: pl.totalPallets ?? null,
      totalRolls: pl.totalRolls ?? 0,
      totalNetWeight: pl.totalNetWeight ?? pl.netWeight ?? 0,
      totalGrossWeight: pl.totalGrossWeight ?? pl.grossWeight ?? null,
      totalCbm: pl.totalCbm ?? pl.volume ?? null,
    });

    const safeFile = `packing-list-${pl.clNo.replace(/[^\w.-]+/g, "_")}.pdf`;
    return pdfBufferNextResponse(buffer, { disposition, filename: safeFile });
  } catch (e) {
    return handleApiRouteError(e, "GET /api/packing-lists/[id]/pdf");
  }
}
