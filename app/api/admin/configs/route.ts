import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";
import { getMultipleConfigs } from "@/lib/dto/system-config";

export async function GET(req: NextRequest) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;
    if (user.role !== "ADMIN") {
      return Response.json("Unauthorized", { status: 401 });
    }

    const configs = await getMultipleConfigs([
      "enable_user_registration",
      "enable_subdomain_apply",
      "system_notification",
      "enable_github_oauth",
      "enable_google_oauth",
      "enable_liunxdo_oauth",
      "enable_resend_email_login",
      "enable_email_password_login",
      "enable_email_catch_all",
      "catch_all_emails",
      "enable_tg_email_push",
      "tg_email_bot_token",
      "tg_email_chat_id",
      "tg_email_template",
      "tg_email_target_white_list",
      "enable_email_registration_suffix_limit",
      "email_registration_suffix_limit_white_list",
      "enable_subdomain_status_email_pusher",
      // Thêm các key động nếu cần
      "FPAY_MERCHANT_ID",
      "FPAY_API_KEY",
    ]);

    return Response.json(configs, { status: 200 });
  } catch (error) {
    console.error("[Error]", error);
    return Response.json(error.message || "Server error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Lưu tất cả key động vào system_configs
    for (const key in body) {
      await prisma.systemConfig.upsert({
        where: { key },
        update: { value: body[key], updatedAt: new Date() },
        create: { key, value: body[key], type: "STRING" },
      });
    }
    return NextResponse.json({ status: "success" });
  } catch (e) {
    return NextResponse.json({ status: "error", msg: "Lỗi lưu configs!" }, { status: 500 });
  }
}
