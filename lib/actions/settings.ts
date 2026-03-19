"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type CompanyProfileInput = {
  companyName?: string | null;
  companyAddress?: string | null;
  companyTel?: string | null;
  companyEmail?: string | null;
  companyFax?: string | null;
  companyBank?: string | null;
  companyAccount?: string | null;
  companySwift?: string | null;
};

export async function getCompanyProfile() {
  const row = await prisma.companyProfile.findFirst({ orderBy: { createdAt: "asc" } });
  return row;
}

function toNull(s: string | null | undefined): string | null {
  if (s == null) return null;
  const t = String(s).trim();
  return t === "" ? null : t;
}

export async function updateCompanyProfile(data: CompanyProfileInput) {
  const existing = await prisma.companyProfile.findFirst({ orderBy: { createdAt: "asc" } });
  const payload = {
    companyName: toNull(data.companyName ?? undefined),
    companyAddress: toNull(data.companyAddress ?? undefined),
    companyTel: toNull(data.companyTel ?? undefined),
    companyEmail: toNull(data.companyEmail ?? undefined),
    companyFax: toNull(data.companyFax ?? undefined),
    companyBank: toNull(data.companyBank ?? undefined),
    companyAccount: toNull(data.companyAccount ?? undefined),
    companySwift: toNull(data.companySwift ?? undefined),
  };
  if (existing) {
    await prisma.companyProfile.update({
      where: { id: existing.id },
      data: payload,
    });
  } else {
    await prisma.companyProfile.create({
      data: payload,
    });
  }
  revalidatePath("/settings");
  return { ok: true };
}
