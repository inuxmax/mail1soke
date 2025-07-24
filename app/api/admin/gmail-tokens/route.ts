import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const tokens = await prisma.gmailToken.findMany({
      orderBy: { time: "desc" },
    });
    return NextResponse.json(tokens);
  } catch (e) {
    return NextResponse.json([], { status: 200 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ status: "error", msg: "Thiếu email" }, { status: 400 });
    }
    await prisma.gmailToken.deleteMany({ where: { email } });
    return NextResponse.json({ status: "success" });
  } catch (e) {
    return NextResponse.json({ status: "error", msg: "Lỗi server" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { email, accessToken, refreshToken } = await req.json();
    if (!email) {
      return NextResponse.json({ status: "error", msg: "Thiếu email" }, { status: 400 });
    }
    const updated = await prisma.gmailToken.updateMany({
      where: { email },
      data: { accessToken, refreshToken, time: new Date() },
    });
    return NextResponse.json({ status: "success", updated });
  } catch (e) {
    return NextResponse.json({ status: "error", msg: "Lỗi server" }, { status: 500 });
  }
} 