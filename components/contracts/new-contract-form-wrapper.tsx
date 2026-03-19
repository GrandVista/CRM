"use client";

import { useRouter } from "next/navigation";
import { ContractForm } from "@/components/contracts/contract-form";
import type { ContractFormData } from "@/lib/actions/contracts";
import type { Customer } from "@prisma/client";
import type { Product } from "@prisma/client";
import type { TemplateType } from "@prisma/client";
import type { TemplateOption } from "@/components/contracts/contract-form";

type QuotationOption = { id: string; quotationNo: string };

export function NewContractFormWrapper({
  customers,
  products,
  quotations,
  defaultValues,
  templatesByType,
  createContract,
  fetchQuotationData,
}: {
  customers: Awaited<ReturnType<typeof import("@/lib/actions/customers").getCustomers>>;
  products: Awaited<ReturnType<typeof import("@/lib/actions/products").getProducts>>;
  quotations: QuotationOption[];
  defaultValues?: Partial<ContractFormData>;
  templatesByType?: Partial<Record<TemplateType, TemplateOption[]>>;
  createContract: (data: ContractFormData) => Promise<unknown>;
  fetchQuotationData: (quotationId: string) => Promise<{
    customerId: string;
    currency: string;
    paymentTerm?: string;
    incoterm?: string;
    items: import("@/lib/actions/contracts").ContractItemInput[];
  } | null>;
}) {
  const router = useRouter();

  async function handleSubmit(data: ContractFormData) {
    await createContract(data);
    router.push("/contracts");
    router.refresh();
  }

  return (
    <ContractForm
      customers={customers as Customer[]}
      products={products as Product[]}
      quotations={quotations}
      defaultValues={defaultValues}
      templatesByType={templatesByType}
      onSubmit={handleSubmit}
      submitLabel="创建合同"
      fetchQuotationData={fetchQuotationData}
    />
  );
}
