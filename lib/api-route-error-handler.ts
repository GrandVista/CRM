import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

/**
 * 判断是否为「连不上库」类错误（RDS 不可达、本地 Postgres 未启动等）
 */
export function isLikelyDatabaseUnreachableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientRustPanicError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ["P1001", "P1017", "P1011"].includes(error.code);
  }
  const m = error instanceof Error ? error.message : String(error);
  return (
    m.includes("Can't reach database server") ||
    m.includes("P1001") ||
    /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|getaddrinfo/i.test(m)
  );
}

/**
 * 数据库不可用时返回 JSON（避免空白 500）；开发环境附带原始错误信息便于定位。
 */
export function jsonDatabaseUnavailableResponse(error: unknown, step: string): NextResponse {
  console.error(`[CRM API][DATABASE_UNAVAILABLE] step=${step}`, error);

  const isDev = process.env.NODE_ENV === "development";
  const body: Record<string, unknown> = {
    success: false,
    code: "DATABASE_UNAVAILABLE",
    step,
    message:
      "无法连接数据库，该接口暂时不可用。请检查 DATABASE_URL、本机网络、VPN 或云数据库白名单是否允许当前 IP。",
  };
  if (isDev && error instanceof Error) {
    body.developerMessage = error.message;
  }
  return NextResponse.json(body, { status: 503 });
}

/**
 * 路由内 catch 使用：区分数据库不可用与其它错误，并打日志。
 */
export function handleApiRouteError(error: unknown, step: string): NextResponse {
  if (isLikelyDatabaseUnreachableError(error)) {
    return jsonDatabaseUnavailableResponse(error, step);
  }

  console.error(`[CRM API][INTERNAL_ERROR] step=${step}`, error);

  const isDev = process.env.NODE_ENV === "development";
  return NextResponse.json(
    {
      success: false,
      code: "INTERNAL_ERROR",
      step,
      message: isDev && error instanceof Error ? error.message : "服务器内部错误",
    },
    { status: 500 },
  );
}
