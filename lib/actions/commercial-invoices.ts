"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateDocNo } from "@/lib/doc-no";
import { amountToWords } from "@/lib/utils/number-to-words";
import { getCustomerDisplayName } from "@/lib/utils";
import { markPiTodoDoneByContractId } from "@/lib/actions/document-todos";

async function getLastInvoiceNo(prefix: string): Promise<string | null> {
  const r = await prisma.commercialInvoice.findFirst({
    where: { invoiceNo: { startsWith: prefix } },
    orderBy: { invoiceNo: "desc" },
    select: { invoiceNo: true },
  });
  return r?.invoiceNo ?? null;
}

export type CommercialInvoiceItemInput = {
  productId?: string;
  productName: string;
  specification?: string;
  contractQuantityKg: number;
  actualQuantityKg: number;
  contractRollQty: number;
  actualRollQty: number;
  unitPrice: number;
  amount: number;
  hsCode?: string;
  remark?: string;
  sortOrder: number;
};

export type CommercialInvoiceFormData = {
  invoiceDate: string;
  buyerName?: string;
  buyerAddress?: string;
  paymentTerm?: string;
  paymentMethod?: string | null;
  depositRatio?: number | null;
  lcNo?: string;
  tradeTerm?: string;
  packingTerm?: string;
  fromPort?: string;
  destinationPort?: string;
  vesselVoyageNo?: string;
  departureDate?: string;
  depositDeduction?: number;
  shippingMarks?: string;
  currency: string;
  remark?: string;
  items: CommercialInvoiceItemInput[];
};

/** 从合同生成 Commercial Invoice（数据快照：仅复制合同数据，不引用 ContractItem） */
export async function createCommercialInvoiceFromContract(contractId: string) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!contract) throw new Error("合同不存在");

  const invoiceNo = await generateDocNo("ci", getLastInvoiceNo);
  const invoiceDate = new Date();

  const items = contract.items.map((item, idx) => {
    const contractQtyKg = item.quantityKg ?? 0;
    const contractRolls = item.rollQty ?? 0;
    const unitPrice = item.unitPrice ?? 0;
    const parts: string[] = [];
    if (item.thickness) parts.push(`${item.thickness}um`);
    if (item.width) parts.push(`${item.width}mm`);
    if (item.length) parts.push(`${item.length}M`);
    const specification = parts.length > 0 ? parts.join("*") : undefined;
    return {
      productId: item.productId ?? undefined,
      productName: item.productName,
      specification: specification || undefined,
      contractQuantityKg: contractQtyKg,
      actualQuantityKg: contractQtyKg,
      contractRollQty: contractRolls,
      actualRollQty: contractRolls,
      unitPrice,
      amount: Math.round(contractQtyKg * unitPrice * 100) / 100,
      hsCode: null,
      remark: item.remark ?? null,
      sortOrder: idx,
    };
  });

  const totalAmount = items.reduce((s, i) => s + i.amount, 0);
  const totalAmountInWords = amountToWords(totalAmount, contract.currency);

  const paymentMethod = contract.paymentMethod ?? undefined;
  const depositRatio = contract.depositRatio ?? undefined;
  let depositAmount: number | undefined;
  let balanceAmount: number | undefined;
  let balanceAmountInWords: string | undefined;
  if (paymentMethod === "TT" && depositRatio != null) {
    depositAmount = Math.round(totalAmount * (depositRatio / 100) * 100) / 100;
    balanceAmount = Math.round((totalAmount - depositAmount) * 100) / 100;
    balanceAmountInWords = amountToWords(balanceAmount, contract.currency);
  } else {
    balanceAmount = totalAmount;
    balanceAmountInWords = totalAmountInWords;
  }

  const ci = await prisma.commercialInvoice.create({
    data: {
      invoiceNo,
      invoiceDate,
      contractId: contract.id,
      customerId: contract.customerId,
      buyerName: getCustomerDisplayName(contract.customer) || undefined,
      buyerAddress: contract.customer.address ?? undefined,
      paymentMethod: paymentMethod ?? null,
      depositRatio: depositRatio ?? null,
      depositAmount: depositAmount ?? null,
      lcNo: null,
      paymentTerm: contract.paymentTerm ?? undefined,
      tradeTerm: contract.incoterm ?? undefined,
      packingTerm: contract.packingTerm ?? undefined,
      fromPort: contract.portOfShipment ?? undefined,
      destinationPort: contract.portOfDestination ?? undefined,
      totalAmount,
      totalAmountInWords,
      balanceAmount: balanceAmount ?? null,
      balanceAmountInWords: balanceAmountInWords ?? null,
      currency: contract.currency,
      items: {
        create: items.map((i) => ({
          productId: i.productId || null,
          productName: i.productName,
          specification: i.specification ?? null,
          contractQuantityKg: i.contractQuantityKg,
          actualQuantityKg: i.actualQuantityKg,
          contractRollQty: i.contractRollQty,
          actualRollQty: i.actualRollQty,
          unitPrice: i.unitPrice,
          amount: i.amount,
          hsCode: i.hsCode ?? null,
          remark: i.remark ?? null,
          sortOrder: i.sortOrder,
        })),
      },
    },
    include: { items: true, customer: true, contract: { select: { contractNo: true } } },
  });

  await markPiTodoDoneByContractId(contractId);
  revalidatePath("/commercial-invoices");
  revalidatePath("/pi");
  revalidatePath(`/contracts/${contractId}`);
  return ci;
}

