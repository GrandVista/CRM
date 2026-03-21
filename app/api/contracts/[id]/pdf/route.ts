import { NextResponse } from "next/server";
import { getContractById } from "@/lib/actions/contracts";
import { getCompanyProfile } from "@/lib/actions/settings";
import { getCustomerDisplayName } from "@/lib/utils";
import { requireAuth } from "@/lib/server-auth";
import { parsePdfDisposition } from "@/lib/pdf/disposition";
import { pdfBufferNextResponse } from "@/lib/pdf/response";
import { buildContractPdfBuffer } from "@/lib/contract-pdf";
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

    const [contract, companyProfile] = await Promise.all([getContractById(id), getCompanyProfile()]);
    if (!contract) {
      return NextResponse.json({ message: "合同不存在" }, { status: 404 });
    }

    const customer = contract.customer;
    const seller = {
      companyName: companyProfile?.companyName ?? null,
      companyAddress: companyProfile?.companyAddress ?? null,
      companyTel: companyProfile?.companyTel ?? null,
      companyEmail: companyProfile?.companyEmail ?? null,
    };
    const buyer = {
      name: getCustomerDisplayName(customer ?? null),
      address: customer?.address ?? null,
      phone: customer?.phone ?? null,
    };
    const contractType = contract.contractType ?? "FILM";
    const items = contract.items.map((i) => ({
      productName: i.productName,
      thickness: i.thickness ?? null,
      width: i.width ?? null,
      length: i.length ?? null,
      unitPrice: i.unitPrice,
      rollQty: i.rollQty,
      quantityKg: i.quantityKg,
      amount: i.amount,
    }));
    const terms = {
      estimatedShipmentDate: contract.estimatedShipmentDate ?? null,
      incoterm: contract.incoterm ?? null,
      portOfShipment: contract.portOfShipment ?? null,
      portOfDestination: contract.portOfDestination ?? null,
      partialShipment: contract.partialShipment ?? null,
      transhipment: contract.transhipment ?? null,
      packingTerm: contract.packingTerm ?? null,
      paymentTerm: contract.paymentTerm ?? null,
      documentRequirement: contract.documentRequirement ?? null,
      insuranceTerm: contract.insuranceTerm ?? null,
      bankInfo: contract.bankInfo ?? null,
      moreOrLessPercent: contract.moreOrLessPercent ?? null,
      remark: contract.remark ?? null,
    };

    const buffer = await buildContractPdfBuffer({
      seller,
      contractNo: contract.contractNo,
      contractDate: contract.contractDate.toISOString().slice(0, 10),
      buyer,
      items,
      totalRolls: contract.totalRolls,
      totalWeight: contract.totalWeight,
      totalAmount: contract.totalAmount,
      currency: contract.currency,
      terms,
      contractType,
    });

    const safeFile = `contract-${contract.contractNo.replace(/[^\w.-]+/g, "_")}.pdf`;
    return pdfBufferNextResponse(buffer, { disposition, filename: safeFile });
  } catch (e) {
    return handleApiRouteError(e, "GET /api/contracts/[id]/pdf");
  }
}
