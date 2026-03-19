"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateDocNo } from "@/lib/doc-no";

async function getLastShipmentNo(prefix: string): Promise<string | null> {
  const r = await prisma.shipment.findFirst({
    where: { shipmentNo: { startsWith: prefix } },
    orderBy: { shipmentNo: "desc" },
    select: { shipmentNo: true },
  });
  return r?.shipmentNo ?? null;
}

/** 待出货合同：已签署且尚未生成任何出货单（一合同一单） */
export async function getPendingShipmentContracts() {
  return prisma.contract.findMany({
    where: {
      signStatus: "SIGNED",
      shipments: { none: {} },
    },
    orderBy: { contractDate: "desc" },
    include: {
      customer: { select: { shortName: true, nameEn: true, nameCn: true } },
    },
  });
}

/** 出货记录列表 */
export async function getShipments() {
  return prisma.shipment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      contract: { select: { contractNo: true } },
      customer: { select: { shortName: true, nameEn: true, nameCn: true } },
    },
  });
}

/** 从已签署合同生成出货单（每个合同仅允许一个 shipment） */
export async function createShipmentFromContract(contractId: string) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { customer: true },
  });
  if (!contract) throw new Error("合同不存在");
  if (contract.signStatus !== "SIGNED") throw new Error("仅已签署合同可生成出货单");

  const existing = await prisma.shipment.findFirst({
    where: { contractId },
  });
  if (existing) throw new Error("该合同已有关联出货单，每个合同仅允许一个出货单");

  const shipmentNo = await generateDocNo("shipment", getLastShipmentNo);

  const shipment = await prisma.shipment.create({
    data: {
      shipmentNo,
      contractId: contract.id,
      customerId: contract.customerId,
      status: "BOOKED",
    },
    include: {
      contract: { select: { contractNo: true } },
      customer: { select: { shortName: true, nameEn: true, nameCn: true } },
    },
  });

  revalidatePath("/shipments");
  revalidatePath(`/contracts/${contractId}`);
  return shipment;
}

export type UpdateShipmentData = {
  vesselVoyage?: string | null;
  etd?: string | null; // ISO date string
  status?: "BOOKED" | "STUFFED" | "SAILED";
};

/** 更新出货单：仅允许更新船舶航号、ETD、状态 */
export async function updateShipment(shipmentId: string, data: UpdateShipmentData) {
  const existing = await prisma.shipment.findUnique({
    where: { id: shipmentId },
  });
  if (!existing) throw new Error("出货单不存在");

  await prisma.shipment.update({
    where: { id: shipmentId },
    data: {
      vesselVoyage: data.vesselVoyage !== undefined ? data.vesselVoyage : undefined,
      etd: data.etd !== undefined ? (data.etd ? new Date(data.etd) : null) : undefined,
      status: data.status !== undefined ? data.status : undefined,
    },
  });

  revalidatePath("/shipments");
}
