import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { accessToken, email, refreshToken } = await req.json();
    if (!accessToken || !email) {
      return NextResponse.json({ error: "Thiếu accessToken hoặc email" }, { status: 400 });
    }
    await prisma.googleToken.upsert({
      where: { email },
      update: {
        accessToken,
        refreshToken: refreshToken || undefined,
        time: new Date(),
        status: "active"
      },
      create: {
        accessToken,
        refreshToken: refreshToken || undefined,
        email,
        time: new Date(),
        status: "active"
      }
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
} 