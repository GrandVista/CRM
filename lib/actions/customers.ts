"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CustomerStatus } from "@prisma/client";

export type CustomerFormData = {
  customerCode: string;
  nameCn?: string;
  nameEn?: string;
  shortName?: string;
  country?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxNo?: string;
  contactPerson?: string;
  contactTitle?: string;
  defaultCurrency?: string;
  defaultPaymentTerm?: string;
  defaultIncoterm?: string;
  defaultPortOfShipment?: string;
  defaultPortOfDestination?: string;
  defaultInsuranceTerm?: string;
  defaultPackingTerm?: string;
  defaultDocumentRequirement?: string;
  customerLevel?: string;
  status?: string;
  remark?: string;
};

export async function getCustomers(params?: { search?: string; status?: string }) {
  const where: Record<string, unknown> = {};
  if (params?.search) {
    where.OR = [
      { customerCode: { contains: params.search, mode: "insensitive" } },
      { nameCn: { contains: params.search, mode: "insensitive" } },
      { nameEn: { contains: params.search, mode: "insensitive" } },
      { shortName: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params?.status) {
    where.status = params.status as CustomerStatus;
  }
  return prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { quotations: true, contracts: true, payments: true } },
    },
  });
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      quotations: { take: 10, orderBy: { createdAt: "desc" } },
      contracts: { take: 10, orderBy: { createdAt: "desc" } },
      payments: { take: 10, orderBy: { paymentDate: "desc" } },
    },
  });
}

export async function createCustomer(data: CustomerFormData) {
  const customer = await prisma.customer.create({
    data: {
      customerCode: data.customerCode,
      nameCn: data.nameCn ?? null,
      nameEn: data.nameEn ?? null,
      shortName: data.shortName ?? null,
      country: data.country ?? null,
      city: data.city ?? null,
      address: data.address ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      website: data.website ?? null,
      taxNo: data.taxNo ?? null,
      contactPerson: data.contactPerson ?? null,
      contactTitle: data.contactTitle ?? null,
      defaultCurrency: data.defaultCurrency ?? "USD",
      defaultPaymentTerm: data.defaultPaymentTerm ?? null,
      defaultIncoterm: data.defaultIncoterm ?? null,
      defaultPortOfShipment: data.defaultPortOfShipment ?? null,
      defaultPortOfDestination: data.defaultPortOfDestination ?? null,
      defaultInsuranceTerm: data.defaultInsuranceTerm ?? null,
      defaultPackingTerm: data.defaultPackingTerm ?? null,
      defaultDocumentRequirement: data.defaultDocumentRequirement ?? null,
      customerLevel: data.customerLevel ?? null,
      status: (data.status as CustomerStatus) ?? "ACTIVE",
      remark: data.remark ?? null,
    },
  });
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  return customer;
}

export async function updateCustomer(id: string, data: CustomerFormData) {
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      customerCode: data.customerCode,
      nameCn: data.nameCn ?? null,
      nameEn: data.nameEn ?? null,
      shortName: data.shortName ?? null,
      country: data.country ?? null,
      city: data.city ?? null,
      address: data.address ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      website: data.website ?? null,
      taxNo: data.taxNo ?? null,
      contactPerson: data.contactPerson ?? null,
      contactTitle: data.contactTitle ?? null,
      defaultCurrency: data.defaultCurrency ?? "USD",
      defaultPaymentTerm: data.defaultPaymentTerm ?? null,
      defaultIncoterm: data.defaultIncoterm ?? null,
      defaultPortOfShipment: data.defaultPortOfShipment ?? null,
      defaultPortOfDestination: data.defaultPortOfDestination ?? null,
      defaultInsuranceTerm: data.defaultInsuranceTerm ?? null,
      defaultPackingTerm: data.defaultPackingTerm ?? null,
      defaultDocumentRequirement: data.defaultDocumentRequirement ?? null,
      customerLevel: data.customerLevel ?? null,
      status: (data.status as CustomerStatus) ?? "ACTIVE",
      remark: data.remark ?? null,
    },
  });
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  revalidatePath(`/customers/${id}/edit`);
  revalidatePath("/dashboard");
  return customer;
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/customers");
  revalidatePath("/dashboard");
}
