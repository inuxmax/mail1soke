export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const tokens = await prisma.gmailToken.findMany();
    return NextResponse.json(tokens);
  } catch (e) {
    console.error('Lỗi đọc DB GmailToken:', e);
    return NextResponse.json([], { status: 200 });
  }
} 