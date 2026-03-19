import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/** 仅 admin：重置用户密码 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireRole(request, ["admin"]);
  if (result instanceof NextResponse) return result;

  const { id } = await params;
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!password || password.length < 6) {
    return NextResponse.json({ message: "密码至少 6 位" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user
    .update({
      where: { id },
      data: { passwordHash },
      select: { id: true, email: true },
    })
    .catch(() => null);

  if (!user) {
    return NextResponse.json({ message: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({ message: "密码已重置" });
}
