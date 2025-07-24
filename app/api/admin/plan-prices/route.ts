import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const prices = await req.json(); // { planName: price, ... }
    for (const planName in prices) {
      await prisma.plan.update({
        where: { name: planName },
        data: { price: prices[planName] },
      });
    }
    return NextResponse.json({ status: "success" });
  } catch (e) {
    return NextResponse.json({ status: "error", msg: "Lỗi cập nhật giá plan!" }, { status: 500 });
  }
} 