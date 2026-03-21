import { PrismaClient } from "@prisma/client";

/**
 * 单例 PrismaClient。连接串来自环境变量 DATABASE_URL（见 prisma/schema.prisma）。
 * 本地开发可用 Docker/本机 Postgres，不必使用阿里云 RDS；把 .env.local 里的 DATABASE_URL
 * 指到可达的实例即可。
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
