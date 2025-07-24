import { NextRequest, NextResponse } from "next/server";

// Bảo mật: Lưu merchant_id và api_key ở biến môi trường
const MERCHANT_ID = process.env.FPAY_MERCHANT_ID || "68824e41092da";
const API_KEY = process.env.FPAY_API_KEY || "74ee736b70b6cb022fc8091720fa29b568824e41092e8";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const { name, description, amount, userId } = await req.json();
    if (!name || !description || !amount || !userId) {
      return NextResponse.json({ status: "error", msg: "Thiếu thông tin." }, { status: 400 });
    }
    // request_id chứa userId để callback xác định user
    const request_id = `user_${userId}_${Date.now()}_${Math.floor(Math.random()*10000)}`;
    const callback_url = `${APP_URL}/api/plan/fpayment-callback`;
    const success_url = `${APP_URL}/dashboard/upgrade/success`;
    const cancel_url = `${APP_URL}/upgrade/cancel`;

    // Gọi API fpayment
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
      // TODO: Lưu thông tin hóa đơn vào DB nếu cần
      return NextResponse.json(data);
    } else {
      return NextResponse.json({ status: "error", msg: data.msg || "Tạo hóa đơn thất bại!" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ status: "error", msg: "Lỗi server!" }, { status: 500 });
  }
} 