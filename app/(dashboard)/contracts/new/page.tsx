import Link from "next/link";
import type { TemplateType } from "@prisma/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { createContract, getQuotationDataForContract } from "@/lib/actions/contracts";
import { getCustomers } from "@/lib/actions/customers";
import { getProducts } from "@/lib/actions/products";
import { getQuotations } from "@/lib/actions/quotations";
import { getTemplatesGroupedByType, getDefaultTemplateContents } from "@/lib/actions/templates";
import { TEMPLATE_TYPES } from "@/lib/template-utils";
import { NewContractFormWrapper } from "@/components/contracts/new-contract-form-wrapper";

export default async function NewContractPage() {
  const [customers, products, quotations, groupedTemplates, defaultContents] = await Promise.all([
    getCustomers({}),
    getProducts({ activeOnly: false }),
    getQuotations({}),
    getTemplatesGroupedByType(),
    getDefaultTemplateContents(),
  ]);
  const quotationOptions = quotations.map((q) => ({ id: q.id, quotationNo: q.quotationNo }));

  const templatesByType: Partial<Record<TemplateType, { id: string; name: string; content: string | null }[]>> = {};
  for (const k of TEMPLATE_TYPES) {
    if (groupedTemplates[k]?.length)
      templatesByType[k] = groupedTemplates[k].map((t) => ({ id: t.id, name: t.name, content: t.content }));
  }

  const defaultValues = {
    contractType: "FILM" as const,
    paymentTerm: defaultContents.PAYMENT_TERM ?? "",
    incoterm: defaultContents.INCOTERM ?? "",
    estimatedShipmentDate: "",
    partialShipment: "ALLOWED" as const,
    transhipment: "ALLOWED" as const,
    packingTerm: defaultContents.PACKING_TERM ?? "",
    insuranceTerm: defaultContents.INSURANCE_TERM ?? "",
    documentRequirement: defaultContents.DOCUMENT_REQUIREMENT ?? "",
    bankInfo: defaultContents.BANK_INFO ?? "",
  };

  return (
    <div className="flex flex-col">
      <Header title="新建合同" description="创建新合同">
        <Button asChild variant="outline">
          <Link href="/contracts">返回列表</Link>
        </Button>
      </Header>
      <div className="p-6">
        <NewContractFormWrapper
          customers={customers}
          products={products}
          quotations={quotationOptions}
          defaultValues={defaultValues}
          templatesByType={templatesByType}
          createContract={createContract}
          fetchQuotationData={getQuotationDataForContract}
        />
      </div>
    </div>
  );
}
