import type { TemplateType } from "@prisma/client";

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  PAYMENT_TERM: "付款条款",
  INCOTERM: "贸易条款",
  SHIPMENT_TERM: "装运条款",
  PACKING_TERM: "包装条款",
  INSURANCE_TERM: "保险条款",
  DOCUMENT_REQUIREMENT: "单证要求",
  BANK_INFO: "银行信息",
};

export function getTemplateTypeLabel(type: TemplateType): string {
  return TEMPLATE_TYPE_LABELS[type] ?? type;
}

export const TEMPLATE_TYPES: TemplateType[] = [
  "PAYMENT_TERM",
  "INCOTERM",
  "SHIPMENT_TERM",
  "PACKING_TERM",
  "INSURANCE_TERM",
  "DOCUMENT_REQUIREMENT",
  "BANK_INFO",
];
