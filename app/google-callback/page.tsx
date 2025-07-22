"use client";
import { useEffect, useState } from "react";

export default function GoogleCallbackPage() {
  const [status, setStatus] = useState("Đang xử lý...");
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Lấy access_token từ URL hash
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    if (!accessToken) {
      setStatus("Không lấy được accessToken từ Google!");
      return;
    }
    // Gọi Google API lấy email
    fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(res => res.json())
      .then(async data => {
        if (!data.email) {
          setStatus("Không lấy được email từ Google!");
          return;
        }
        setEmail(data.email);
        // Gửi về API lưu token
        const res2 = await fetch("/api/save-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken, email: data.email }),
        });
        if (res2.ok) {
          setStatus("Đã lưu accessToken và email thành công!");
        } else {
          setStatus("Lỗi khi lưu accessToken!");
        }
      })
      .catch(() => setStatus("Lỗi khi gọi Google API!"));
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