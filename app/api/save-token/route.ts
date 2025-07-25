import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import { join } from "path";

const TOKENS_PATH = join(process.cwd(), "tokens.json");

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
    await writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2), "utf8");
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
} 