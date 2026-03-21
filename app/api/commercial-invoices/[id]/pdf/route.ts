import { NextResponse } from "next/server";
import { getCommercialInvoiceById } from "@/lib/actions/commercial-invoices";
import { getCompanyProfile } from "@/lib/actions/settings";
import { getCustomerDisplayName } from "@/lib/utils";
import { requireAuth } from "@/lib/server-auth";
import { parsePdfDisposition } from "@/lib/pdf/disposition";
import { pdfBufferNextResponse } from "@/lib/pdf/response";
import { buildCommercialInvoicePdfBuffer } from "@/lib/commercial-invoice-pdf";
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

    const [ci, companyProfile] = await Promise.all([getCommercialInvoiceById(id), getCompanyProfile()]);
    if (!ci) {
      return NextResponse.json({ message: "商业发票不存在" }, { status: 404 });
    }

    const seller = {
      companyName: companyProfile?.companyName ?? "",
      companyAddress: companyProfile?.companyAddress ?? null,
      companyTel: companyProfile?.companyTel ?? null,
      companyEmail: companyProfile?.companyEmail ?? null,
    };
    const buyer = {
      name: ci.buyerName || getCustomerDisplayName(ci.customer ?? null) || "",
      address: ci.buyerAddress ?? null,
    };
    const items = ci.items.map((i) => ({
      productName: i.productName,
      specification: i.specification ?? "",
      actualQuantityKg: i.actualQuantityKg,
      actualRollQty: i.actualRollQty,
      unitPrice: i.unitPrice,
      amount: i.amount,
    }));

    const buffer = await buildCommercialInvoicePdfBuffer({
      invoiceNo: ci.invoiceNo,
      invoiceDate: ci.invoiceDate.toISOString().slice(0, 10),
      contractNo: ci.contract?.contractNo ?? "",
      seller,
      buyer,
      paymentMethod: ci.paymentMethod ?? null,
      depositAmount: ci.depositAmount ?? null,
      lcNo: ci.lcNo ?? null,
      paymentTerm: ci.paymentTerm ?? "",
      tradeTerm: ci.tradeTerm ?? "",
      packingTerm: ci.packingTerm ?? "",
      fromPort: ci.fromPort ?? "",
      destinationPort: ci.destinationPort ?? "",
      vesselVoyageNo: ci.vesselVoyageNo ?? "",
      departureDate: ci.departureDate?.toISOString().slice(0, 10) ?? "",
      shippingMarks: ci.shippingMarks ?? "",
      items,
      totalAmount: ci.totalAmount,
      totalAmountInWords: ci.totalAmountInWords ?? "",
      depositDeduction: ci.depositDeduction ?? 0,
      balanceAmount: ci.balanceAmount ?? ci.totalAmount,
      balanceAmountInWords: ci.balanceAmountInWords ?? "",
      currency: ci.currency,
    });

    const safeFile = `commercial-invoice-${ci.invoiceNo.replace(/[^\w.-]+/g, "_")}.pdf`;
    return pdfBufferNextResponse(buffer, { disposition, filename: safeFile });
  } catch (e) {
    return handleApiRouteError(e, "GET /api/commercial-invoices/[id]/pdf");
  }
}
