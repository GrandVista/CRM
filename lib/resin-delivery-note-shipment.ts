import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** 送货单打印 / PDF 共用的发货记录查询（含关联订单与小订单明细） */
export const resinDeliveryNoteShipmentInclude = {
  resinOrder: true,
  items: { include: { purchaseOrder: true } },
} as const satisfies Prisma.ResinOrderShipmentInclude;

export type ResinDeliveryNoteShipmentWithOrder = Prisma.ResinOrderShipmentGetPayload<{
  include: typeof resinDeliveryNoteShipmentInclude;
}>;

export async function getResinDeliveryNoteShipmentWithOrder(
  shipmentId: string,
): Promise<ResinDeliveryNoteShipmentWithOrder | null> {
  return prisma.resinOrderShipment.findUnique({
    where: { id: shipmentId },
    include: resinDeliveryNoteShipmentInclude,
  });
}
