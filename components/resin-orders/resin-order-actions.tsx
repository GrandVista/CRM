"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteResinOrder, forceDeleteResinOrder } from "@/lib/actions/resin-orders";

export function ResinOrderActions({
  id,
  orderNo,
  canDeleteDirectly,
  isAdmin,
}: {
  id: string;
  orderNo: string;
  canDeleteDirectly: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm(`确定删除订单 ${orderNo} 吗？`)) return;
    startTransition(async () => {
      setError(null);
      try {
        await deleteResinOrder(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "删除失败");
      }
    });
  }

  function handleForceDelete() {
    const token = prompt("该订单已有关联记录。输入 DELETE 以强制删除：");
    if (token !== "DELETE") return;
    startTransition(async () => {
      setError(null);
      try {
        await forceDeleteResinOrder(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "强制删除失败");
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5 flex-wrap">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/resin-orders/${id}`}>详情</Link>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href={`/resin-orders/${id}/edit`}>编辑</Link>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href={`/resin-orders/${id}#shipments`}>录入发货</Link>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href={`/resin-orders/${id}#payments`}>录入收款</Link>
      </Button>
      {canDeleteDirectly && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          disabled={isPending}
        >
          删除
        </Button>
      )}
      {isAdmin && !canDeleteDirectly && (
        <Button type="button" variant="destructive" size="sm" onClick={handleForceDelete} disabled={isPending}>
          强制删除
        </Button>
      )}
      {error ? <span className="text-sm text-destructive">{error}</span> : null}
    </div>
  );
}
