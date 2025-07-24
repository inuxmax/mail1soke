import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import { join, resolve } from "path";
import { prisma } from "@/lib/db";

const TOKENS_PATH = resolve(process.cwd(), "tokens.json");

export async function POST(req: NextRequest) {
  try {
    const { accessToken, email, refreshToken } = await req.json();
    if (!accessToken || !email) {
      return NextResponse.json({ error: "Thiếu accessToken hoặc email" }, { status: 400 });
    }
    let tokens: any[] = [];
    try {
      const data = await readFile(TOKENS_PATH, "utf8");
      tokens = JSON.parse(data);
      if (!Array.isArray(tokens)) tokens = [];
    } catch (e) {
      tokens = [];
    }
    // Tìm token theo email
    const existingIdx = tokens.findIndex(t => t.email === email);
    if (existingIdx !== -1) {
      // Cập nhật accessToken/refreshToken mới nhất
      tokens[existingIdx] = {
        ...tokens[existingIdx],
        accessToken,
        refreshToken: refreshToken || tokens[existingIdx].refreshToken || null,
        time: new Date().toISOString(),
        status: "active"
      };
    } else {
      tokens.push({
        accessToken,
        refreshToken: refreshToken || null,
        email,
        time: new Date().toISOString(),
        status: "active"
      });
    }
    // Lưu vào database GmailToken
    try {
      await prisma.gmailToken.upsert({
        where: { email },
        update: { accessToken, refreshToken, time: new Date(), status: "active" },
        create: { email, accessToken, refreshToken, time: new Date(), status: "active" }
      });
    } catch (err) {
      console.error("Lỗi ghi DB GmailToken:", err);
    }
    try {
      await writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2), "utf8");
      console.log('TOKENS_PATH (save-token):', TOKENS_PATH);
    } catch (err) {
      console.error('Lỗi ghi file tokens.json:', err);
      return NextResponse.json({ error: "Lỗi ghi file" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
} 