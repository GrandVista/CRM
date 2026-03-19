import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = "2h";
const REFRESH_TOKEN_COOKIE = "refreshToken";

export async function POST(request: NextRequest) {
  try {
    const refreshTokenValue = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    if (!refreshTokenValue) {
      return NextResponse.json({ message: "缺少 refresh token" }, { status: 401 });
    }

    if (!JWT_SECRET) {
      return NextResponse.json({ message: "服务器配置错误" }, { status: 500 });
    }

    const record = await prisma.refreshToken.findFirst({
      where: {
        token: refreshTokenValue,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!record || !record.user.isActive) {
      return NextResponse.json({ message: "refresh token 无效或已过期" }, { status: 401 });
    }

    const user = record.user;
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    const res = NextResponse.json({
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    res.cookies.set("token", accessToken, {
      path: "/",
      sameSite: "lax",
      maxAge: 2 * 60 * 60,
    });

    return res;
  } catch (e) {
    console.error("Refresh error:", e);
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
