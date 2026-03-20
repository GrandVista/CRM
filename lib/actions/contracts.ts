"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { sumAmounts, sumWeights, sumRolls } from "@/lib/numbers";
import { ensureDocumentTodosForSignedContract } from "@/lib/actions/document-todos";
import { hasSignedContractAttachment } from "@/lib/actions/contract-attachments";
import { getCurrentAuthUser } from "@/lib/server-auth";
import type { SignStatus, ExecutionStatus, AllowOption, PaymentMethod, ContractType } from "@prisma/client";

function isUniqueConstraintError(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

/** 合同编号格式 YYMMDD-AAXX；RESIN 类型加前缀 R 即 R260318-TT01。客户缩写为空时抛出。仅用于非并发场景或展示；创建合同请用 createContract 内事务生成。 */
export async function generateContractNo(customerId: string, contractType: ContractType = "FILM"): Promise<string> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { shortName: true },
  });
  if (!customer) throw new Error("客户不存在");
  const AA = customer.shortName?.trim() ?? "";
  if (!AA) throw new Error("请先在客户资料中填写客户缩写。");

  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const YYMMDD = `${yy}${mm}${dd}`;

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const count = await prisma.contract.count({
    where: {
      customerId,
      createdAt: { gte: startOfDay, lt: endOfDay },
    },
  });
  const XX = String(count + 1).padStart(2, "0");
  const baseNo = `${YYMMDD}-${AA}${XX}`;
  return contractType === "RESIN" ? `R${baseNo}` : baseNo;
}

export type ContractItemInput = {
  productId?: string;
  productName: string;
  category?: string;
  thickness?: string;
  width?: string;
  length?: string;
  unitPrice: number;
  rollQty: number;
  quantityKg: number;
  actualQty?: number;
  confirmedQty?: number;
  amount: number;
  remark?: string;
  sortOrder: number;
};

export type ContractFormData = {
  customerId: string;
  contractNo?: string;
  contractType: ContractType;
  contractDate: string;
  quotationId?: string;
  piId?: string;
  currency: string;
  incoterm?: string;
  paymentMethod?: PaymentMethod | null;
  depositRatio?: number | null;
  paymentTerm?: string;
  portOfShipment?: string;
  portOfDestination?: string;
  partialShipment?: AllowOption;
  transhipment?: AllowOption;
  estimatedShipmentDate?: string;
  packingTerm?: string;
  insuranceTerm?: string;
  documentRequirement?: string;
  bankInfo?: string;
  moreOrLessPercent?: number | null;
  remark?: string;
  signStatus: SignStatus;
  executionStatus: ExecutionStatus;
  items: ContractItemInput[];
};

export async function getContracts(params?: {
  search?: string;
  signStatus?: string;
  executionStatus?: string;
}) {
  const where: Record<string, unknown> = {};
  if (params?.search) {
    where.OR = [
      { contractNo: { contains: params.search, mode: "insensitive" } },
      { customer: { nameEn: { contains: params.search, mode: "insensitive" } } },
      { customer: { nameCn: { contains: params.search, mode: "insensitive" } } },
      { customer: { shortName: { contains: params.search, mode: "insensitive" } } },
    ];
  }
  if (params?.signStatus) {
    where.signStatus = params.signStatus as SignStatus;
  }
  if (params?.executionStatus) {
    where.executionStatus = params.executionStatus as ExecutionStatus;
  }
  return prisma.contract.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, customerCode: true, nameEn: true, nameCn: true, shortName: true } },
      attachments: {
        where: { category: "SIGNED_CONTRACT" },
        select: { id: true, fileName: true, fileUrl: true },
      },
      _count: {
        select: {
          commercialInvoices: true,
          packingLists: true,
          shipments: true,
          payments: true,
        },
      },
    },
  });
}

