"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAuthUser } from "@/lib/server-auth";
import type { Prisma, ResinDeliveryStatus, ResinPaymentStatus } from "@prisma/client";
import {
  resinOrderByIdInclude,
  resinOrderListInclude,
  type ResinOrderDetail,
  type ResinOrderListRow,
} from "@/lib/resin-order-prisma";
import { computeResinMasterPaymentStatus, resinOrderMasterReceivable } from "@/lib/resin-order-metrics";

type Tx = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

export type { ResinOrderDetail, ResinOrderListRow, ResinOrderPaymentRow, ResinOrderShipmentRow, ResinPurchaseOrderRow } from "@/lib/resin-order-prisma";

function requireAdminRole(role: string) {
  if (role !== "admin") throw new Error("仅管理员可执行该操作");
}

function isUniqueConstraintError(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

async function generateResinOrderNo() {
  const now = new Date();
  const day = toDateString(now);
  const prefix = `RO-${day}-`;
  const latest = await prisma.resinOrder.findFirst({
    where: { orderNo: { startsWith: prefix } },
    orderBy: { orderNo: "desc" },
    select: { orderNo: true },
  });
  const next = latest?.orderNo ? Number(latest.orderNo.slice(-3)) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

async function generateDeliveryNo() {
  const now = new Date();
  const day = toDateString(now);
  const prefix = `DN-${day}-`;
  const latest = await prisma.resinOrderShipment.findFirst({
    where: { deliveryNo: { startsWith: prefix } },
    orderBy: { deliveryNo: "desc" },
    select: { deliveryNo: true },
  });
  const next = latest?.deliveryNo ? Number(latest.deliveryNo.slice(-3)) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export async function effectiveShipmentQuantity(tx: Tx, shipmentId: string): Promise<number> {
  const agg = await tx.resinOrderShipmentItem.aggregate({
    where: { shipmentId },
    _sum: { quantity: true },
  });
  const fromItems = agg._sum.quantity ?? 0;
  if (fromItems > 0) return fromItems;
  const s = await tx.resinOrderShipment.findUnique({
    where: { id: shipmentId },
    select: { quantity: true },
  });
  return s?.quantity ?? 0;
}

export async function effectivePaymentAmount(tx: Tx, paymentId: string): Promise<number> {
  const agg = await tx.resinOrderPaymentItem.aggregate({
    where: { paymentId },
    _sum: { amount: true },
  });
  const fromItems = agg._sum.amount ?? 0;
  if (fromItems > 0) return fromItems;
  const p = await tx.resinOrderPayment.findUnique({
    where: { id: paymentId },
    select: { amount: true },
  });
  return p?.amount ?? 0;
}

async function sumShippedForOrder(tx: Tx, resinOrderId: string): Promise<number> {
  const shipments = await tx.resinOrderShipment.findMany({
    where: { resinOrderId },
    select: { id: true },
  });
  let t = 0;
  for (const sh of shipments) {
    t += await effectiveShipmentQuantity(tx, sh.id);
  }
  return t;
}

async function sumPaidForOrder(tx: Tx, resinOrderId: string): Promise<number> {
  const payments = await tx.resinOrderPayment.findMany({
    where: { resinOrderId },
    select: { id: true },
  });
  let t = 0;
  for (const p of payments) {
    t += await effectivePaymentAmount(tx, p.id);
  }
  return t;
}

async function shippedQuantityForPurchaseOrder(
  tx: Tx,
  purchaseOrderId: string,
  excludeShipmentId?: string,
): Promise<number> {
  const where: Prisma.ResinOrderShipmentItemWhereInput = {
    purchaseOrderId,
    ...(excludeShipmentId ? { shipmentId: { not: excludeShipmentId } } : {}),
  };
  const agg = await tx.resinOrderShipmentItem.aggregate({
    where,
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}

async function paidAmountForPurchaseOrder(tx: Tx, purchaseOrderId: string, excludePaymentId?: string): Promise<number> {
  const where: Prisma.ResinOrderPaymentItemWhereInput = {
    purchaseOrderId,
    ...(excludePaymentId ? { paymentId: { not: excludePaymentId } } : {}),
  };
  const agg = await tx.resinOrderPaymentItem.aggregate({
    where,
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

export async function recalcOrderProgress(tx: Tx, resinOrderId: string) {
  const order = await tx.resinOrder.findUnique({
    where: { id: resinOrderId },
    select: { quantity: true, unitPrice: true },
  });
  if (!order) throw new Error("订单不存在");

  const receivable = resinOrderMasterReceivable(order.quantity, order.unitPrice);
  const shippedQuantity = await sumShippedForOrder(tx, resinOrderId);
  const paidAmount = await sumPaidForOrder(tx, resinOrderId);
  const deliveryStatus: ResinDeliveryStatus =
    shippedQuantity <= 0 ? "NOT_SHIPPED" : shippedQuantity < order.quantity ? "PARTIAL" : "SHIPPED";
  const paymentStatus: ResinPaymentStatus = computeResinMasterPaymentStatus(paidAmount, receivable);

  await tx.resinOrder.update({
    where: { id: resinOrderId },
    data: {
      shippedQuantity,
      paidAmount,
      deliveryStatus,
      paymentStatus,
      totalAmount: receivable,
    },
  });
}

async function assertShipmentItemsValid(
  tx: Tx,
  resinOrderId: string,
  items: { purchaseOrderId: string; quantity: number }[],
  excludeShipmentId?: string,
) {
  const merged = new Map<string, number>();
  for (const it of items) {
    if (it.quantity <= 0) throw new Error("发货数量须大于 0");
    merged.set(it.purchaseOrderId, (merged.get(it.purchaseOrderId) ?? 0) + it.quantity);
  }
  if (merged.size === 0) throw new Error("请至少选择一个小订单并填写发货数量");

  const pos = await tx.resinPurchaseOrder.findMany({
    where: { resinOrderId, id: { in: [...merged.keys()] } },
    select: { id: true, quantity: true, customerPoNo: true },
  });
  if (pos.length !== merged.size) throw new Error("存在无效的小订单");

  for (const po of pos) {
    const add = merged.get(po.id)!;
    const already = await shippedQuantityForPurchaseOrder(tx, po.id, excludeShipmentId);
    if (already + add > po.quantity + 1e-6) {
      throw new Error(`小订单 ${po.customerPoNo} 累计发货不能超过该单数量`);
    }
  }
}

async function assertPaymentItemsValid(
  tx: Tx,
  resinOrderId: string,
  unitPrice: number,
  items: { purchaseOrderId: string; amount: number }[],
  excludePaymentId?: string,
) {
  const merged = new Map<string, number>();
  for (const it of items) {
    if (it.amount <= 0) throw new Error("分摊金额须大于 0");
    merged.set(it.purchaseOrderId, (merged.get(it.purchaseOrderId) ?? 0) + it.amount);
  }
  if (merged.size === 0) throw new Error("请至少选择一个小订单并填写分摊金额");

  const pos = await tx.resinPurchaseOrder.findMany({
    where: { resinOrderId, id: { in: [...merged.keys()] } },
    select: { id: true, quantity: true, customerPoNo: true },
  });
  if (pos.length !== merged.size) throw new Error("存在无效的小订单");

  for (const po of pos) {
    const add = merged.get(po.id)!;
    const maxDue = po.quantity * unitPrice;
    const already = await paidAmountForPurchaseOrder(tx, po.id, excludePaymentId);
    if (already + add > maxDue + 1e-4) {
      throw new Error(`小订单 ${po.customerPoNo} 累计收款不能超过应收（数量×单价）`);
    }
  }
}

async function assertPurchaseOrdersTotalWithinMaster(tx: Tx, resinOrderId: string, masterQty: number) {
  const pos = await tx.resinPurchaseOrder.findMany({
    where: { resinOrderId },
    select: { quantity: true },
  });
  const sum = pos.reduce((s, p) => s + p.quantity, 0);
  if (sum > masterQty + 1e-6) throw new Error("小订单数量合计不能超过总量订单数量");
}

export type ResinOrderFormData = {
  customerId: string;
  customerName: string;
  productName: string;
  grade?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  currency: string;
  totalAmount: number;
  orderDate: string;
  deliveryDate?: string;
  warehouse?: string;
  destination?: string;
  contactPerson?: string;
  contactPhone?: string;
  remarks?: string;
};

export type ResinShipmentLineInput = { purchaseOrderId: string; quantity: number };

export type ResinShipmentInput = {
  deliveryNo?: string;
  shipmentDate: string;
  vehicleNo?: string;
  driverName?: string;
  driverPhone?: string;
  remarks?: string;
  shipper?: string;
  reviewer?: string;
  invoicer?: string;
  /** 已存在小订单时必填 */
  items?: ResinShipmentLineInput[];
  /** 无小订单时的旧版录入 */
  legacyQuantity?: number;
};

export type ResinPaymentLineInput = { purchaseOrderId: string; amount: number };

export type ResinPaymentInput = {
  paymentDate: string;
  method?: string;
  referenceNo?: string;
  remarks?: string;
  items?: ResinPaymentLineInput[];
  legacyAmount?: number;
};

export type ResinPurchaseOrderInput = {
  customerPoNo: string;
  quantity: number;
  orderDate: string;
  remarks?: string;
};

export async function getResinOrders(params?: {
  search?: string;
  deliveryStatus?: string;
  paymentStatus?: string;
}): Promise<ResinOrderListRow[]> {
  const where: Prisma.ResinOrderWhereInput = {};
  if (params?.search) {
    const q = params.search;
    where.OR = [
      { orderNo: { contains: q, mode: "insensitive" } },
      { customerPoNo: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
      { productName: { contains: q, mode: "insensitive" } },
      { purchaseOrders: { some: { customerPoNo: { contains: q, mode: "insensitive" } } } },
    ];
  }
  if (params?.deliveryStatus) where.deliveryStatus = params.deliveryStatus as ResinDeliveryStatus;
  if (params?.paymentStatus) where.paymentStatus = params.paymentStatus as ResinPaymentStatus;

  return prisma.resinOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: resinOrderListInclude,
  });
}

export async function getResinOrderById(id: string): Promise<ResinOrderDetail | null> {
  return prisma.resinOrder.findUnique({
    where: { id },
    include: resinOrderByIdInclude,
  });
}

export async function createResinOrder(data: ResinOrderFormData) {
  const user = await getCurrentAuthUser();
  if (!user) throw new Error("未登录或 token 无效");
  requireAdminRole(user.role);

  let lastError: unknown;
  for (let i = 0; i < 3; i++) {
    try {
      const orderNo = await generateResinOrderNo();
      const receivable = data.quantity * data.unitPrice;
      const order = await prisma.resinOrder.create({
        data: {
          orderNo,
          customerId: data.customerId,
          customerName: data.customerName,
          productName: data.productName,
          grade: data.grade ?? null,
          quantity: data.quantity,
          unit: data.unit || "KG",
          unitPrice: data.unitPrice,
          currency: data.currency || "USD",
          totalAmount: receivable,
          orderDate: new Date(data.orderDate),
          deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
          warehouse: data.warehouse ?? null,
          destination: data.destination ?? null,
          contactPerson: data.contactPerson ?? null,
          contactPhone: data.contactPhone ?? null,
          remarks: data.remarks ?? null,
        },
      });
      revalidatePath("/resin-orders");
      return order;
    } catch (e) {
      lastError = e;
      if (isUniqueConstraintError(e)) continue;
      throw e;
    }
  }
  throw lastError ?? new Error("创建订单失败");
}

export async function updateResinOrder(id: string, data: ResinOrderFormData) {
  const user = await getCurrentAuthUser();
  if (!user) throw new Error("未登录或 token 无效");
  requireAdminRole(user.role);

  await prisma.$transaction(async (tx) => {
    await assertPurchaseOrdersTotalWithinMaster(tx as Tx, id, data.quantity);
    const receivable = data.quantity * data.unitPrice;
    await tx.resinOrder.update({
      where: { id },
      data: {
        customerId: data.customerId,
        customerName: data.customerName,
        productName: data.productName,
        grade: data.grade ?? null,
        quantity: data.quantity,
        unit: data.unit || "KG",
        unitPrice: data.unitPrice,
        currency: data.currency || "USD",
        totalAmount: receivable,
        orderDate: new Date(data.orderDate),
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        warehouse: data.warehouse ?? null,
        destination: data.destination ?? null,
        contactPerson: data.contactPerson ?? null,
        contactPhone: data.contactPhone ?? null,
        remarks: data.remarks ?? null,
      },
    });
    await recalcOrderProgress(tx as Tx, id);
  });

  revalidatePath("/resin-orders");
  revalidatePath(`/resin-orders/${id}`);
  revalidatePath(`/resin-orders/${id}/edit`);
}

export async function createResinPurchaseOrder(resinOrderId: string, data: ResinPurchaseOrderInput) {
  const user = await getCurrentAuthUser();
  if (!user) throw new Error("未登录或 token 无效");
  requireAdminRole(user.role);

  const order = await prisma.resinOrder.findUnique({
    where: { id: resinOrderId },
    select: { quantity: true },
  });
  if (!order) throw new Error("订单不存在");

  await prisma.$transaction(async (tx) => {
    const currentSum = (
      await tx.resinPurchaseOrder.aggregate({
        where: { resinOrderId },
        _sum: { quantity: true },
      })
    )._sum.quantity ?? 0;
    if (currentSum + data.quantity > order.quantity + 1e-6) {
      throw new Error("小订单数量合计不能超过总量订单数量");
    }
    await tx.resinPurchaseOrder.create({
      data: {
        resinOrderId,
        customerPoNo: data.customerPoNo.trim(),
        quantity: data.quantity,
        orderDate: new Date(data.orderDate),
        remarks: data.remarks?.trim() || null,
      },
    });
  });

  revalidatePath("/resin-orders");
  revalidatePath(`/resin-orders/${resinOrderId}`);
}

export async function updateResinPurchaseOrder(purchaseOrderId: string, data: ResinPurchaseOrderInput) {
  const user = await getCurrentAuthUser();
  if (!user) throw new Error("未登录或 token 无效");
  requireAdminRole(user.role);

  const po = await prisma.resinPurchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { resinOrder: { select: { id: true, quantity: true, unitPrice: true } } },
  });
  if (!po) throw new Error("小订单不存在");

  await prisma.$transaction(async (tx) => {
    const shipped = await shippedQuantityForPurchaseOrder(tx as Tx, purchaseOrderId);
    const paid = await paidAmountForPurchaseOrder(tx as Tx, purchaseOrderId);
    const minQty = shipped;
    const minFromPaid = po.resinOrder.unitPrice > 0 ? paid / po.resinOrder.unitPrice : 0;
    if (data.quantity + 1e-6 < Math.max(minQty, minFromPaid)) {
      throw new Error("数量不能小于已发货或已收款对应的数量");
    }

    const othersSum = (
      await tx.resinPurchaseOrder.aggregate({
        where: { resinOrderId: po.resinOrderId, id: { not: purchaseOrderId } },
        _sum: { quantity: true },
      })
    )._sum.quantity ?? 0;
    if (othersSum + data.quantity > po.resinOrder.quantity + 1e-6) {
      throw new Error("小订单数量合计不能超过总量订单数量");
    }

    await tx.resinPurchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        customerPoNo: data.customerPoNo.trim(),
        quantity: data.quantity,
        orderDate: new Date(data.orderDate),
        remarks: data.remarks?.trim() || null,
      },
    });
  });

  revalidatePath("/resin-orders");
  revalidatePath(`/resin-orders/${po.resinOrderId}`);
}

export async function deleteResinPurchaseOrder(purchaseOrderId: string) {
  const user = await getCurrentAuthUser();
  if (!user) throw new Error("未登录或 token 无效");
  requireAdminRole(user.role);

  const po = await prisma.resinPurchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: {
      _count: { select: { shipmentItems: true, paymentItems: true } },
    },
  });
  if (!po) throw new Error("小订单不存在");
  if (po._count.shipmentItems > 0 || po._count.paymentItems > 0) {
    throw new Error("已有关联发货或收款分摊，不能删除");
  }

  await prisma.resinPurchaseOrder.delete({ where: { id: purchaseOrderId } });
  revalidatePath("/resin-orders");
  revalidatePath(`/resin-orders/${po.resinOrderId}`);
}

