"use client";

import { useRouter } from "next/navigation";
import { CustomerForm } from "@/components/customers/customer-form";
import type { CustomerFormData } from "@/lib/actions/customers";

type UpdateCustomerFn = (id: string, data: CustomerFormData) => Promise<unknown>;

export function EditCustomerFormWrapper({
  customerId,
  defaultValues,
  updateCustomer,
}: {
  customerId: string;
  defaultValues: Partial<CustomerFormData>;
  updateCustomer: UpdateCustomerFn;
}) {
  const router = useRouter();

  async function handleSubmit(data: CustomerFormData) {
    await updateCustomer(customerId, data);
    router.push(`/customers/${customerId}`);
    router.refresh();
  }

  return (
    <CustomerForm
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitLabel="保存"
    />
  );
}
