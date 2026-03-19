"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteProduct } from "@/lib/actions/products";

export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`确定要删除产品「${productName}」吗？`)) return;
    startTransition(async () => {
      await deleteProduct(productId);
      router.push("/products");
      router.refresh();
    });
  }

  return (
    <Button variant="destructive" size="sm" disabled={isPending} onClick={handleDelete}>
      {isPending ? "删除中..." : "删除"}
    </Button>
  );
}
