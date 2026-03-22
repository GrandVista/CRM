"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResinOrdersSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [deliveryStatus, setDeliveryStatus] = useState(searchParams.get("deliveryStatus") ?? "");
  const [paymentStatus, setPaymentStatus] = useState(searchParams.get("paymentStatus") ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (deliveryStatus) params.set("deliveryStatus", deliveryStatus);
    if (paymentStatus) params.set("paymentStatus", paymentStatus);
    const q = params.toString();
    router.push(q ? `/resin-orders?${q}` : "/resin-orders");
  }

  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={onSubmit}>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">搜索</label>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="总订单号 / 小单采购单号 / 客户 / 产品"
          className="w-56"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">发货状态</label>
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={deliveryStatus}
          onChange={(e) => setDeliveryStatus(e.target.value)}
        >
          <option value="">全部</option>
          <option value="NOT_SHIPPED">未发货</option>
          <option value="PARTIAL">部分发货</option>
          <option value="SHIPPED">已发货</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">收款状态</label>
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
        >
          <option value="">全部</option>
          <option value="NOT_PAID">未收款</option>
          <option value="PARTIAL">部分收款</option>
          <option value="PAID">已收款</option>
        </select>
      </div>
      <Button type="submit">筛选</Button>
    </form>
  );
}
