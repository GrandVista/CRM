import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";

export async function GET(request: Request) {
  const result = await requireRole(request, ["admin"]);
  if (result instanceof NextResponse) return result;

  return NextResponse.json({
    message: "admin 权限验证通过",
    user: {
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      name: result.user.name,
    },
  });
}
