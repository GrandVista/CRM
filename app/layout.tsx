import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "景峻 CRM - 外贸业务管理系统",
  description: "客户与外贸业务管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
