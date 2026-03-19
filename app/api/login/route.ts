import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = "2h";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

function generateRefreshTokenValue(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "请提供 email 和 password" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "账号不存在" },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { message: "密码错误" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { message: "账号已禁用" },
        { status: 403 }
      );
    }

    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not set");
      return NextResponse.json(
        { message: "服务器配置错误" },
        { status: 500 }
      );
    }

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    const refreshTokenValue = generateRefreshTokenValue();
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenValue,
        expiresAt: refreshExpiresAt,
      },
    });

    const res = NextResponse.json({
      message: "登录成功",
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

    res.cookies.set("refreshToken", refreshTokenValue, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json(
      { message: "服务器错误" },
      { status: 500 }
    );
  }
}
