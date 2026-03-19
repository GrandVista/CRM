import type { AllowOption } from "@prisma/client";

/** 将 AllowOption 枚举转为用户可见文案，空值显示为 — */
export function allowOptionLabel(value: AllowOption | string | null | undefined): string {
  if (value === "ALLOWED") return "Allowed";
  if (value === "NOT_ALLOWED") return "Not Allowed";
  return "—";
}

/** 用于 Partial Shipment / Transhipment：空值按默认显示为 Allowed，保证合同不出现 — */
export function allowOptionLabelRequired(value: AllowOption | string | null | undefined): string {
  return allowOptionLabel(value === "ALLOWED" || value === "NOT_ALLOWED" ? value : "ALLOWED");
}

export const ALLOW_OPTIONS: { value: AllowOption; label: string }[] = [
  { value: "ALLOWED", label: "Allowed" },
  { value: "NOT_ALLOWED", label: "Not Allowed" },
];
