import type { ResinDeliveryStatus, ResinPaymentStatus } from "@prisma/client";

export const RESIN_DELIVERY_STATUS_LABEL: Record<ResinDeliveryStatus, string> = {
  NOT_SHIPPED: "未发货",
  PARTIAL: "部分发货",
  SHIPPED: "已发货",
};

export const RESIN_PAYMENT_STATUS_LABEL: Record<ResinPaymentStatus, string> = {
  NOT_PAID: "未收款",
  PARTIAL: "部分收款",
  PAID: "已收款",
};
