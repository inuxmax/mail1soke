"use client";
import { useEffect, useState } from "react";

export default function GoogleCallbackPage() {
  const [status, setStatus] = useState("Đang xử lý...");
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Lấy code từ URL query
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      setStatus("Không lấy được mã code từ Google!");
      return;
    }
    // Gọi Google API lấy access_token và refresh_token
    fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_MULTI || "YOUR_GOOGLE_CLIENT_ID_MULTI",
        client_secret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || "YOUR_GOOGLE_CLIENT_SECRET",
        redirect_uri: window.location.origin + "/google-callback",
        grant_type: "authorization_code",
      }),
    })
      .then(res => res.json())
      .then(async tokenData => {
        console.log("Google Token Response:", JSON.stringify(tokenData, null, 2));
        if (!tokenData.access_token) {
          setStatus("Không lấy được accessToken từ Google!");
          return;
        }
        // Gọi Google API lấy email
        const userInfo = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        }).then(res => res.json());
        if (!userInfo.email) {
          setStatus("Không lấy được email từ Google!");
          return;
        }
        setEmail(userInfo.email);
        // Gửi về API lưu token (cả accessToken và refreshToken nếu có)
        const res2 = await fetch("/api/save-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            email: userInfo.email,
          }),
        });
        if (res2.ok) {
          setStatus("Đã lưu accessToken thành công!");
        } else {
          setStatus("Lỗi khi lưu accessToken!");
        }
      })
      .catch(() => setStatus("Lỗi khi lấy accessToken từ Google!"));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Google Callback</h1>
      <div className="mb-2">{status}</div>
      {email && <div>Email: <b>{email}</b></div>}
      <a href="/connect-token" className="mt-4 text-blue-600 underline">Quay lại trang kết nối</a>
    </div>
  );
} 