export async function addResinOrderShipment(resinOrderId: string, data: ResinShipmentInput) {
  const user = await getCurrentAuthUser();
  if (!user) throw new Error("未登录或 token 无效");
  requireAdminRole(user.role);

  await prisma.$transaction(async (tx) => {
    const poCount = await tx.resinPurchaseOrder.count({ where: { resinOrderId } });
    const deliveryNo = data.deliveryNo?.trim() || (await generateDeliveryNo());

    if (poCount > 0) {
      const items = data.items ?? [];
      await assertShipmentItemsValid(tx as Tx, resinOrderId, items);
      const totalQty = items.reduce((s, it) => s + it.quantity, 0);
      if (totalQty <= 0) throw new Error("本单发货总数量须大于 0");
      await tx.resinOrderShipment.create({
        data: {
          resinOrderId,
          deliveryNo,
          shipmentDate: new Date(data.shipmentDate),
          quantity: totalQty,
          vehicleNo: data.vehicleNo ?? null,
          driverName: data.driverName ?? null,
          driverPhone: data.driverPhone ?? null,
          remarks: data.remarks ?? null,
          shipper: data.shipper?.trim() || null,
          reviewer: data.reviewer?.trim() || null,
          invoicer: data.invoicer?.trim() || null,
          items: {
            create: items.map((it) => ({
              purchaseOrderId: it.purchaseOrderId,
              quantity: it.quantity,
            })),
          },
        },
      });
    } else {
      const q = data.legacyQuantity ?? 0;
      if (q <= 0) throw new Error("发货数量须大于 0");
      await tx.resinOrderShipment.create({
        data: {
          resinOrderId,
          deliveryNo,
          shipmentDate: new Date(data.shipmentDate),
          quantity: q,
          vehicleNo: data.vehicleNo ?? null,
          driverName: data.driverName ?? null,
          driverPhone: data.driverPhone ?? null,
          remarks: data.remarks ?? null,
          shipper: data.shipper?.trim() || null,
          reviewer: data.reviewer?.trim() || null,
          invoicer: data.invoicer?.trim() || null,
        },
      });
    }
    await recalcOrderProgress(tx as Tx, resinOrderId);
  });

  revalidatePath("/resin-orders");
  revalidatePath(`/resin-orders/${resinOrderId}`);
}

