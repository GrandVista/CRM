import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

/** 仅 admin：启用/禁用用户 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireRole(request, ["admin"]);
  if (result instanceof NextResponse) return result;

  const { id } = await params;
  let body: { isActive?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  if (typeof body.isActive !== "boolean") {
    return NextResponse.json(
      { message: "isActive 必须为 true 或 false" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isActive: body.isActive },
    select: { id: true, email: true, isActive: true },
  }).catch(() => null);

  if (!user) {
    return NextResponse.json({ message: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json(user);
}
