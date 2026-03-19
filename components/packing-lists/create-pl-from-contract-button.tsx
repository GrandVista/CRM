"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createPackingListFromContract } from "@/lib/actions/packing-lists";

export function CreatePlFromContractButton({ contractId }: { contractId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const pl = await createPackingListFromContract(contractId);
      router.push(`/cl/${pl.id}/edit`);
      router.refresh();
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      {isPending ? "生成中…" : "生成 PL"}
    </Button>
  );
}
