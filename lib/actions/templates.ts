"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { TemplateType } from "@prisma/client";
import { TEMPLATE_TYPES } from "@/lib/template-utils";

export type { TemplateType };

export async function getTemplates(params?: { templateType?: TemplateType; activeOnly?: boolean }) {
  const where: { templateType?: TemplateType; isActive?: boolean } = {};
  if (params?.templateType) where.templateType = params.templateType;
  if (params?.activeOnly !== false) where.isActive = true;
  return prisma.documentTemplate.findMany({
    where,
    orderBy: [{ templateType: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getTemplatesGroupedByType() {
  const list = await prisma.documentTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ templateType: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  const grouped: Record<TemplateType, typeof list> = {} as Record<TemplateType, typeof list>;
  for (const t of TEMPLATE_TYPES) {
    grouped[t] = list.filter((x) => x.templateType === t);
  }
  return grouped;
}

/** Default template content per type (for new contracts when contract has no value). */
export async function getDefaultTemplateContents(): Promise<Partial<Record<TemplateType, string>>> {
  const defaults = await prisma.documentTemplate.findMany({
    where: { isActive: true, isDefault: true },
    select: { templateType: true, content: true },
  });
  const map: Partial<Record<TemplateType, string>> = {};
  for (const d of defaults) {
    map[d.templateType] = d.content ?? "";
  }
  return map;
}

export async function createTemplate(data: {
  name: string;
  templateType: TemplateType;
  content?: string | null;
  isDefault?: boolean;
  sortOrder?: number;
}) {
  const created = await prisma.documentTemplate.create({
    data: {
      name: data.name,
      templateType: data.templateType,
      content: data.content ?? null,
      isDefault: data.isDefault ?? false,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
    },
  });
  revalidatePath("/settings/templates");
  revalidatePath("/contracts/new");
  return created;
}

export async function updateTemplate(
  id: string,
  data: {
    name?: string;
    content?: string | null;
    isDefault?: boolean;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  await prisma.documentTemplate.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
  revalidatePath("/settings/templates");
  revalidatePath("/contracts/new");
}

export async function deleteTemplate(id: string) {
  await prisma.documentTemplate.delete({ where: { id } });
  revalidatePath("/settings/templates");
  revalidatePath("/contracts/new");
}

export async function setDefaultTemplate(id: string) {
  const template = await prisma.documentTemplate.findUnique({ where: { id }, select: { templateType: true } });
  if (!template) return;
  await prisma.$transaction([
    prisma.documentTemplate.updateMany({
      where: { templateType: template.templateType },
      data: { isDefault: false },
    }),
    prisma.documentTemplate.update({
      where: { id },
      data: { isDefault: true },
    }),
  ]);
  revalidatePath("/settings/templates");
  revalidatePath("/contracts/new");
}
