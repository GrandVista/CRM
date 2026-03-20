"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteContract } from "@/lib/actions/contracts";

export function DeleteContractButton({
  contractId,
  contractNo,
  isArchived,
  currentUserRole,
}: {
  contractId: string;
  contractNo: string;
  isArchived: boolean;
  currentUserRole: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canDelete = !isArchived || currentUserRole === "admin";

  function handleDelete() {
    const text =
      isArchived && currentUserRole === "admin"
        ? "该合同已归档，是否确认删除？此操作不可恢复"
        : `确定要删除合同「${contractNo}」吗？此操作不可恢复。`;
    if (!confirm(text)) return;
    startTransition(async () => {
      await deleteContract(contractId);
      router.push("/contracts");
      router.refresh();
    });
  }

  if (!canDelete) return null;

  return (
    <Button variant="destructive" size="sm" disabled={isPending} onClick={handleDelete}>
      {isPending ? "删除中..." : "删除"}
    </Button>
  );
}
