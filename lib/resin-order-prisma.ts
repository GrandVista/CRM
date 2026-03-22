import type { Prisma } from "@prisma/client";

/** `getResinOrderById` 完整返回 — 勿放在 `use server` 文件中（Next 仅允许导出 async 函数） */
export const resinOrderByIdInclude = {
  customer: true,
  purchaseOrders: { orderBy: { orderDate: "desc" as const } },
  shipments: {
    orderBy: { shipmentDate: "desc" as const },
    include: { items: { include: { purchaseOrder: true } } },
  },
  payments: {
    orderBy: { paymentDate: "desc" as const },
    include: { items: { include: { purchaseOrder: true } } },
  },
} satisfies Prisma.ResinOrderInclude;

export type ResinOrderDetail = Prisma.ResinOrderGetPayload<{ include: typeof resinOrderByIdInclude }>;
export type ResinOrderShipmentRow = ResinOrderDetail["shipments"][number];
export type ResinOrderPaymentRow = ResinOrderDetail["payments"][number];
export type ResinPurchaseOrderRow = ResinOrderDetail["purchaseOrders"][number];

export const resinOrderListInclude = {
  customer: { select: { id: true, shortName: true, nameEn: true, nameCn: true } },
  purchaseOrders: { select: { quantity: true } },
  _count: { select: { shipments: true, payments: true, purchaseOrders: true } },
} as const satisfies Prisma.ResinOrderInclude;

export type ResinOrderListRow = Prisma.ResinOrderGetPayload<{ include: typeof resinOrderListInclude }>;
