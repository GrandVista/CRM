"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ContractSummaryMode } from "@/lib/actions/contract-summary";

const MODES: { value: ContractSummaryMode; label: string }[] = [
  { value: "month", label: "按月" },
  { value: "year", label: "按年" },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}月`,
}));

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 2 + i);

export function ContractSummaryFilters({
  defaultMode = "month",
  defaultYear,
  defaultMonth,
  defaultCompletedOnly = false,
}: {
  defaultMode?: ContractSummaryMode;
  defaultYear?: number;
  defaultMonth?: number;
  defaultCompletedOnly?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<ContractSummaryMode>(defaultMode);
  const [year, setYear] = useState(defaultYear ?? CURRENT_YEAR);
  const [month, setMonth] = useState(defaultMonth ?? new Date().getMonth() + 1);
  const [completedOnly, setCompletedOnly] = useState(defaultCompletedOnly);

  useEffect(() => {
    const m = (searchParams.get("mode") as ContractSummaryMode) || defaultMode;
    const y = searchParams.get("year") ? Number(searchParams.get("year")) : defaultYear ?? CURRENT_YEAR;
    const mo = searchParams.get("month") ? Number(searchParams.get("month")) : defaultMonth ?? new Date().getMonth() + 1;
    const co = searchParams.get("completedOnly") === "1" || searchParams.get("completedOnly") === "true";
    setMode(m);
    setYear(y);
    setMonth(mo);
    setCompletedOnly(co);
  }, [searchParams, defaultMode, defaultYear, defaultMonth, defaultCompletedOnly]);

  function apply(m: ContractSummaryMode, y: number, mo?: number, co?: boolean) {
    const params = new URLSearchParams();
    params.set("mode", m);
    params.set("year", String(y));
    if (m === "month" && mo != null) params.set("month", String(mo));
    if (co) params.set("completedOnly", "1");
    startTransition(() => router.push(`/contracts/summary?${params.toString()}`));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    apply(mode, year, mode === "month" ? month : undefined, completedOnly);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card p-4">
      <div className="space-y-2">
        <Label>统计维度</Label>
        <Select
          value={mode}
          onValueChange={(v) => setMode(v as ContractSummaryMode)}
        >
          <SelectTrigger className={cn("w-[100px]")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODES.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>年份</Label>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className={cn("w-[100px]")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEAR_OPTIONS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}年
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {mode === "month" && (
        <div className="space-y-2">
          <Label>月份</Label>
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className={cn("w-[100px]")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="completedOnly"
          checked={completedOnly}
          onChange={(e) => setCompletedOnly(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="completedOnly" className="text-sm font-normal cursor-pointer">
          只导出已完成订单
        </Label>
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "查询中..." : "查询"}
      </Button>
    </form>
  );
}
