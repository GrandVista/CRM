import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

type JwtPayload = { sub?: string; email?: string; iat?: number; exp?: number };

/** 从请求头 Authorization 中读取 Bearer token */
export function getBearerToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
}

/** 从 Bearer 或 Cookie `token` 读取 JWT（新窗口打开 PDF 等场景仅有 Cookie） */
export function getTokenFromRequest(request: Request): string | null {
  const bearer = getBearerToken(request);
  if (bearer) return bearer;
  const raw = request.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k !== "token") continue;
    return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

/** 校验 token，返回 payload；无效或过期返回 null */
export function verifyToken(token: string): JwtPayload | null {
  if (!JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * 从请求中解析并校验 token，再从数据库加载完整用户信息。
 * 无 token 或 token 无效时返回 null。
 */
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

/** 从 token 字符串解析当前用户 */
export async function getAuthUserByToken(token: string | null | undefined): Promise<AuthUser | null> {
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

/** 在 Server Component / Server Action 中从 cookie 读取当前用户 */
export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? null;
  return getAuthUserByToken(token);
}

/**
 * 要求请求已登录且角色在允许列表中。
 * 未登录返回 401，角色不符返回 403，通过则返回当前用户。
 */
export async function requireRole(
  request: Request,
  allowedRoles: string[]
): Promise<{ user: AuthUser } | NextResponse> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: "未登录或 token 无效" }, { status: 401 });
  }
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ message: "无权限" }, { status: 403 });
  }
  return { user };
}

/** 仅要求已登录，不校验角色。未登录返回 401。 */
export async function requireAuth(request: Request): Promise<{ user: AuthUser } | NextResponse> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: "未登录或 token 无效" }, { status: 401 });
  }
  return { user };
}
