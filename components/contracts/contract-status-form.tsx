"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { updateContractStatus } from "@/lib/actions/contracts";
import { EXEC_OPTIONS } from "@/lib/constants/execution-status";
import type { SignStatus, ExecutionStatus } from "@prisma/client";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const SIGN_OPTIONS: { value: SignStatus; label: string }[] = [
  { value: "UNSIGNED", label: "未签署" },
  { value: "SIGNED", label: "已签署" },
  { value: "VOIDED", label: "作废" },
];

export function ContractStatusForm({
  contractId,
  currentSignStatus,
  currentExecutionStatus,
}: {
  contractId: string;
  currentSignStatus: SignStatus;
  currentExecutionStatus: ExecutionStatus;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const signStatus = (form.elements.namedItem("signStatus") as HTMLSelectElement).value as SignStatus;
    const executionStatus = (form.elements.namedItem("executionStatus") as HTMLSelectElement).value as ExecutionStatus;
    if (signStatus === currentSignStatus && executionStatus === currentExecutionStatus) return;
    startTransition(async () => {
      await updateContractStatus(contractId, { signStatus, executionStatus });
      window.location.reload();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      <div className="space-y-2">
        <Label htmlFor="signStatus">签署状态</Label>
        <select
          id="signStatus"
          name="signStatus"
          defaultValue={currentSignStatus}
          className={cn(inputClass, "w-28")}
        >
          {SIGN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="executionStatus">执行状态</Label>
        <select
          id="executionStatus"
          name="executionStatus"
          defaultValue={currentExecutionStatus}
          className={cn(inputClass, "w-32")}
        >
          {EXEC_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "保存中..." : "更新状态"}
      </Button>
    </form>
  );
}
