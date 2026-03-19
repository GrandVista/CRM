"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import type { ProductFormData } from "@/lib/actions/products";

export function NewProductFormWrapper({
  createProduct,
}: {
  createProduct: (data: ProductFormData) => Promise<unknown>;
}) {
  const router = useRouter();

  async function handleSubmit(data: ProductFormData) {
    await createProduct(data);
    router.push("/products");
    router.refresh();
  }

  return <ProductForm onSubmit={handleSubmit} submitLabel="创建产品" />;
}
