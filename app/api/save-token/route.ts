import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import { join } from "path";

const TOKENS_PATH = join(process.cwd(), "tokens.json");

export async function POST(req: NextRequest) {
  try {
    const { accessToken, email } = await req.json();
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
    // Không thêm trùng accessToken
    if (!tokens.some(t => t.accessToken === accessToken)) {
      tokens.push({
        accessToken,
        email,
        time: new Date().toISOString(),
        status: "active"
      });
      await writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2), "utf8");
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
} 