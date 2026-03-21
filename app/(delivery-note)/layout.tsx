import type { Metadata } from "next";
import { RESIN_DELIVERY_NOTE_COMPANY_TITLE } from "@/lib/constants/resin-delivery-note-branding";

/** 仅影响 (delivery-note) 下路由的浏览器标题，与全站 layout 区分 */
export const metadata: Metadata = {
  title: RESIN_DELIVERY_NOTE_COMPANY_TITLE,
  description: "送货单",
};

/** 送货单等独立页面：无侧边栏、无顶栏，便于打印 / PDF 预览 */
export default function DeliveryNoteShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-white text-black">{children}</div>;
}
