import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 正式单据（合同/CI/PL）中 Buyer 显示名：优先英文全称，再中文，再缩写 */
export function getCustomerDisplayName(customer: {
  nameEn?: string | null;
  nameCn?: string | null;
  shortName?: string | null;
  customerCode?: string | null;
} | null): string {
  if (!customer) return "";
  return (customer.nameEn?.trim() || customer.nameCn?.trim() || customer.shortName?.trim() || customer.customerCode?.trim() || "") as string;
}