export async function getContractById(id: string) {
  return prisma.contract.findUnique({
    where: { id },
    include: {
      customer: true,
      quotation: { select: { id: true, quotationNo: true } },
      pi: { select: { id: true, piNo: true } },
      items: { include: { product: true }, orderBy: { sortOrder: "asc" } },
      shipments: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { paymentDate: "desc" } },
      logs: { orderBy: { createdAt: "desc" } },
      attachments: { orderBy: { uploadedAt: "desc" } },
    },
  });
}

async function createContractLog(
  contractId: string,
  actionType: string,
  content: string | null,
  operator?: string | null
) {
  await prisma.contractLog.create({
    data: { contractId, actionType, content, operator },
  });
}

export async function createContract(data: ContractFormData) {
  if (data.signStatus === "SIGNED") {
    throw new Error("新建合同时请先选择未签署，保存后在编辑页上传已签署合同 PDF 并改为已签署。");
  }
  const totalAmount = sumAmounts(data.items.map((i) => i.amount));
  const totalWeight = sumWeights(data.items.map((i) => i.quantityKg));
  const totalRolls = sumRolls(data.items.map((i) => i.rollQty));

  const itemsCreate: Prisma.ContractItemCreateWithoutContractInput[] = data.items.map((item, idx) => ({
    productId: item.productId || null,
    productName: item.productName,
    category: item.category ?? null,
    thickness: item.thickness ?? null,
    width: item.width ?? null,
    length: item.length ?? null,
    unitPrice: item.unitPrice,
    rollQty: item.rollQty,
    quantityKg: item.quantityKg,
    actualQty: item.actualQty ?? 0,
    confirmedQty: item.confirmedQty ?? 0,
    amount: item.amount,
    remark: item.remark ?? null,
    sortOrder: item.sortOrder ?? idx,
  }));

  const contractType = data.contractType ?? "FILM";
  const baseData = {
    contractType,
    contractDate: new Date(data.contractDate),
    customerId: data.customerId,
    quotationId: data.quotationId || null,
    piId: data.piId || null,
    currency: data.currency,
    incoterm: data.incoterm ?? null,
    paymentMethod: data.paymentMethod ?? null,
    depositRatio: data.depositRatio ?? null,
    paymentTerm: data.paymentTerm ?? null,
    portOfShipment: data.portOfShipment ?? null,
    portOfDestination: data.portOfDestination ?? null,
    partialShipment: data.partialShipment ?? "ALLOWED",
    transhipment: data.transhipment ?? "ALLOWED",
    estimatedShipmentDate: data.estimatedShipmentDate ?? null,
    packingTerm: data.packingTerm ?? null,
    insuranceTerm: data.insuranceTerm ?? null,
    documentRequirement: data.documentRequirement ?? null,
    bankInfo: data.bankInfo ?? null,
    moreOrLessPercent: data.moreOrLessPercent ?? null,
    remark: data.remark ?? null,
    signStatus: data.signStatus,
    executionStatus: data.executionStatus,
    totalAmount,
    totalWeight,
    totalRolls,
    items: { create: itemsCreate },
  };

  let contract: Awaited<ReturnType<typeof prisma.contract.create>> & {
    customer: unknown;
    items: unknown[];
  };

  if (data.contractNo?.trim()) {
    const contractNo = data.contractNo.trim();
    const existing = await prisma.contract.findUnique({
      where: { contractNo },
      select: { id: true },
    });
    if (existing) throw new Error("该合同编号已存在，请更换或留空以自动生成。");
    contract = await prisma.contract.create({
      data: { contractNo, ...baseData },
      include: { customer: true, items: { include: { product: true } } },
    });
    await createContractLog(contract.id, "CREATE", `合同创建，初始状态：签署 ${data.signStatus}，执行 ${data.executionStatus}`);
  } else {
    // 不用 interactive transaction，避免 Supabase pooler 下 "Transaction not found"。
    // 合同号在事务外计算；单次 create（含嵌套 items）；日志单独写入；唯一约束冲突时重试。
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
      select: { shortName: true },
    });
    if (!customer) throw new Error("客户不存在");
    const AA = customer.shortName?.trim() ?? "";
    if (!AA) throw new Error("请先在客户资料中填写客户缩写。");

    const maxRetries = 3;
    let lastError: unknown;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const YYMMDD = `${yy}${mm}${dd}`;
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const count = await prisma.contract.count({
          where: {
            customerId: data.customerId,
            createdAt: { gte: startOfDay, lt: endOfDay },
          },
        });
        const XX = String(count + 1).padStart(2, "0");
        const baseNo = `${YYMMDD}-${AA}${XX}`;
        const contractNo = contractType === "RESIN" ? `R${baseNo}` : baseNo;

        contract = await prisma.contract.create({
          data: { contractNo, ...baseData },
          include: { customer: true, items: { include: { product: true } } },
        });

        await createContractLog(contract.id, "CREATE", `合同创建，初始状态：签署 ${data.signStatus}，执行 ${data.executionStatus}`);
        lastError = undefined;
        break;
      } catch (e) {
        lastError = e;
        if (isUniqueConstraintError(e)) continue;
        throw e;
      }
    }
    if (lastError !== undefined) throw lastError;
  }

  revalidatePath("/contracts");
  revalidatePath("/dashboard");
  return contract!;
}

