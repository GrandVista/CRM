import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const ALLOWED_ROLES = ["admin", "staff"] as const;

/** 仅 admin：返回用户列表 */
export async function GET(request: Request) {
  const result = await requireRole(request, ["admin"]);
  if (result instanceof NextResponse) return result;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(users);
}

/** 仅 admin：新增用户 */
export async function POST(request: NextRequest) {
  const result = await requireRole(request, ["admin"]);
  if (result instanceof NextResponse) return result;

  let body: { email?: string; password?: string; name?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const role = typeof body.role === "string" ? body.role.trim() : "";

  if (!email) {
    return NextResponse.json({ message: "请提供 email" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ message: "密码至少 6 位" }, { status: 400 });
  }
  if (!ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
    return NextResponse.json({ message: "role 必须为 admin 或 staff" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "该邮箱已被使用" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name || null,
      role,
      isActive: true,
    },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });

  return NextResponse.json(user);
}
