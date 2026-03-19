"use client";

import { useRouter } from "next/navigation";
import { ContractForm } from "@/components/contracts/contract-form";
import type { ContractFormData } from "@/lib/actions/contracts";
import type { Customer } from "@prisma/client";
import type { Product } from "@prisma/client";

type QuotationOption = { id: string; quotationNo: string };

export function EditContractFormWrapper({
  contractId,
  customers,
  products,
  quotations,
  defaultValues,
  updateContract,
  fetchQuotationData,
}: {
  contractId: string;
  customers: Awaited<ReturnType<typeof import("@/lib/actions/customers").getCustomers>>;
  products: Awaited<ReturnType<typeof import("@/lib/actions/products").getProducts>>;
  quotations: QuotationOption[];
  defaultValues: Partial<ContractFormData>;
  updateContract: (id: string, data: ContractFormData) => Promise<unknown>;
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
    await updateContract(contractId, data);
    router.push(`/contracts/${contractId}`);
    router.refresh();
  }

  return (
    <ContractForm
      customers={customers as Customer[]}
      products={products as Product[]}
      quotations={quotations}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitLabel="保存"
      fetchQuotationData={fetchQuotationData}
    />
  );
}
