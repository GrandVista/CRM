"use client";

import { useRouter } from "next/navigation";
import { QuotationForm } from "@/components/quotations/quotation-form";
import type { QuotationFormData } from "@/lib/actions/quotations";
import type { Customer } from "@prisma/client";
import type { Product } from "@prisma/client";

export function QuotationEditWrapper({
  quotationId,
  customers,
  products,
  defaultValues,
  updateQuotation,
}: {
  quotationId: string;
  customers: Awaited<ReturnType<typeof import("@/lib/actions/customers").getCustomers>>;
  products: Awaited<ReturnType<typeof import("@/lib/actions/products").getProducts>>;
  defaultValues: Partial<QuotationFormData>;
  updateQuotation: (id: string, data: QuotationFormData) => Promise<unknown>;
}) {
  const router = useRouter();

  async function handleSubmit(data: QuotationFormData) {
    await updateQuotation(quotationId, data);
    router.push(`/quotations/${quotationId}`);
    router.refresh();
  }

  return (
    <QuotationForm
      customers={customers as Customer[]}
      products={products as Product[]}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitLabel="保存"
    />
  );
}
