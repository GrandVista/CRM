"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateDocNo } from "@/lib/doc-no";
import { getCustomerDisplayName } from "@/lib/utils";
import { markClTodoDoneByContractId } from "@/lib/actions/document-todos";

async function getLastClNo(prefix: string): Promise<string | null> {
  const r = await prisma.packingList.findFirst({
    where: { clNo: { startsWith: prefix } },
    orderBy: { clNo: "desc" },
    select: { clNo: true },
  });
  return r?.clNo ?? null;
}

export type PackingListItemInput = {
  productId?: string;
  productName: string;
  specification?: string;
  contractNetWeightKg: number;
  actualNetWeightKg: number;
  contractRollQty: number;
  actualRollQty: number;
  palletQty?: number;
  grossWeightKg?: number;
  cbm?: number;
  remark?: string;
  sortOrder: number;
};

export type PackingListFormData = {
  documentDate?: string;
  invoiceNo?: string;
  buyerName?: string;
  buyerAddress?: string;
  paymentTerm?: string;
  lcNo?: string;
  tradeTerm?: string;
  packingTerm?: string;
  fromPort?: string;
  destinationPort?: string;
  vesselVoyageNo?: string;
  departureDate?: string;
  containerNo?: string;
  sealNo?: string;
  totalPallets?: number;
  totalRolls?: number;
  totalNetWeight?: number;
  totalGrossWeight?: number;
  totalCbm?: number;
  shippingMarks?: string;
  remark?: string;
  items: PackingListItemInput[];
};

/** 从合同生成 Packing List（数据快照：仅复制合同数据，不引用 ContractItem） */
export async function createPackingListFromContract(contractId: string) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!contract) throw new Error("合同不存在");

  const clNo = await generateDocNo("cl", getLastClNo);
  const documentDate = new Date();

  const items = contract.items.map((item, idx) => {
    const contractNet = item.quantityKg ?? 0;
    const contractRolls = item.rollQty ?? 0;
    const parts: string[] = [];
    if (item.thickness) parts.push(`${item.thickness}um`);
    if (item.width) parts.push(`${item.width}mm`);
    if (item.length) parts.push(`${item.length}M`);
    const specification = parts.length > 0 ? parts.join("*") : undefined;
    return {
      productId: item.productId ?? undefined,
      productName: item.productName,
      specification: specification || undefined,
      contractNetWeightKg: contractNet,
      actualNetWeightKg: contractNet,
      contractRollQty: contractRolls,
      actualRollQty: contractRolls,
      palletQty: undefined as number | undefined,
      grossWeightKg: undefined as number | undefined,
      cbm: undefined as number | undefined,
      remark: item.remark ?? null,
      sortOrder: idx,
    };
  });

  const totalRolls = items.reduce((s, i) => s + i.actualRollQty, 0);
  const totalNetWeight = items.reduce((s, i) => s + i.actualNetWeightKg, 0);

  const pl = await prisma.packingList.create({
    data: {
      clNo,
      contractId: contract.id,
      customerId: contract.customerId,
      documentDate,
      buyerName: getCustomerDisplayName(contract.customer) || undefined,
      buyerAddress: contract.customer.address ?? undefined,
      paymentMethod: contract.paymentMethod ?? null,
      lcNo: null,
      paymentTerm: contract.paymentTerm ?? undefined,
      tradeTerm: contract.incoterm ?? undefined,
      packingTerm: contract.packingTerm ?? undefined,
      fromPort: contract.portOfShipment ?? undefined,
      destinationPort: contract.portOfDestination ?? undefined,
      totalRolls,
      totalNetWeight,
      totalGrossWeight: totalNetWeight,
      netWeight: totalNetWeight,
      grossWeight: totalNetWeight,
      items: {
        create: items.map((i) => ({
          productId: i.productId || null,
          productName: i.productName,
          specification: i.specification ?? null,
          contractNetWeightKg: i.contractNetWeightKg,
          actualNetWeightKg: i.actualNetWeightKg,
          contractRollQty: i.contractRollQty,
          actualRollQty: i.actualRollQty,
          palletQty: i.palletQty ?? null,
          grossWeightKg: i.grossWeightKg ?? null,
          cbm: i.cbm ?? null,
          remark: i.remark ?? null,
          sortOrder: i.sortOrder,
        })),
      },
    },
    include: { items: true, customer: true, contract: { select: { contractNo: true } } },
  });

  await markClTodoDoneByContractId(contractId);
  revalidatePath("/cl");
  revalidatePath(`/contracts/${contractId}`);
  return pl;
}

