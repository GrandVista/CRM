import type { ResinPaymentStatus } from "@prisma/client";

/** 与 `getResinOrderById` 返回结构兼容，避免与 actions 循环依赖 */
export type ResinOrderDetailLike = {
  purchaseOrders: { id: string; customerPoNo: string; quantity: number }[];
  shipments: { quantity: number; items: { purchaseOrderId: string; quantity: number }[] }[];
  payments: {
    amount: number;
    items: { purchaseOrderId: string; amount: number }[];
  }[];
};

/** 总量订单应收 = 总量 × 单价（不读库内 totalAmount） */
export function resinOrderMasterReceivable(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

/** 与 DB `effectivePaymentAmount` 一致：有分摊明细且合计>0 用明细，否则用收款单头 amount */
export function resinPaymentEffectiveAmount(payment: {
  amount: number;
  items: { amount: number }[];
}): number {
  const fromItems = payment.items.reduce((s: number, it) => s + it.amount, 0);
  if (fromItems > 1e-6) return fromItems;
  return payment.amount ?? 0;
}

/** 主订单已收款 = 各收款单有效金额之和 */
export function resinTotalPaidFromPayments(
  payments: { amount: number; items: { amount: number }[] }[],
): number {
  return payments.reduce((s: number, p) => s + resinPaymentEffectiveAmount(p), 0);
}

/** 主订单收款状态（与页面展示、recalc 逻辑一致） */
export function computeResinMasterPaymentStatus(paid: number, receivable: number): ResinPaymentStatus {
  if (receivable <= 1e-6) return paid <= 1e-4 ? "NOT_PAID" : "PAID";
  if (paid <= 1e-4) return "NOT_PAID";
  if (paid + 1e-4 < receivable) return "PARTIAL";
  return "PAID";
}

export type ResinPoRollup = {
  purchaseOrderId: string;
  customerPoNo: string;
  poQuantity: number;
  shippedQty: number;
  unshippedQty: number;
  paidAmount: number;
  dueAmount: number;
  unpaidAmount: number;
  deliverySub: "未发货" | "部分发货" | "已发完";
  paymentSub: "未收款" | "部分收款" | "已收清";
};

/** 基于详情数据计算各小订单发货/收款汇总（不访问 DB） */
export function rollupResinPurchaseOrders(order: ResinOrderDetailLike, unitPrice: number): ResinPoRollup[] {
  const shippedByPo = new Map<string, number>();
  const paidByPo = new Map<string, number>();

  for (const sh of order.shipments) {
    if (sh.items.length > 0) {
      for (const it of sh.items) {
        const id = it.purchaseOrderId;
        shippedByPo.set(id, (shippedByPo.get(id) ?? 0) + it.quantity);
      }
    } else if (sh.quantity > 0) {
      // 旧数据：无明细，无法拆到小订单，不计入各 PO（由页面提示）
    }
  }

  for (const p of order.payments) {
    if (p.items.length > 0) {
      for (const it of p.items) {
        const id = it.purchaseOrderId;
        paidByPo.set(id, (paidByPo.get(id) ?? 0) + it.amount);
      }
    }
  }

  return order.purchaseOrders.map((po) => {
    const shippedQty = shippedByPo.get(po.id) ?? 0;
    const paidAmount = paidByPo.get(po.id) ?? 0;
    const dueAmount = po.quantity * unitPrice;
    const unshippedQty = Math.max(0, po.quantity - shippedQty);
    const unpaidAmount = Math.max(0, dueAmount - paidAmount);

    let deliverySub: ResinPoRollup["deliverySub"] = "未发货";
    if (shippedQty <= 0) deliverySub = "未发货";
    else if (shippedQty + 1e-6 < po.quantity) deliverySub = "部分发货";
    else deliverySub = "已发完";

    let paymentSub: ResinPoRollup["paymentSub"] = "未收款";
    if (paidAmount <= 1e-4) paymentSub = "未收款";
    else if (paidAmount + 1e-4 < dueAmount) paymentSub = "部分收款";
    else paymentSub = "已收清";

    return {
      purchaseOrderId: po.id,
      customerPoNo: po.customerPoNo,
      poQuantity: po.quantity,
      shippedQty,
      unshippedQty,
      paidAmount,
      dueAmount,
      unpaidAmount,
      deliverySub,
      paymentSub,
    };
  });
}

export function allocatedQuantityFromPurchaseOrders(order: ResinOrderDetailLike): number {
  return order.purchaseOrders.reduce((s, po) => s + po.quantity, 0);
}

/** 主订单汇总进度标签（应收按 quantity×unitPrice；已收款由调用方传入有效合计） */
export function resinMasterAggregateLabel(order: {
  quantity: number;
  unitPrice: number;
  shippedQuantity: number;
  paidAmount: number;
  purchaseOrders: { quantity: number }[];
}): "未开始" | "进行中" | "已完成" {
  const receivable = resinOrderMasterReceivable(order.quantity, order.unitPrice);
  const allocated = order.purchaseOrders.reduce((s, po) => s + po.quantity, 0);
  const shipDone = order.shippedQuantity + 1e-6 >= order.quantity && order.quantity > 0;
  const payDone = receivable > 1e-6 && order.paidAmount + 1e-4 >= receivable;
  const nothing = allocated <= 0 && order.shippedQuantity <= 0 && order.paidAmount <= 0;
  if (nothing) return "未开始";
  if (shipDone && payDone) return "已完成";
  return "进行中";
}