export async function updateContract(id: string, data: ContractFormData) {
  const totalAmount = sumAmounts(data.items.map((i) => i.amount));
  const totalWeight = sumWeights(data.items.map((i) => i.quantityKg));
  const totalRolls = sumRolls(data.items.map((i) => i.rollQty));

  const existing = await prisma.contract.findUnique({
    where: { id },
    select: { signStatus: true, executionStatus: true },
  });
  if (!existing) throw new Error("Contract not found");

  if (data.signStatus === "SIGNED") {
    const hasSigned = await hasSignedContractAttachment(id);
    if (!hasSigned) {
      throw new Error("合同状态为已签署时，必须上传已签署合同 PDF");
    }
  }

  await prisma.contractItem.deleteMany({ where: { contractId: id } });

  const contractType = data.contractType ?? "FILM";
  const contract = await prisma.contract.update({
    where: { id },
    data: {
      contractType,
      contractDate: new Date(data.contractDate),
      customerId: data.customerId,
      quotationId: data.quotationId || null,
      piId: data.piId || null,
      currency: data.currency,
      incoterm: data.incoterm ?? null,
      paymentMethod: data.paymentMethod ?? null,
      depositRatio: data.depositRatio ?? null,
      paymentTerm: data.paymentTerm ?? null,
      portOfShipment: data.portOfShipment ?? null,
      portOfDestination: data.portOfDestination ?? null,
      partialShipment: data.partialShipment ?? "ALLOWED",
      transhipment: data.transhipment ?? "ALLOWED",
      estimatedShipmentDate: data.estimatedShipmentDate ?? null,
      packingTerm: data.packingTerm ?? null,
      insuranceTerm: data.insuranceTerm ?? null,
      documentRequirement: data.documentRequirement ?? null,
      bankInfo: data.bankInfo ?? null,
      moreOrLessPercent: data.moreOrLessPercent ?? null,
      remark: data.remark ?? null,
      signStatus: data.signStatus,
      executionStatus: data.executionStatus,
      totalAmount,
      totalWeight,
      totalRolls,
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
          actualQty: item.actualQty ?? 0,
          confirmedQty: item.confirmedQty ?? 0,
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

  if (existing.signStatus !== data.signStatus) {
    await createContractLog(id, "SIGN_STATUS", `签署状态变更：${existing.signStatus} → ${data.signStatus}`);
    if (existing.signStatus === "UNSIGNED" && data.signStatus === "SIGNED") {
      await ensureDocumentTodosForSignedContract(id);
    }
  }
  if (existing.executionStatus !== data.executionStatus) {
    await createContractLog(id, "EXECUTION_STATUS", `执行状态变更：${existing.executionStatus} → ${data.executionStatus}`);
  }

  revalidatePath("/contracts");
  revalidatePath(`/contracts/${id}`);
  revalidatePath("/dashboard");
  return contract;
}

export async function updateContractStatus(
  id: string,
  updates: { signStatus?: SignStatus; executionStatus?: ExecutionStatus }
) {
  const existing = await prisma.contract.findUnique({
    where: { id },
    select: { signStatus: true, executionStatus: true },
  });
  if (!existing) throw new Error("Contract not found");

  const nextSign = updates.signStatus ?? existing.signStatus;
  const nextExec = updates.executionStatus ?? existing.executionStatus;

  if (nextSign === "SIGNED") {
    const hasSigned = await hasSignedContractAttachment(id);
    if (!hasSigned) {
      throw new Error("合同状态为已签署时，必须上传已签署合同 PDF");
    }
  }

  await prisma.contract.update({
    where: { id },
    data: { signStatus: nextSign, executionStatus: nextExec },
  });

  if (updates.signStatus != null && updates.signStatus !== existing.signStatus) {
    await createContractLog(id, "SIGN_STATUS", `签署状态变更：${existing.signStatus} → ${updates.signStatus}`);
    if (existing.signStatus === "UNSIGNED" && updates.signStatus === "SIGNED") {
      await ensureDocumentTodosForSignedContract(id);
    }
  }
  if (updates.executionStatus != null && updates.executionStatus !== existing.executionStatus) {
    await createContractLog(id, "EXECUTION_STATUS", `执行状态变更：${existing.executionStatus} → ${updates.executionStatus}`);
  }

  revalidatePath("/contracts");
  revalidatePath(`/contracts/${id}`);
  revalidatePath("/dashboard");
}

export async function duplicateContract(contractId: string) {
  const old = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (!old) throw new Error("合同不存在");

  const customer = await prisma.customer.findUnique({
    where: { id: old.customerId },
    select: { shortName: true },
  });
  if (!customer) throw new Error("客户不存在");
  const AA = customer.shortName?.trim() ?? "";
  if (!AA) throw new Error("请先在客户资料中填写客户缩写。");

  const maxRetries = 3;
  let lastError: unknown;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const YYMMDD = `${yy}${mm}${dd}`;
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const count = await prisma.contract.count({
        where: {
          customerId: old.customerId,
          createdAt: { gte: startOfDay, lt: endOfDay },
        },
      });
      const XX = String(count + 1).padStart(2, "0");
      const baseNo = `${YYMMDD}-${AA}${XX}`;
      const contractNo = old.contractType === "RESIN" ? `R${baseNo}` : baseNo;

      const duplicated = await prisma.contract.create({
        data: {
          contractNo,
          contractType: old.contractType,
          contractDate: now,
          customerId: old.customerId,
          quotationId: old.quotationId,
          piId: null,
          currency: old.currency,
          incoterm: old.incoterm,
          paymentMethod: old.paymentMethod,
          depositRatio: old.depositRatio,
          paymentTerm: old.paymentTerm,
          portOfShipment: old.portOfShipment,
          portOfDestination: old.portOfDestination,
          partialShipment: old.partialShipment,
          transhipment: old.transhipment,
          estimatedShipmentDate: null,
          packingTerm: old.packingTerm,
          insuranceTerm: old.insuranceTerm,
          documentRequirement: old.documentRequirement,
          bankInfo: old.bankInfo,
          moreOrLessPercent: old.moreOrLessPercent,
          remark: old.remark,
          signStatus: old.signStatus,
          executionStatus: old.executionStatus,
          totalAmount: 0,
          totalWeight: 0,
          totalRolls: 0,
        },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });

      await createContractLog(
        duplicated.id,
        "CREATE",
        `由合同 ${old.contractNo} 复制创建，未复制产品明细。`
      );
      revalidatePath("/contracts");
      revalidatePath(`/contracts/${duplicated.id}`);
      revalidatePath("/dashboard");
      return duplicated;
    } catch (e) {
      lastError = e;
      if (isUniqueConstraintError(e)) continue;
      throw e;
    }
  }
  if (lastError !== undefined) throw lastError;
  throw new Error("复制失败，请重试");
}

export async function forceDeleteContractByAdmin(contractId: string, operator: string) {
  const existing = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { id: true, contractNo: true },
  });
  if (!existing) throw new Error("合同不存在");

  const result = await prisma.$transaction(async (tx) => {
    const invoicesDeleted = await tx.commercialInvoice.deleteMany({
      where: { contractId },
    });
    const packingListsDeleted = await tx.packingList.deleteMany({
      where: { contractId },
    });
    const shipmentsDeleted = await tx.shipment.deleteMany({
      where: { contractId },
    });
    const paymentsDeleted = await tx.payment.deleteMany({
      where: { contractId },
    });

    await tx.contract.delete({
      where: { id: contractId },
    });

    return {
      invoicesDeleted: invoicesDeleted.count,
      packingListsDeleted: packingListsDeleted.count,
      shipmentsDeleted: shipmentsDeleted.count,
      paymentsDeleted: paymentsDeleted.count,
    };
  });

  // 当前系统无独立审计表，先做结构化审计日志输出。
  console.info("[force_delete_contract]", {
    operator,
    contractId: existing.id,
    contractNo: existing.contractNo,
    ...result,
    operatedAt: new Date().toISOString(),
  });

  revalidatePath("/contracts");
  revalidatePath("/dashboard");
  return {
    success: true,
    deletedContractId: existing.id,
    deletedRelationsSummary: result,
  };
}