export async function updateResinOrderShipment(shipmentId: string, data: ResinShipmentInput) {
  const user = await getCurrentAuthUser();
  if (!user) throw new Error("未登录或 token 无效");
  requireAdminRole(user.role);

  const existing = await prisma.resinOrderShipment.findUnique({
    where: { id: shipmentId },
    select: { id: true, resinOrderId: true },
  });
  if (!existing) throw new Error("发货记录不存在");

  await prisma.$transaction(async (tx) => {
    const poCount = await tx.resinPurchaseOrder.count({ where: { resinOrderId: existing.resinOrderId } });

    if (poCount > 0) {
      const items = data.items ?? [];
      await assertShipmentItemsValid(tx as Tx, existing.resinOrderId, items, shipmentId);
      const totalQty = items.reduce((s, it) => s + it.quantity, 0);
      if (totalQty <= 0) throw new Error("本单发货总数量须大于 0");
      await tx.resinOrderShipmentItem.deleteMany({ where: { shipmentId } });
      await tx.resinOrderShipment.update({
        where: { id: shipmentId },
        data: {
          shipmentDate: new Date(data.shipmentDate),
          quantity: totalQty,
          vehicleNo: data.vehicleNo?.trim() || null,
          driverName: data.driverName?.trim() || null,
          driverPhone: data.driverPhone?.trim() || null,
          remarks: data.remarks?.trim() || null,
          shipper: data.shipper?.trim() || null,
          reviewer: data.reviewer?.trim() || null,
          invoicer: data.invoicer?.trim() || null,
          items: {
            create: items.map((it) => ({
              purchaseOrderId: it.purchaseOrderId,
              quantity: it.quantity,
            })),
          },
        },
      });
    } else {
      const q = data.legacyQuantity ?? 0;
      if (q <= 0) throw new Error("发货数量须大于 0");
      await tx.resinOrderShipmentItem.deleteMany({ where: { shipmentId } });
      await tx.resinOrderShipment.update({
        where: { id: shipmentId },
        data: {
          shipmentDate: new Date(data.shipmentDate),
          quantity: q,
          vehicleNo: data.vehicleNo?.trim() || null,
          driverName: data.driverName?.trim() || null,
          driverPhone: data.driverPhone?.trim() || null,
          remarks: data.remarks?.trim() || null,
          shipper: data.shipper?.trim() || null,
          reviewer: data.reviewer?.trim() || null,
          invoicer: data.invoicer?.trim() || null,
        },
      });
    }
    await recalcOrderProgress(tx as Tx, existing.resinOrderId);
  });

  revalidatePath("/resin-orders");
  revalidatePath(`/resin-orders/${existing.resinOrderId}`);
}

