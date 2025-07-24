import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import { join } from "path";

const TOKENS_PATH = join(process.cwd(), "tokens.json");

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Thiếu email" }, { status: 400 });
    }
    let tokens: any[] = [];
    try {
      const data = await readFile(TOKENS_PATH, "utf8");
      tokens = JSON.parse(data);
      if (!Array.isArray(tokens)) tokens = [];
    } catch (e) {
      tokens = [];
    }
    const newTokens = tokens.filter(t => t.email !== email);
    await writeFile(TOKENS_PATH, JSON.stringify(newTokens, null, 2), "utf8");
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
} 