/** 删除合同前校验：存在 CI / PL / 出货 / 收款 任一关联则不允许删除 */
export async function deleteContract(contractId: string) {
  const user = await getCurrentAuthUser();
  if (!user) throw new Error("未登录或 token 无效");

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      signStatus: true,
      commercialInvoices: { select: { id: true }, take: 1 },
      packingLists: { select: { id: true }, take: 1 },
      shipments: { select: { id: true }, take: 1 },
      payments: { select: { id: true }, take: 1 },
    },
  });
  if (!contract) throw new Error("合同不存在");

  const isArchived = contract.signStatus === "SIGNED";
  if (isArchived && user.role !== "admin") {
    throw new Error("已归档合同仅管理员可删除");
  }

  const reasons: string[] = [];
  if (contract.commercialInvoices.length > 0) reasons.push("CI（商业发票）");
  if (contract.packingLists.length > 0) reasons.push("PL（装箱单）");
  if (contract.shipments.length > 0) reasons.push("出货记录");
  if (contract.payments.length > 0) reasons.push("收款记录");
  if (reasons.length > 0) {
    throw new Error("该合同已关联业务数据，不能删除");
  }

  await prisma.contract.delete({ where: { id: contractId } });
  revalidatePath("/contracts");
  revalidatePath("/dashboard");
}

/** 根据报价单 ID 拉取用于合同表单的数据（客户、条款、明细） */
export async function getQuotationDataForContract(quotationId: string) {
  const q = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { customer: true, items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!q) return null;
  return {
    customerId: q.customerId,
    currency: q.currency,
    paymentTerm: q.paymentTerm ?? undefined,
    incoterm: q.incoterm ?? undefined,
    portOfShipment: q.customer?.defaultPortOfShipment ?? undefined,
    portOfDestination: q.customer?.defaultPortOfDestination ?? undefined,
    items: q.items.map((i) => ({
      productId: i.productId ?? undefined,
      productName: i.productName,
      category: i.category ?? undefined,
      thickness: i.thickness ?? undefined,
      width: i.width ?? undefined,
      length: i.length ?? undefined,
      unitPrice: i.unitPrice,
      rollQty: i.rollQty,
      quantityKg: i.quantityKg,
      amount: i.amount,
      remark: i.remark ?? undefined,
      sortOrder: i.sortOrder,
    })),
  };
}
