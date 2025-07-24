import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join, resolve } from 'path';

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
    const tokensPath = resolve(process.cwd(), 'tokens.json');
    console.log('TOKENS_PATH (tokens):', tokensPath);
    const data = await readFile(tokensPath, 'utf8');
    let tokens = JSON.parse(data);
    let updated = false;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.accessToken && !(await isTokenValid(token.accessToken))) {
        if (token.refreshToken) {
          const newAccessToken = await refreshAccessToken(token.refreshToken);
          if (newAccessToken) {
            tokens[i].accessToken = newAccessToken;
            tokens[i].time = new Date().toISOString();
            updated = true;
          }
        }
      }
    }
    if (updated) {
      try {
        await writeFile(tokensPath, JSON.stringify(tokens, null, 2), 'utf8');
      } catch (err) {
        console.error('Lỗi ghi file tokens.json:', err);
      }
    }
    return NextResponse.json(tokens);
  } catch (e) {
    console.error('Lỗi đọc file tokens.json:', e);
    return NextResponse.json([], { status: 200 });
  }
} 