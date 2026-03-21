"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAuthUser } from "@/lib/server-auth";
import type { Prisma, ResinDeliveryStatus, ResinPaymentStatus } from "@prisma/client";

/** `getResinOrderById` 完整返回（含 customer / shipments / payments） */
const resinOrderByIdInclude = {
  customer: true,
  shipments: { orderBy: { shipmentDate: "desc" as const } },
  payments: { orderBy: { paymentDate: "desc" as const } },
} satisfies Prisma.ResinOrderInclude;

export type ResinOrderDetail = Prisma.ResinOrderGetPayload<{ include: typeof resinOrderByIdInclude }>;
export type ResinOrderShipmentRow = ResinOrderDetail["shipments"][number];
export type ResinOrderPaymentRow = ResinOrderDetail["payments"][number];

/** `getResinOrders` 列表行（含 customer 摘要、_count） */
const resinOrderListInclude = {
  customer: { select: { id: true, shortName: true, nameEn: true, nameCn: true } },
  _count: { select: { shipments: true, payments: true } },
} as const satisfies Prisma.ResinOrderInclude;

export type ResinOrderListRow = Prisma.ResinOrderGetPayload<{ include: typeof resinOrderListInclude }>;

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

async function recalcOrderProgress(tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">, resinOrderId: string) {
  const order = await tx.resinOrder.findUnique({
    where: { id: resinOrderId },
    select: { quantity: true, totalAmount: true },
  });
  if (!order) throw new Error("订单不存在");

  const [shipmentAgg, paymentAgg] = await Promise.all([
    tx.resinOrderShipment.aggregate({
      where: { resinOrderId },
      _sum: { quantity: true },
    }),
    tx.resinOrderPayment.aggregate({
      where: { resinOrderId },
      _sum: { amount: true },
    }),
  ]);

  const shippedQuantity = shipmentAgg._sum.quantity ?? 0;
  const paidAmount = paymentAgg._sum.amount ?? 0;
  const deliveryStatus: ResinDeliveryStatus =
    shippedQuantity <= 0 ? "NOT_SHIPPED" : shippedQuantity < order.quantity ? "PARTIAL" : "SHIPPED";
  const paymentStatus: ResinPaymentStatus =
    paidAmount <= 0 ? "NOT_PAID" : paidAmount < order.totalAmount ? "PARTIAL" : "PAID";

  await tx.resinOrder.update({
    where: { id: resinOrderId },
    data: {
      shippedQuantity,
      paidAmount,
      deliveryStatus,
      paymentStatus,
    },
  });
}

