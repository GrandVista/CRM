"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/** 合同签署变为 SIGNED 时，确保该合同存在 PI、CL 待办（不重复创建）。 */
export async function ensureDocumentTodosForSignedContract(contractId: string) {
  await prisma.documentTodo.upsert({
    where: {
      contractId_todoType: { contractId, todoType: "PI" },
    },
    create: { contractId, todoType: "PI", status: "PENDING" },
    update: {},
  });
  await prisma.documentTodo.upsert({
    where: {
      contractId_todoType: { contractId, todoType: "CL" },
    },
    create: { contractId, todoType: "CL", status: "PENDING" },
    update: {},
  });
  revalidatePath("/pi");
  revalidatePath("/cl");
}

/** 待处理 PI 待办（含合同、客户）。 */
export async function getPendingPiTodos() {
  return prisma.documentTodo.findMany({
    where: { todoType: "PI", status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      contract: {
        select: {
          id: true,
          contractNo: true,
          contractDate: true,
          totalAmount: true,
          currency: true,
          customer: { select: { shortName: true, nameEn: true, nameCn: true } },
        },
      },
    },
  });
}

/** 待处理 CL 待办（含合同、客户）。 */
export async function getPendingClTodos() {
  return prisma.documentTodo.findMany({
    where: { todoType: "CL", status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      contract: {
        select: {
          id: true,
          contractNo: true,
          contractDate: true,
          totalAmount: true,
          currency: true,
          customer: { select: { shortName: true, nameEn: true, nameCn: true } },
        },
      },
    },
  });
}

/** 将待办标记为完成。 */
export async function completeDocumentTodo(id: string) {
  await prisma.documentTodo.update({
    where: { id },
    data: { status: "DONE" },
  });
  revalidatePath("/pi");
  revalidatePath("/cl");
}

/** 合同已生成 PI 时调用，将对应 PI 待办标为 DONE。 */
export async function markPiTodoDoneByContractId(contractId: string) {
  await prisma.documentTodo.updateMany({
    where: { contractId, todoType: "PI" },
    data: { status: "DONE" },
  });
  revalidatePath("/pi");
  revalidatePath("/cl");
}

/** 合同已生成 CL 时调用，将对应 CL 待办标为 DONE。 */
export async function markClTodoDoneByContractId(contractId: string) {
  await prisma.documentTodo.updateMany({
    where: { contractId, todoType: "CL" },
    data: { status: "DONE" },
  });
  revalidatePath("/pi");
  revalidatePath("/cl");
}