export async function getPackingLists() {
  return prisma.packingList.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      contract: { select: { contractNo: true } },
      customer: { select: { shortName: true, nameEn: true, nameCn: true } },
    },
  });
}

export async function getPackingListById(id: string) {
  return prisma.packingList.findUnique({
    where: { id },
    include: {
      contract: { select: { id: true, contractNo: true } },
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function updatePackingList(id: string, data: PackingListFormData) {
  const totalRolls = data.items.reduce((s, i) => s + i.actualRollQty, 0);
  const totalNetWeight = data.items.reduce((s, i) => s + i.actualNetWeightKg, 0);

  await prisma.packingListItem.deleteMany({ where: { packingListId: id } });
  const updated = await prisma.packingList.update({
    where: { id },
    data: {
      documentDate: data.documentDate ? new Date(data.documentDate) : null,
      invoiceNo: data.invoiceNo ?? null,
      buyerName: data.buyerName ?? null,
      buyerAddress: data.buyerAddress ?? null,
      paymentTerm: data.paymentTerm ?? null,
      lcNo: data.lcNo ?? null,
      tradeTerm: data.tradeTerm ?? null,
      packingTerm: data.packingTerm ?? null,
      fromPort: data.fromPort ?? null,
      destinationPort: data.destinationPort ?? null,
      vesselVoyageNo: data.vesselVoyageNo ?? null,
      departureDate: data.departureDate ? new Date(data.departureDate) : null,
      containerNo: data.containerNo ?? null,
      sealNo: data.sealNo ?? null,
      totalPallets: data.totalPallets ?? null,
      totalRolls,
      totalNetWeight: data.totalNetWeight ?? totalNetWeight,
      totalGrossWeight: data.totalGrossWeight ?? null,
      totalCbm: data.totalCbm ?? null,
      netWeight: data.totalNetWeight ?? totalNetWeight,
      grossWeight: data.totalGrossWeight ?? null,
      volume: data.totalCbm ?? null,
      shippingMarks: data.shippingMarks ?? null,
      remark: data.remark ?? null,
      items: {
        create: data.items.map((item, idx) => ({
          productId: item.productId || null,
          productName: item.productName,
          specification: item.specification ?? null,
          contractNetWeightKg: item.contractNetWeightKg,
          actualNetWeightKg: item.actualNetWeightKg,
          contractRollQty: item.contractRollQty,
          actualRollQty: item.actualRollQty,
          palletQty: item.palletQty ?? null,
          grossWeightKg: item.grossWeightKg ?? null,
          cbm: item.cbm ?? null,
          remark: item.remark ?? null,
          sortOrder: idx,
        })),
      },
    },
    include: { items: true, customer: true, contract: { select: { contractNo: true } } },
  });
  revalidatePath("/cl");
  revalidatePath(`/cl/${id}`);
  return updated;
}

/** 删除前校验：若已被出货等关联则拒绝删除；当前 schema 中 Shipment 无 packingListId，预留结构。 */
async function ensurePackingListCanDelete(): Promise<void> {
  // 若将来 Shipment 表增加 packingListId，在此处查询并拒绝删除，例如：
  // const shipments = await prisma.shipment.count({ where: { packingListId: id } });
  // if (shipments > 0) throw new Error("该 PL 已关联出货记录，不能删除。");
}

export async function deletePackingList(id: string) {
  await ensurePackingListCanDelete();
  const pl = await prisma.packingList.findUnique({
    where: { id },
    select: { contractId: true, contract: { select: { signStatus: true } } },
  });
  if (!pl) throw new Error("Packing List 不存在");
  await prisma.$transaction(async (tx) => {
    await tx.packingList.delete({ where: { id } });
    if (pl.contract.signStatus === "SIGNED") {
      await tx.documentTodo.upsert({
        where: { contractId_todoType: { contractId: pl.contractId, todoType: "CL" } },
        create: { contractId: pl.contractId, todoType: "CL", status: "PENDING" },
        update: { status: "PENDING" },
      });
    }
  });
  revalidatePath("/cl");
  revalidatePath(`/cl/${id}`);
  revalidatePath("/dashboard");
}
