import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    console.log("Email nhận được để xoá:", email);
    const token = await prisma.googleToken.findUnique({ where: { email } });
    console.log("Token tìm được trong DB:", token);
    if (!email) {
      return NextResponse.json({ error: "Thiếu email" }, { status: 400 });
    }
    await prisma.googleToken.delete({ where: { email } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e?.message || JSON.stringify(e) || "Lỗi server" }, { status: 500 });
  }
} 