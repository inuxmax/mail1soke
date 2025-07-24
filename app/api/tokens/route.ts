export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/db";

async function isTokenValid(accessToken) {
  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_MULTI || "",
    client_secret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || "",
    refresh_token: refreshToken || "",
    grant_type: 'refresh_token',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token || null;
}

export async function GET() {
  try {
    const tokens = await prisma.gmailToken.findMany();
    for (let token of tokens) {
      if (token.accessToken && !(await isTokenValid(token.accessToken))) {
        if (token.refreshToken) {
          const newAccessToken = await refreshAccessToken(token.refreshToken);
          if (newAccessToken) {
            await prisma.gmailToken.update({
              where: { email: token.email },
              data: { accessToken: newAccessToken, time: new Date() }
            });
          }
        }
      }
    }
    // Lấy lại danh sách mới nhất sau khi cập nhật
    const freshTokens = await prisma.gmailToken.findMany();
    return NextResponse.json(freshTokens);
  } catch (e) {
    console.error('Lỗi đọc DB GmailToken:', e);
    return NextResponse.json([], { status: 200 });
  }
} 