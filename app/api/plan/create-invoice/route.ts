import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function getConfig(key: string) {
  const config = await prisma.systemConfig.findUnique({ where: { key } });
  return config?.value || "";
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, amount, userId } = await req.json();
    if (!name || !description || !amount || !userId) {
      return NextResponse.json({ status: "error", msg: "Thiếu thông tin." }, { status: 400 });
    }
    // Lấy merchant_id, api_key từ DB
    const MERCHANT_ID = await getConfig("FPAY_MERCHANT_ID");
    const API_KEY = await getConfig("FPAY_API_KEY");
    if (!MERCHANT_ID || !API_KEY) {
      return NextResponse.json({ status: "error", msg: "Chưa cấu hình MERCHANT_ID hoặc API_KEY!" }, { status: 400 });
    }
    const request_id = `user_${userId}_${Date.now()}_${Math.floor(Math.random()*10000)}`;
    const callback_url = `${APP_URL}/api/plan/fpayment-callback`;
    const success_url = `${APP_URL}/dashboard/upgrade/success`;
    const cancel_url = `${APP_URL}/upgrade/cancel`;

    const formData = new URLSearchParams();
    formData.append("merchant_id", MERCHANT_ID);
    formData.append("api_key", API_KEY);
    formData.append("name", name);
    formData.append("description", description);
    formData.append("amount", amount);
    formData.append("request_id", request_id);
    formData.append("callback_url", callback_url);
    formData.append("success_url", success_url);
    formData.append("cancel_url", cancel_url);

    const res = await fetch("https://app.fpayment.net/api/AddInvoice", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.status === "success") {
      return NextResponse.json(data);
    } else {
      return NextResponse.json({ status: "error", msg: data.msg || "Tạo hóa đơn thất bại!" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ status: "error", msg: "Lỗi server!" }, { status: 500 });
  }
} 