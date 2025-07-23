import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

// Đặt Access Token thực tế ở biến môi trường hoặc config an toàn
const ACCESS_TOKEN = process.env.WEB2M_ACCESS_TOKEN || "YOUR_ACCESS_TOKEN";

// Quy ước: amount và description xác định plan và user
const PLAN_PRICES = {
  500000: "premium", // 500.000 VND -> premium
  2000000: "business", // 2.000.000 VND -> business
};

export async function POST(req: NextRequest) {
  // Kiểm tra header Authorization
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response("Access Token không được cung cấp hoặc không hợp lệ.", { status: 401 });
  }
  const bearerToken = authHeader.slice(7);
  if (bearerToken !== ACCESS_TOKEN) {
    return new Response("Chữ ký không hợp lệ.", { status: 401 });
  }

  // Nhận dữ liệu JSON
  let data;
  try {
    data = await req.json();
  } catch {
    return new Response("Dữ liệu không hợp lệ.", { status: 400 });
  }

  // Xử lý từng giao dịch
  if (data && Array.isArray(data.data)) {
    for (const tx of data.data) {
      // Ví dụ: description chứa email user, amount xác định plan
      const { amount, description } = tx;
      const plan = PLAN_PRICES[Number(amount)];
      if (!plan) continue;
      // Tìm email trong description (giả sử có dạng ... email@example.com ...)
      const emailMatch = description.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (!emailMatch) continue;
      const email = emailMatch[0];
      // Tìm user theo email
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) continue;
      // Cập nhật team cho user
      await prisma.user.update({ where: { id: user.id }, data: { team: plan } });
    }
  }

  // Trả về phản hồi thành công
  return Response.json({ status: true, msg: "OK" });
} 