export async function addResinOrderPayment(resinOrderId: string, data: ResinPaymentInput) {
  const user = await getCurrentAuthUser();
  if (!user) throw new Error("未登录或 token 无效");
  requireAdminRole(user.role);

  await prisma.$transaction(async (tx) => {
    const poCount = await tx.resinPurchaseOrder.count({ where: { resinOrderId } });
    const order = await tx.resinOrder.findUnique({
      where: { id: resinOrderId },
      select: { unitPrice: true },
    });
    if (!order) throw new Error("订单不存在");

    if (poCount > 0) {
      const items = data.items ?? [];
      await assertPaymentItemsValid(tx as Tx, resinOrderId, order.unitPrice, items);
      const totalAmt = items.reduce((s, it) => s + it.amount, 0);
      if (totalAmt <= 0) throw new Error("本单收款总金额须大于 0");
      await tx.resinOrderPayment.create({
        data: {
          resinOrderId,
          paymentDate: new Date(data.paymentDate),
          amount: totalAmt,
          method: data.method ?? null,
          referenceNo: data.referenceNo ?? null,
          remarks: data.remarks ?? null,
          items: {
            create: items.map((it) => ({
              purchaseOrderId: it.purchaseOrderId,
              amount: it.amount,
            })),
          },
        },
      });
    } else {
      const amt = data.legacyAmount ?? 0;
      if (amt <= 0) throw new Error("收款金额须大于 0");
      await tx.resinOrderPayment.create({
        data: {
          resinOrderId,
          paymentDate: new Date(data.paymentDate),
          amount: amt,
          method: data.method ?? null,
          referenceNo: data.referenceNo ?? null,
          remarks: data.remarks ?? null,
        },
      });
    }
    await recalcOrderProgress(tx as Tx, resinOrderId);
  });

  revalidatePath("/resin-orders");
  revalidatePath(`/resin-orders/${resinOrderId}`);
}

