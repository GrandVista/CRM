import type { ExecutionStatus } from "@prisma/client";

/** 执行状态中文标签，与 Prisma ExecutionStatus 一致；旧数据兼容：未知状态显示原值 */
export const EXECUTION_STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  DEPOSIT_RECEIVED: "已收到订金",
  LC_RECEIVED: "已收到 L/C",
  COMPLETED_PAID: "已完成并收齐货款",
  SENT: "已发送",
  CONFIRMED: "已确认",
  PENDING_PAYMENT: "待付款",
  PAID: "已付款",
  IN_PRODUCTION: "生产中",
  READY_TO_SHIP: "待出货",
  SHIPPED: "已出货",
  DOCUMENT_COMPLETED: "单证完成",
  PARTIALLY_RECEIVED: "部分到货",
  FULLY_RECEIVED: "全部到货",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

export function getExecutionStatusLabel(status: ExecutionStatus | string): string {
  return EXECUTION_STATUS_LABELS[status] ?? status;
}

/** 用于表单/列表下拉框的选项（不含“全部”） */
export const EXEC_OPTIONS: { value: ExecutionStatus; label: string }[] = [
  { value: "DRAFT", label: "草稿" },
  { value: "DEPOSIT_RECEIVED", label: "已收到订金" },
  { value: "LC_RECEIVED", label: "已收到 L/C" },
  { value: "COMPLETED_PAID", label: "已完成并收齐货款" },
  { value: "SENT", label: "已发送" },
  { value: "CONFIRMED", label: "已确认" },
  { value: "PENDING_PAYMENT", label: "待付款" },
  { value: "PAID", label: "已付款" },
  { value: "IN_PRODUCTION", label: "生产中" },
  { value: "READY_TO_SHIP", label: "待出货" },
  { value: "SHIPPED", label: "已出货" },
  { value: "DOCUMENT_COMPLETED", label: "单证完成" },
  { value: "PARTIALLY_RECEIVED", label: "部分到货" },
  { value: "FULLY_RECEIVED", label: "全部到货" },
  { value: "COMPLETED", label: "已完成" },
  { value: "CANCELLED", label: "已取消" },
];

/** 用于筛选的选项（含“全部”） */
export const EXEC_OPTIONS_WITH_ALL: { value: string; label: string }[] = [
  { value: "", label: "全部" },
  ...EXEC_OPTIONS,
];
