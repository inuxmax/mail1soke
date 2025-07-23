import { NextRequest } from "next/server";

// TODO: Cài đặt Stripe SDK và cấu hình khoá bí mật STRIPE_SECRET_KEY trong biến môi trường
// import Stripe from "stripe";
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2022-11-15" });

export async function POST(req: NextRequest) {
  try {
    // const { planName } = await req.json();
    // TODO: Tạo session thanh toán Stripe dựa trên planName
    // const session = await stripe.checkout.sessions.create({ ... });
    // return Response.json({ url: session.url });
    return Response.json({ message: "Stripe chưa được cấu hình. Vui lòng cài đặt stripe và cấu hình STRIPE_SECRET_KEY." }, { status: 501 });
  } catch (error) {
    return Response.json({ error: error.message || "Server error" }, { status: 500 });
  }
} 