export async function deleteResinOrder(id: string) {
  const user = await getCurrentAuthUser();
  if (!user) throw new Error("未登录或 token 无效");
  requireAdminRole(user.role);

  const existing = await prisma.resinOrder.findUnique({
    where: { id },
    include: {
      _count: { select: { shipments: true, payments: true, purchaseOrders: true } },
    },
  });
  if (!existing) throw new Error("订单不存在");
  if (existing._count.shipments > 0 || existing._count.payments > 0 || existing._count.purchaseOrders > 0) {
    throw new Error("该订单已关联小订单、发货或收款记录，不能直接删除");
  }
  await prisma.resinOrder.delete({ where: { id } });
  revalidatePath("/resin-orders");
}

export async function forceDeleteResinOrder(id: string) {
  const user = await getCurrentAuthUser();
  if (!user) throw new Error("未登录或 token 无效");
  requireAdminRole(user.role);

  await prisma.$transaction(async (tx) => {
    await tx.resinOrderShipment.deleteMany({ where: { resinOrderId: id } });
    await tx.resinOrderPayment.deleteMany({ where: { resinOrderId: id } });
    await tx.resinPurchaseOrder.deleteMany({ where: { resinOrderId: id } });
    await tx.resinOrder.delete({ where: { id } });
  });
  revalidatePath("/resin-orders");
}
