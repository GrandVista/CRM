import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["admin", "staff"] as const;

/** 仅 admin：编辑用户（只更新传入的字段） */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireRole(request, ["admin"]);
  if (result instanceof NextResponse) return result;

  const { id } = await params;
  let body: { name?: string; email?: string; role?: string; isActive?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "用户不存在" }, { status: 404 });
  }

  const data: { name?: string | null; email?: string; role?: string; isActive?: boolean } = {};

  if (body.name !== undefined) {
    data.name = typeof body.name === "string" ? body.name.trim() || null : null;
  }
  if (body.email !== undefined) {
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email) {
      return NextResponse.json({ message: "邮箱不能为空" }, { status: 400 });
    }
    const other = await prisma.user.findFirst({
      where: { email, id: { not: id } },
    });
    if (other) {
      return NextResponse.json({ message: "该邮箱已被其他用户使用" }, { status: 400 });
    }
    data.email = email;
  }
  if (body.role !== undefined) {
    const role = typeof body.role === "string" ? body.role.trim() : "";
    if (!ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
      return NextResponse.json({ message: "role 必须为 admin 或 staff" }, { status: 400 });
    }
    data.role = role;
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json({ message: "isActive 必须为 true 或 false" }, { status: 400 });
    }
    data.isActive = body.isActive;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  return NextResponse.json(user);
}