export async function getCommercialInvoices() {
  return prisma.commercialInvoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { shortName: true, nameEn: true, nameCn: true } },
      contract: { select: { contractNo: true } },
    },
  });
}

export async function getCommercialInvoiceById(id: string) {
  return prisma.commercialInvoice.findUnique({
    where: { id },
    include: {
      customer: true,
      contract: { select: { id: true, contractNo: true, paymentMethod: true } },
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
}

function computeCiTotals(
  items: CommercialInvoiceItemInput[],
  paymentMethod: string | null | undefined,
  depositRatio: number | null | undefined
) {
  const totalAmount = Math.round(items.reduce((s, i) => s + i.amount, 0) * 100) / 100;
  let depositAmount: number | null = null;
  let balanceAmount: number = totalAmount;
  if (paymentMethod === "TT" && depositRatio != null) {
    depositAmount = Math.round(totalAmount * (depositRatio / 100) * 100) / 100;
    balanceAmount = Math.round((totalAmount - depositAmount) * 100) / 100;
  }
  return { totalAmount, depositAmount, balanceAmount };
}

export async function updateCommercialInvoice(id: string, data: CommercialInvoiceFormData) {
  if (data.paymentMethod === "LC" && !(data.lcNo?.trim())) {
    throw new Error("付款方式为 L/C 时，必须填写 L/C No.");
  }
  const { totalAmount, depositAmount, balanceAmount } = computeCiTotals(
    data.items,
    data.paymentMethod,
    data.depositRatio
  );
  const totalAmountInWords = amountToWords(totalAmount, data.currency);
  const balanceAmountInWords = amountToWords(Math.max(0, balanceAmount), data.currency);

  await prisma.commercialInvoiceItem.deleteMany({ where: { commercialInvoiceId: id } });
  const updated = await prisma.commercialInvoice.update({
    where: { id },
    data: {
      invoiceDate: new Date(data.invoiceDate),
      buyerName: data.buyerName ?? null,
      buyerAddress: data.buyerAddress ?? null,
      paymentTerm: data.paymentTerm ?? null,
      paymentMethod: (data.paymentMethod as "TT" | "LC") ?? null,
      depositRatio: data.depositRatio ?? null,
      depositAmount: depositAmount ?? null,
      depositDeduction: depositAmount ?? 0,
      lcNo: data.lcNo ?? null,
      tradeTerm: data.tradeTerm ?? null,
      packingTerm: data.packingTerm ?? null,
      fromPort: data.fromPort ?? null,
      destinationPort: data.destinationPort ?? null,
      vesselVoyageNo: data.vesselVoyageNo ?? null,
      departureDate: data.departureDate ? new Date(data.departureDate) : null,
      totalAmount,
      totalAmountInWords,
      balanceAmount,
      balanceAmountInWords,
      shippingMarks: data.shippingMarks ?? null,
      currency: data.currency,
      remark: data.remark ?? null,
      items: {
        create: data.items.map((item, idx) => ({
          productId: item.productId || null,
          productName: item.productName,
          specification: item.specification ?? null,
          contractQuantityKg: item.contractQuantityKg,
          actualQuantityKg: item.actualQuantityKg,
          contractRollQty: item.contractRollQty,
          actualRollQty: item.actualRollQty,
          unitPrice: item.unitPrice,
          amount: item.amount,
          hsCode: item.hsCode ?? null,
          remark: item.remark ?? null,
          sortOrder: idx,
        })),
      },
    },
    include: { items: true, customer: true, contract: { select: { contractNo: true } } },
  });
  revalidatePath("/commercial-invoices");
  revalidatePath(`/commercial-invoices/${id}`);
  return updated;
}

/** 删除前校验：若已关联后续关键流程（如收款关联 CI）则拒绝删除；当前 schema 无 Payment->CI 关联，预留结构。 */
async function ensureCommercialInvoiceCanDelete(): Promise<void> {
  // 若将来 Payment 表增加 commercialInvoiceId，在此处查询并拒绝删除，例如：
  // const payments = await prisma.payment.count({ where: { commercialInvoiceId: id } });
  // if (payments > 0) throw new Error("该 CI 已关联收款记录，不能删除。");
}

export async function deleteCommercialInvoice(id: string) {
  await ensureCommercialInvoiceCanDelete();
  const ci = await prisma.commercialInvoice.findUnique({
    where: { id },
    select: { contractId: true, contract: { select: { signStatus: true } } },
  });
  if (!ci) throw new Error("Commercial Invoice 不存在");
  await prisma.$transaction(async (tx) => {
    await tx.commercialInvoice.delete({ where: { id } });
    if (ci.contract.signStatus === "SIGNED") {
      await tx.documentTodo.upsert({
        where: { contractId_todoType: { contractId: ci.contractId, todoType: "PI" } },
        create: { contractId: ci.contractId, todoType: "PI", status: "PENDING" },
        update: { status: "PENDING" },
      });
    }
  });
  revalidatePath("/commercial-invoices");
  revalidatePath(`/commercial-invoices/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/pi");
}
