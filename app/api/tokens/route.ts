import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

async function isTokenValid(accessToken: string) {
  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function refreshAccessToken(refreshToken: string) {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_MULTI || 'YOUR_GOOGLE_CLIENT_ID_MULTI',
    client_secret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
    refresh_token: refreshToken,
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
    let tokens = await prisma.googleToken.findMany();
    let updated = false;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      try {
        if (token.accessToken && !(await isTokenValid(token.accessToken))) {
          if (token.refreshToken) {
            const newAccessToken = await refreshAccessToken(token.refreshToken);
            if (newAccessToken) {
              await prisma.googleToken.update({
                where: { email: token.email },
                data: {
                  accessToken: newAccessToken,
                  time: new Date(),
                },
              });
              tokens[i].accessToken = newAccessToken;
              tokens[i].time = new Date();
              updated = true;
            }
          }
        }
      } catch (e) {
        // Nếu có lỗi khi kiểm tra token, vẫn giữ token trong danh sách
        // Không throw, không bỏ qua bản ghi
      }
    }
    return NextResponse.json(tokens);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
} 