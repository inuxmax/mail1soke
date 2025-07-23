import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Thiếu email" }, { status: 400 });
    }
    await prisma.googleToken.delete({ where: { email } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
} 