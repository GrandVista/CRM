"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createCommercialInvoiceFromContract } from "@/lib/actions/commercial-invoices";

export function CreateCiFromContractButton({ contractId }: { contractId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const ci = await createCommercialInvoiceFromContract(contractId);
      router.push(`/commercial-invoices/${ci.id}/edit`);
      router.refresh();
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      {isPending ? "生成中…" : "生成 CI"}
    </Button>
  );
}
