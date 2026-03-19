import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const REFRESH_TOKEN_COOKIE = "refreshToken";

export async function POST(request: NextRequest) {
  try {
    const refreshTokenValue = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

    if (refreshTokenValue) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshTokenValue },
        data: { revokedAt: new Date() },
      });
    }

    const res = NextResponse.json({ message: "已登出" });
    res.cookies.set(REFRESH_TOKEN_COOKIE, "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
      secure: process.env.NODE_ENV === "production",
    });
    res.cookies.set("token", "", {
      path: "/",
      sameSite: "lax",
      maxAge: 0,
    });

    return res;
  } catch (e) {
    console.error("Logout error:", e);
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
