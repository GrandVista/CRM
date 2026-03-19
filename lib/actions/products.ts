"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ProductFormData = {
  productCode: string;
  name: string;
  category?: string;
  material?: string;
  density?: number;
  unit?: string;
  defaultPrice?: number;
  currency?: string;
  weightFormulaType?: string;
  pricingMethod?: string;
  packingMethod?: string;
  remark?: string;
  isActive?: boolean;
};

export async function getProducts(params?: { search?: string; activeOnly?: boolean }) {
  const where: Record<string, unknown> = {};
  if (params?.search) {
    where.OR = [
      { productCode: { contains: params.search, mode: "insensitive" } },
      { name: { contains: params.search, mode: "insensitive" } },
      { category: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params?.activeOnly !== false) {
    where.isActive = true;
  }
  return prisma.product.findMany({
    where,
    orderBy: { productCode: "asc" },
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

export async function createProduct(data: ProductFormData) {
  const product = await prisma.product.create({
    data: {
      productCode: data.productCode,
      name: data.name,
      category: data.category ?? null,
      material: data.material ?? null,
      density: data.density ?? null,
      unit: data.unit ?? "kg",
      defaultPrice: data.defaultPrice ?? null,
      currency: data.currency ?? "USD",
      weightFormulaType: data.weightFormulaType ?? null,
      pricingMethod: data.pricingMethod ?? null,
      packingMethod: data.packingMethod ?? null,
      remark: data.remark ?? null,
      isActive: data.isActive ?? true,
    },
  });
  revalidatePath("/products");
  return product;
}

export async function updateProduct(id: string, data: ProductFormData) {
  const product = await prisma.product.update({
    where: { id },
    data: {
      productCode: data.productCode,
      name: data.name,
      category: data.category ?? null,
      material: data.material ?? null,
      density: data.density ?? null,
      unit: data.unit ?? "kg",
      defaultPrice: data.defaultPrice ?? null,
      currency: data.currency ?? "USD",
      weightFormulaType: data.weightFormulaType ?? null,
      pricingMethod: data.pricingMethod ?? null,
      packingMethod: data.packingMethod ?? null,
      remark: data.remark ?? null,
      isActive: data.isActive ?? true,
    },
  });
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  revalidatePath(`/products/${id}/edit`);
  return product;
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/products");
}
