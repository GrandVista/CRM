"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteContract } from "@/lib/actions/contracts";

export function DeleteContractButton({
  contractId,
  contractNo,
}: {
  contractId: string;
  contractNo: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`确定要删除合同「${contractNo}」吗？此操作不可恢复。`)) return;
    startTransition(async () => {
      await deleteContract(contractId);
      router.push("/contracts");
      router.refresh();
    });
  }

  return (
    <Button variant="destructive" size="sm" disabled={isPending} onClick={handleDelete}>
      {isPending ? "删除中..." : "删除"}
    </Button>
  );
}
