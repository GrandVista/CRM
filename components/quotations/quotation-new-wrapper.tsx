"use client";

import { useRouter } from "next/navigation";
import { QuotationForm } from "@/components/quotations/quotation-form";
import type { QuotationFormData } from "@/lib/actions/quotations";
import type { Customer } from "@prisma/client";
import type { Product } from "@prisma/client";

export function QuotationNewWrapper({
  customers,
  products,
  createQuotation,
}: {
  customers: Awaited<ReturnType<typeof import("@/lib/actions/customers").getCustomers>>;
  products: Awaited<ReturnType<typeof import("@/lib/actions/products").getProducts>>;
  createQuotation: (data: QuotationFormData) => Promise<unknown>;
}) {
  const router = useRouter();

  async function handleSubmit(data: QuotationFormData) {
    await createQuotation(data);
    router.push("/quotations");
    router.refresh();
  }

  return (
    <QuotationForm
      customers={customers as Customer[]}
      products={products as Product[]}
      onSubmit={handleSubmit}
      submitLabel="创建报价单"
    />
  );
}
