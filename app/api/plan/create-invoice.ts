import { NextRequest, NextResponse } from "next/server";

// Bảo mật: Lưu merchant_id và api_key ở biến môi trường
const MERCHANT_ID = process.env.FPAY_MERCHANT_ID || "68824e41092da";
const API_KEY = process.env.FPAY_API_KEY || "74ee736b70b6cb022fc8091720fa29b568824e41092e8";

export async function POST(req: NextRequest) {
  try {
    const { name, description, amount } = await req.json();
    if (!name || !description || !amount) {
      return NextResponse.json({ status: "error", msg: "Thiếu thông tin." }, { status: 400 });
    }
    // Tạo request_id bí mật (có thể dùng userId + timestamp)
    const request_id = `req_${Date.now()}_${Math.floor(Math.random()*10000)}`;
    // URL callback, success, cancel (cần sửa lại cho đúng domain của bạn)
    const callback_url = process.env.FPAY_CALLBACK_URL || "https://96a960c26e20.ngrok-free.app/api/plan/fpayment-callback";
    const success_url = process.env.FPAY_SUCCESS_URL || "https://96a960c26e20.ngrok-free.app/upgrade/success";
    const cancel_url = process.env.FPAY_CANCEL_URL || "https://96a960c26e20.ngrok-free.app/upgrade/cancel";

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