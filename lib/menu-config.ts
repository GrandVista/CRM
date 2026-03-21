import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Receipt,
  FileSignature,
  ClipboardList,
  Truck,
  Banknote,
  Factory,
  Settings,
  UserCog,
  KeyRound,
} from "lucide-react";

export type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** 可访问的角色列表，admin 与 staff 均可访问的写 ["admin", "staff"] */
  roles: string[];
};

export const menuItems: MenuItem[] = [
  { href: "/dashboard", label: "Dashboard / 首页", icon: LayoutDashboard, roles: ["admin", "staff"] },
  { href: "/customers", label: "Customers / 客户", icon: Users, roles: ["admin", "staff"] },
  { href: "/products", label: "Products / 产品", icon: Package, roles: ["admin", "staff"] },
  { href: "/quotations", label: "Quotations / 报价单", icon: FileText, roles: ["admin", "staff"] },
  { href: "/pi", label: "Proforma Invoices / 形式发票", icon: Receipt, roles: ["admin", "staff"] },
  { href: "/contracts", label: "Contracts / 合同", icon: FileSignature, roles: ["admin", "staff"] },
  { href: "/commercial-invoices", label: "Commercial Invoices / 商业发票", icon: FileText, roles: ["admin", "staff"] },
  { href: "/cl", label: "Packing Lists / 装箱单", icon: ClipboardList, roles: ["admin", "staff"] },
  { href: "/shipments", label: "Shipments / 出货", icon: Truck, roles: ["admin", "staff"] },
  { href: "/payments", label: "Payments / 收款", icon: Banknote, roles: ["admin", "staff"] },
  { href: "/resin-orders", label: "Resin Orders Tracker / 树脂颗粒订单跟踪", icon: Factory, roles: ["admin", "staff"] },
  { href: "/settings", label: "Settings / 设置", icon: Settings, roles: ["admin", "staff"] },
  { href: "/dashboard/change-password", label: "Change Password / 修改密码", icon: KeyRound, roles: ["admin", "staff"] },
  { href: "/dashboard/users", label: "Users / 用户管理", icon: UserCog, roles: ["admin"] },
];

/** 根据当前角色过滤出可显示的菜单项 */
export function getMenuItemsForRole(role: string | null): MenuItem[] {
  if (!role) return [];
  return menuItems.filter((item) => item.roles.includes(role));
}
