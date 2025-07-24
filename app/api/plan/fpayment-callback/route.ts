import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

const MERCHANT_ID = process.env.FPAY_MERCHANT_ID || "68824e41092da";
const API_KEY = process.env.FPAY_API_KEY || "74ee736b70b6cb022fc8091720fa29b568824e41092e8";

function sanitize(input: any) {
  if (typeof input !== "string") return "";
  return input.trim().replace(/[<>'"\\]/g, "");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const request_id = sanitize(searchParams.get("request_id"));
  const merchant_id = sanitize(searchParams.get("merchant_id"));
  const api_key = sanitize(searchParams.get("api_key"));
  const amount = sanitize(searchParams.get("amount"));
  const received = sanitize(searchParams.get("received"));
  const status = sanitize(searchParams.get("status"));
  const from_address = sanitize(searchParams.get("from_address"));
  const transaction_id = sanitize(searchParams.get("transaction_id"));

  let debugLog: any = { request_id, merchant_id, api_key, amount, received, status, from_address, transaction_id };

  if (!request_id || !merchant_id || !api_key || !received || !status) {
    debugLog.error = "Thiếu tham số callback.";
    return NextResponse.json({ status: "error", message: "Thiếu tham số callback.", debugLog }, { status: 400 });
  }

  if (merchant_id !== MERCHANT_ID || api_key !== API_KEY) {
    debugLog.error = "Merchant ID hoặc API Key không hợp lệ.";
    return NextResponse.json({ status: "error", message: "Merchant ID hoặc API Key không hợp lệ.", debugLog }, { status: 403 });
  }

  // Parse userId từ request_id: user_{userId}_timestamp
  let userId = "";
  const match = request_id.match(/^user_(.+?)_/);
  if (match) {
    userId = match[1];
  }
  debugLog.userId = userId;

  let updateResult: any = null;

  switch (status) {
    case "waiting":
      break;
    case "expired":
      break;
    case "completed":
      if (userId) {
        try {
          updateResult = await prisma.user.update({
            where: { id: userId },
            data: {
              team: "premium",
              planExpiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 ngày
            },
          });
          debugLog.updateResult = updateResult;
        } catch (e) {
          debugLog.updateError = e;
          return NextResponse.json({ status: "error", message: "Không nâng cấp được user.", debugLog }, { status: 500 });
        }
      } else {
        debugLog.updateError = "Không tìm thấy userId trong request_id";
      }
      break;
    default:
      debugLog.error = "Trạng thái giao dịch không hợp lệ.";
      return NextResponse.json({ status: "error", message: "Trạng thái giao dịch không hợp lệ.", debugLog }, { status: 400 });
  }

  return NextResponse.json({ status: "success", message: "Callback đã được xử lý thành công.", debugLog });
} 