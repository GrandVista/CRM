import { notFound } from "next/navigation";
import type { TemplateType } from "@prisma/client";
import { getContractById, updateContract, getQuotationDataForContract } from "@/lib/actions/contracts";
import { getCustomers } from "@/lib/actions/customers";
import { getProducts } from "@/lib/actions/products";
import { getQuotations } from "@/lib/actions/quotations";
import { getCompanyProfile } from "@/lib/actions/settings";
import { getTemplatesGroupedByType } from "@/lib/actions/templates";
import { TEMPLATE_TYPES } from "@/lib/template-utils";
import { EditContractPageClient } from "@/components/contracts/edit-contract-page-client";

/**
 * Contract edit page with full-width layout (no sidebar).
 * Uses (dashboard-full) layout; toolbar + left edit / right preview.
 */
export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [contract, customers, products, quotations, companyProfile, groupedTemplates] =
    await Promise.all([
      getContractById(id),
      getCustomers({}),
      getProducts({ activeOnly: false }),
      getQuotations({}),
      getCompanyProfile(),
      getTemplatesGroupedByType(),
    ]);
  if (!contract) notFound();

  const templatesByType: Partial<Record<TemplateType, { id: string; name: string; content: string | null }[]>> = {};
  for (const k of TEMPLATE_TYPES) {
    if (groupedTemplates[k]?.length)
      templatesByType[k] = groupedTemplates[k].map((t) => ({ id: t.id, name: t.name, content: t.content }));
  }

  const quotationOptions = quotations.map((q) => ({ id: q.id, quotationNo: q.quotationNo }));

  const defaultValues = {
    customerId: contract.customerId,
    contractType: contract.contractType ?? "FILM",
    contractDate: contract.contractDate.toISOString().slice(0, 10),
    quotationId: contract.quotationId ?? undefined,
    piId: contract.piId ?? undefined,
    currency: contract.currency,
    incoterm: contract.incoterm ?? undefined,
    paymentMethod: contract.paymentMethod ?? undefined,
    depositRatio: contract.depositRatio ?? undefined,
    paymentTerm: contract.paymentTerm ?? undefined,
    portOfShipment: contract.portOfShipment ?? undefined,
    portOfDestination: contract.portOfDestination ?? undefined,
    partialShipment: contract.partialShipment ?? "ALLOWED",
    transhipment: contract.transhipment ?? "ALLOWED",
    estimatedShipmentDate: (contract.estimatedShipmentDate && /^\d{4}-\d{2}-\d{2}$/.test(contract.estimatedShipmentDate)) ? contract.estimatedShipmentDate : undefined,
    packingTerm: contract.packingTerm ?? undefined,
    insuranceTerm: contract.insuranceTerm ?? undefined,
    documentRequirement: contract.documentRequirement ?? undefined,
    bankInfo: contract.bankInfo ?? undefined,
    moreOrLessPercent: contract.moreOrLessPercent ?? undefined,
    remark: contract.remark ?? undefined,
    signStatus: contract.signStatus,
    executionStatus: contract.executionStatus,
    items: contract.items.map((i) => ({
      productId: i.productId ?? undefined,
      productName: i.productName,
      category: i.category ?? undefined,
      thickness: i.thickness ?? undefined,
      width: i.width ?? undefined,
      length: i.length ?? undefined,
      unitPrice: i.unitPrice,
      rollQty: i.rollQty,
      quantityKg: i.quantityKg,
      actualQty: i.actualQty ?? undefined,
      confirmedQty: i.confirmedQty ?? undefined,
      amount: i.amount,
      remark: i.remark ?? undefined,
      sortOrder: i.sortOrder,
    })),
  };

  return (
    <EditContractPageClient
      contractId={id}
      contractNo={contract.contractNo}
      defaultValues={defaultValues}
      templatesByType={templatesByType}
      customers={customers}
      products={products}
      quotations={quotationOptions}
      companyProfile={companyProfile}
      updateContract={updateContract}
      fetchQuotationData={getQuotationDataForContract}
      showToolbar
      initialAttachments={contract.attachments ?? []}
    />
  );
}
