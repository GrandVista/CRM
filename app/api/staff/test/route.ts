import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";

/** admin 与 staff 均可访问 */
export async function GET(request: Request) {
  const result = await requireRole(request, ["admin", "staff"]);
  if (result instanceof NextResponse) return result;

  return NextResponse.json({
    message: "staff 权限验证通过（admin 也可访问）",
    user: {
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      name: result.user.name,
    },
  });
}
