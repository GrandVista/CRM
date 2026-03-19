"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateDocNo } from "@/lib/doc-no";
import { sumAmounts } from "@/lib/numbers";
import type { QuotationStatus } from "@prisma/client";

export type QuotationItemInput = {
  productId?: string;
  productName: string;
  category?: string;
  thickness?: string;
  width?: string;
  length?: string;
  unitPrice: number;
  rollQty: number;
  quantityKg: number;
  amount: number;
  remark?: string;
  sortOrder: number;
};

export type QuotationFormData = {
  customerId: string;
  quotationDate: string;
  validUntil?: string;
  currency: string;
  paymentTerm?: string;
  incoterm?: string;
  remark?: string;
  status: QuotationStatus;
  items: QuotationItemInput[];
};

async function getLastQuotationNo(prefix: string): Promise<string | null> {
  const q = await prisma.quotation.findFirst({
    where: { quotationNo: { startsWith: prefix } },
    orderBy: { quotationNo: "desc" },
    select: { quotationNo: true },
  });
  return q?.quotationNo ?? null;
}

export async function getQuotations(params?: { search?: string; status?: string }) {
  const where: Record<string, unknown> = {};
  if (params?.search) {
    where.OR = [
      { quotationNo: { contains: params.search, mode: "insensitive" } },
      { customer: { nameEn: { contains: params.search, mode: "insensitive" } } },
      { customer: { nameCn: { contains: params.search, mode: "insensitive" } } },
    ];
  }
  if (params?.status) {
    where.status = params.status as QuotationStatus;
  }
  return prisma.quotation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { id: true, customerCode: true, nameEn: true, nameCn: true, shortName: true } } },
  });
}

export async function getQuotationById(id: string) {
  return prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function createQuotation(data: QuotationFormData) {
  const quotationNo = await generateDocNo("quotation", getLastQuotationNo);
  const totalAmount = sumAmounts(data.items.map((i) => i.amount));
  const quotation = await prisma.quotation.create({
    data: {
      quotationNo,
      customerId: data.customerId,
      quotationDate: new Date(data.quotationDate),
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      currency: data.currency,
      paymentTerm: data.paymentTerm ?? null,
      incoterm: data.incoterm ?? null,
      remark: data.remark ?? null,
      status: data.status,
      totalAmount,
      items: {
        create: data.items.map((item, idx) => ({
          productId: item.productId || null,
          productName: item.productName,
          category: item.category ?? null,
          thickness: item.thickness ?? null,
          width: item.width ?? null,
          length: item.length ?? null,
          unitPrice: item.unitPrice,
          rollQty: item.rollQty,
          quantityKg: item.quantityKg,
          amount: item.amount,
          remark: item.remark ?? null,
          sortOrder: item.sortOrder ?? idx,
        })),
      },
    },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });
  revalidatePath("/quotations");
  revalidatePath("/dashboard");
  return quotation;
}

export async function updateQuotation(id: string, data: QuotationFormData) {
  const totalAmount = sumAmounts(data.items.map((i) => i.amount));
  await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
  const quotation = await prisma.quotation.update({
    where: { id },
    data: {
      quotationDate: new Date(data.quotationDate),
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      currency: data.currency,
      paymentTerm: data.paymentTerm ?? null,
      incoterm: data.incoterm ?? null,
      remark: data.remark ?? null,
      status: data.status,
      totalAmount,
      items: {
        create: data.items.map((item, idx) => ({
          productId: item.productId || null,
          productName: item.productName,
          category: item.category ?? null,
          thickness: item.thickness ?? null,
          width: item.width ?? null,
          length: item.length ?? null,
          unitPrice: item.unitPrice,
          rollQty: item.rollQty,
          quantityKg: item.quantityKg,
          amount: item.amount,
          remark: item.remark ?? null,
          sortOrder: item.sortOrder ?? idx,
        })),
      },
    },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });
  revalidatePath("/quotations");
  revalidatePath(`/quotations/${id}`);
  revalidatePath("/dashboard");
  return quotation;
}

export async function deleteQuotation(id: string) {
  await prisma.quotation.delete({ where: { id } });
  revalidatePath("/quotations");
  revalidatePath("/dashboard");
}
