"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteCustomer } from "@/lib/actions/customers";

export function DeleteCustomerButton({ customerId, customerName }: { customerId: string; customerName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`确定要删除客户「${customerName}」吗？此操作不可恢复。`)) return;
    startTransition(async () => {
      await deleteCustomer(customerId);
      router.push("/customers");
      router.refresh();
    });
  }

  return (
    <Button variant="destructive" size="sm" disabled={isPending} onClick={handleDelete}>
      {isPending ? "删除中..." : "删除"}
    </Button>
  );
}
