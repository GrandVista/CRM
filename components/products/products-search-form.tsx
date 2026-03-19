"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ProductsSearchForm({
  defaultSearch = "",
  defaultActive = "",
}: {
  defaultSearch?: string;
  defaultActive?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const search = (form.elements.namedItem("search") as HTMLInputElement).value;
    const active = (form.elements.namedItem("active") as HTMLSelectElement).value;
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("search", search);
    else params.delete("search");
    if (active) params.set("active", active);
    else params.delete("active");
    startTransition(() => router.push(`/products?${params.toString()}`));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-4">
      <div className="space-y-2">
        <Label htmlFor="search">搜索</Label>
        <Input
          id="search"
          name="search"
          placeholder="编号/名称/类别"
          defaultValue={defaultSearch}
          className="w-48"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="active">状态</Label>
        <select
          id="active"
          name="active"
          defaultValue={defaultActive}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-32"
          )}
        >
          <option value="">启用</option>
          <option value="all">全部</option>
        </select>
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "查询中..." : "查询"}
      </Button>
    </form>
  );
}
