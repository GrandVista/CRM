"use server";

import { prisma } from "@/lib/prisma";
import { CONTRACT_ATTACHMENT_CATEGORY } from "@/lib/contract-attachment-constants";

export async function getContractAttachments(contractId: string, category?: string) {
  return prisma.contractAttachment.findMany({
    where: { contractId, ...(category ? { category } : {}) },
    orderBy: { uploadedAt: "desc" },
  });
}

export async function hasSignedContractAttachment(contractId: string): Promise<boolean> {
  const count = await prisma.contractAttachment.count({
    where: {
      contractId,
      category: CONTRACT_ATTACHMENT_CATEGORY.SIGNED_CONTRACT,
    },
  });
  return count > 0;
}

/** 获取合同已签署 PDF 附件（列表/详情用） */
export async function getSignedContractAttachment(contractId: string) {
  return prisma.contractAttachment.findFirst({
    where: {
      contractId,
      category: CONTRACT_ATTACHMENT_CATEGORY.SIGNED_CONTRACT,
    },
    orderBy: { uploadedAt: "desc" },
  });
}

export async function deleteContractAttachment(attachmentId: string) {
  const att = await prisma.contractAttachment.findUnique({
    where: { id: attachmentId },
    select: { id: true, contractId: true, fileUrl: true },
  });
  if (!att) throw new Error("附件不存在");
  await prisma.contractAttachment.delete({ where: { id: attachmentId } });
  return { fileUrl: att.fileUrl };
}