export type ResinOrderFormData = {
  customerId: string;
  customerName: string;
  customerPoNo?: string;
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

export type ResinShipmentInput = {
  deliveryNo?: string;
  shipmentDate: string;
  quantity: number;
  vehicleNo?: string;
  driverName?: string;
  driverPhone?: string;
  remarks?: string;
  shipper?: string;
  reviewer?: string;
  invoicer?: string;
};

export type ResinPaymentInput = {
  paymentDate: string;
  amount: number;
  method?: string;
  referenceNo?: string;
  remarks?: string;
};

export async function getResinOrders(params?: {
  search?: string;
  deliveryStatus?: string;
  paymentStatus?: string;
}): Promise<ResinOrderListRow[]> {
  const where: Record<string, unknown> = {};
  if (params?.search) {
    where.OR = [
      { orderNo: { contains: params.search, mode: "insensitive" } },
      { customerPoNo: { contains: params.search, mode: "insensitive" } },
      { customerName: { contains: params.search, mode: "insensitive" } },
      { productName: { contains: params.search, mode: "insensitive" } },
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
      const order = await prisma.resinOrder.create({
        data: {
          orderNo,
          customerId: data.customerId,
          customerName: data.customerName,
          customerPoNo: data.customerPoNo?.trim() || null,
          productName: data.productName,
          grade: data.grade ?? null,
          quantity: data.quantity,
          unit: data.unit || "KG",
          unitPrice: data.unitPrice,
          currency: data.currency || "USD",
          totalAmount: data.totalAmount,
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

  await prisma.resinOrder.update({
    where: { id },
    data: {
      customerId: data.customerId,
      customerName: data.customerName,
      customerPoNo: data.customerPoNo?.trim() || null,
      productName: data.productName,
      grade: data.grade ?? null,
      quantity: data.quantity,
      unit: data.unit || "KG",
      unitPrice: data.unitPrice,
      currency: data.currency || "USD",
      totalAmount: data.totalAmount,
      orderDate: new Date(data.orderDate),
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      warehouse: data.warehouse ?? null,
      destination: data.destination ?? null,
      contactPerson: data.contactPerson ?? null,
      contactPhone: data.contactPhone ?? null,
      remarks: data.remarks ?? null,
    },
  });
  await recalcOrderProgress(prisma as never, id);
  revalidatePath("/resin-orders");
  revalidatePath(`/resin-orders/${id}`);
  revalidatePath(`/resin-orders/${id}/edit`);
}

export async function addResinOrderShipment(resinOrderId: string, data: ResinShipmentInput) {
  const user = await getCurrentAuthUser();
  if (!user) throw new Error("未登录或 token 无效");
  requireAdminRole(user.role);

  await prisma.$transaction(async (tx) => {
    const deliveryNo = data.deliveryNo?.trim() || (await generateDeliveryNo());
    await tx.resinOrderShipment.create({
      data: {
        resinOrderId,
        deliveryNo,
        shipmentDate: new Date(data.shipmentDate),
        quantity: data.quantity,
        vehicleNo: data.vehicleNo ?? null,
        driverName: data.driverName ?? null,
        driverPhone: data.driverPhone ?? null,
        remarks: data.remarks ?? null,
        shipper: data.shipper?.trim() || null,
        reviewer: data.reviewer?.trim() || null,
        invoicer: data.invoicer?.trim() || null,
      },
    });
    await recalcOrderProgress(tx as never, resinOrderId);
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

  await prisma.resinOrderShipment.update({
    where: { id: shipmentId },
    data: {
      shipmentDate: new Date(data.shipmentDate),
      quantity: data.quantity,
      vehicleNo: data.vehicleNo?.trim() || null,
      driverName: data.driverName?.trim() || null,
      driverPhone: data.driverPhone?.trim() || null,
      remarks: data.remarks?.trim() || null,
      shipper: data.shipper?.trim() || null,
      reviewer: data.reviewer?.trim() || null,
      invoicer: data.invoicer?.trim() || null,
    },
  });
  await recalcOrderProgress(prisma as never, existing.resinOrderId);

  revalidatePath("/resin-orders");
  revalidatePath(`/resin-orders/${existing.resinOrderId}`);
}

export async function addResinOrderPayment(resinOrderId: string, data: ResinPaymentInput) {
  const user = await getCurrentAuthUser();
  if (!user) throw new Error("未登录或 token 无效");
  requireAdminRole(user.role);

  await prisma.$transaction(async (tx) => {
    await tx.resinOrderPayment.create({
      data: {
        resinOrderId,
        paymentDate: new Date(data.paymentDate),
        amount: data.amount,
        method: data.method ?? null,
        referenceNo: data.referenceNo ?? null,
        remarks: data.remarks ?? null,
      },
    });
    await recalcOrderProgress(tx as never, resinOrderId);
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
      _count: { select: { shipments: true, payments: true } },
    },
  });
  if (!existing) throw new Error("订单不存在");
  if (existing._count.shipments > 0 || existing._count.payments > 0) {
    throw new Error("该订单已关联发货或收款记录，不能直接删除");
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
    await tx.resinOrder.delete({ where: { id } });
  });
  revalidatePath("/resin-orders");
}
