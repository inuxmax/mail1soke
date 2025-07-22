// scripts/cleanup-expired-tokens.js

const fs = require('fs/promises');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const TOKENS_PATH = path.join(__dirname, '../tokens.json');

async function cleanupExpiredTokens() {
  let tokens = [];
  try {
    const data = await fs.readFile(TOKENS_PATH, 'utf8');
    tokens = JSON.parse(data);
    if (!Array.isArray(tokens)) tokens = [];
  } catch (e) {
    console.error('Không đọc được tokens.json:', e);
    return;
  }

  const validTokens = [];
  for (const token of tokens) {
    try {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${token.accessToken}` },
      });
      if (res.ok) {
        validTokens.push(token);
      } else {
        console.log(`Token cho ${token.email} hết hạn hoặc không hợp lệ (status: ${res.status})`);
      }
    } catch (err) {
      console.log(`Lỗi khi kiểm tra token cho ${token.email}:`, err);
    }
  }

  await fs.writeFile(TOKENS_PATH, JSON.stringify(validTokens, null, 2), 'utf8');
  console.log(`Đã xoá ${tokens.length - validTokens.length} accessToken hết hạn. Còn lại: ${validTokens.length}`);
}

cleanupExpiredTokens(); 