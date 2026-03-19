import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { user } = auth;
  return NextResponse.json({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
}
