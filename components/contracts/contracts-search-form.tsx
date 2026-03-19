"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const SIGN_OPTIONS = [
  { value: "", label: "全部" },
  { value: "UNSIGNED", label: "未签署" },
  { value: "SIGNED", label: "已签署" },
  { value: "VOIDED", label: "作废" },
];

import { EXEC_OPTIONS_WITH_ALL } from "@/lib/constants/execution-status";

const EXEC_OPTIONS = EXEC_OPTIONS_WITH_ALL;

export function ContractsSearchForm({
  defaultSearch = "",
  defaultSignStatus = "",
  defaultExecutionStatus = "",
}: {
  defaultSearch?: string;
  defaultSignStatus?: string;
  defaultExecutionStatus?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const search = (form.elements.namedItem("search") as HTMLInputElement).value;
    const signStatus = (form.elements.namedItem("signStatus") as HTMLSelectElement).value;
    const executionStatus = (form.elements.namedItem("executionStatus") as HTMLSelectElement).value;
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("search", search);
    else params.delete("search");
    if (signStatus) params.set("signStatus", signStatus);
    else params.delete("signStatus");
    if (executionStatus) params.set("executionStatus", executionStatus);
    else params.delete("executionStatus");
    startTransition(() => router.push(`/contracts?${params.toString()}`));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-4">
      <div className="space-y-2">
        <Label htmlFor="search">搜索</Label>
        <Input
          id="search"
          name="search"
          placeholder="合同编号/客户"
          defaultValue={defaultSearch}
          className="w-48"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signStatus">签署状态</Label>
        <select
          id="signStatus"
          name="signStatus"
          defaultValue={defaultSignStatus}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-28"
          )}
        >
          {SIGN_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
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
          defaultValue={defaultExecutionStatus}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-32"
          )}
        >
          {EXEC_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "查询中..." : "查询"}
      </Button>
    </form>
  );
}
