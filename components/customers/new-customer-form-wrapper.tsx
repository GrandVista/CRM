"use client";

import { useRouter } from "next/navigation";
import { CustomerForm } from "@/components/customers/customer-form";
import type { CustomerFormData } from "@/lib/actions/customers";

type CreateCustomerFn = (data: CustomerFormData) => Promise<unknown>;

export function NewCustomerFormWrapper({ createCustomer }: { createCustomer: CreateCustomerFn }) {
  const router = useRouter();

  async function handleSubmit(data: CustomerFormData) {
    await createCustomer(data);
    router.push("/customers");
    router.refresh();
  }

  return <CustomerForm onSubmit={handleSubmit} submitLabel="创建客户" />;
}
