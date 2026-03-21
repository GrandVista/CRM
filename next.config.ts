import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** 禁止将 pdfkit 打进客户端/ESM 包，使用 Node 侧真实 CJS 与字体文件 */
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
