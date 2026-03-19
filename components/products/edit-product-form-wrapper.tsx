"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import type { ProductFormData } from "@/lib/actions/products";

export function EditProductFormWrapper({
  productId,
  defaultValues,
  updateProduct,
}: {
  productId: string;
  defaultValues: Partial<ProductFormData>;
  updateProduct: (id: string, data: ProductFormData) => Promise<unknown>;
}) {
  const router = useRouter();

  async function handleSubmit(data: ProductFormData) {
    await updateProduct(productId, data);
    router.push(`/products/${productId}`);
    router.refresh();
  }

  return (
    <ProductForm
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitLabel="保存"
    />
  );
}
