"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import jwt_decode from "jwt-decode";
import { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
const GOOGLE_REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/google-callback` : '';
const GOOGLE_CLIENT_ID_MULTI = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_MULTI || "YOUR_GOOGLE_CLIENT_ID_MULTI";

export default function ConnectTokenPage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ConnectTokenPageContent />
    </GoogleOAuthProvider>
  );
}

function ConnectTokenPageContent() {
  const { data: session } = useSession();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [savedEmails, setSavedEmails] = useState<string[]>([]);

  // Lấy danh sách email đã lưu
  useEffect(() => {
    fetch('/api/tokens')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSavedEmails(data.map((t: any) => t.email));
      });
  }, [status, typeof window !== 'undefined' && window.location.pathname === '/connect-token']);

  const handleSaveToken = async () => {
    setStatus("");
    setError("");
    if (!session) {
      setError("Session không tồn tại. Hãy đăng nhập lại.");
      return;
    }
    const accessToken = (session as any)?.accessToken;
    const email = session.user?.email;
    if (!accessToken || !email) {
      setError("Không lấy được accessToken hoặc email. Hãy đăng nhập lại.");
      return;
    }
    try {
      const res = await fetch("/api/save-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, email }),
      });
      if (res.ok) {
        setStatus("Đã lưu accessToken vào file json thành công!");
      } else {
        setError("Lỗi khi lưu accessToken!");
      }
    } catch (e) {
      setError("Lỗi khi gọi API lưu accessToken!");
    }
  };

  // Thêm hàm tự giải mã JWT không cần thư viện ngoài
  function decodeJwtPayload(token: string) {
    const payload = token.split('.')[1];
    if (!payload) return {};
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    try {
      return JSON.parse(typeof window !== 'undefined' ? atob(padded) : Buffer.from(padded, 'base64').toString('utf-8'));
    } catch {
      return {};
    }
  }

  // Multi-account: Đăng nhập Google mới, lấy accessToken/email và lưu
  const handleGoogleLogin = async (credentialResponse: any) => {
    setStatus("");
    setError("");
    try {
      // Giải mã credential để lấy email (không cần jwt-decode)
      const decoded: any = decodeJwtPayload(credentialResponse.credential);
      const email = decoded.email;
      const accessToken = credentialResponse.credential;
      if (!accessToken || !email) {
        setError("Không lấy được accessToken hoặc email từ Google.");
        return;
      }
      const res = await fetch("/api/save-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, email }),
      });
      if (res.ok) {
        setStatus("Đã lưu accessToken vào file json thành công!");
      } else {
        setError("Lỗi khi lưu accessToken!");
      }
    } catch (e) {
      setError("Lỗi khi đăng nhập Google hoặc lưu accessToken!");
    }
  };

  // Thay GoogleLogin bằng custom button mở popup Google OAuth với prompt=select_account
  function openGoogleOAuthPopup() {
    const SCOPES = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "email",
      "profile"
    ].join(" ");
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID_MULTI}` +
      `&redirect_uri=${GOOGLE_REDIRECT_URI}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&access_type=offline` +
      `&prompt=consent`;
    window.open(url, '_blank', 'width=500,height=600');
  }

  // Thêm hàm xoá tài khoản
  async function handleDeleteEmail(email: string, setStatus: any, setError: any, reload: () => void) {
    try {
      const res = await fetch("/api/delete-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("Đã xoá tài khoản thành công!");
        setSavedEmails(prev => prev.filter(e => e !== email)); // Xoá khỏi UI ngay
        reload(); // Vẫn reload lại từ API để đồng bộ
      } else {
        setError("Lỗi khi xoá tài khoản!");
      }
    } catch {
      setError("Lỗi khi gọi API xoá tài khoản!");
    }
  }

  const reloadEmails = () => {
    fetch('/api/tokens')
      .then(res => res.json())
      .then(data => {
        console.log("Reloaded tokens:", data); // Log dữ liệu trả về để debug
        if (Array.isArray(data)) setSavedEmails(data.map((t: any) => t.email));
      });
  };

  function useTokenStatus(emailList: string[]) {
    const [statusMap, setStatusMap] = useState<Record<string, 'valid' | 'invalid' | 'checking'>>({});
    useEffect(() => {
      if (!emailList || emailList.length === 0) return;
      setStatusMap(Object.fromEntries(emailList.map(e => [e, 'checking'])));
      fetch('/api/tokens')
        .then(res => res.json())
        .then((tokens) => {
          emailList.forEach(email => {
            const token = tokens.find((t: any) => t.email === email);
            if (!token) {
              setStatusMap(prev => ({ ...prev, [email]: 'invalid' }));
              return;
            }
            fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
              headers: { Authorization: `Bearer ${token.accessToken}` },
            })
              .then(r => setStatusMap(prev => ({ ...prev, [email]: r.ok ? 'valid' : 'invalid' })))
              .catch(() => setStatusMap(prev => ({ ...prev, [email]: 'invalid' })));
          });
        });
    }, [emailList]);
    return statusMap;
  }

  const tokenStatus = useTokenStatus(savedEmails);

  useEffect(() => {
    if (!savedEmails || savedEmails.length === 0) return;
    // BỎ chức năng tự động xoá token khi accessToken hết hạn
    // const invalids = savedEmails.filter(email => tokenStatus[email] === 'invalid');
    // if (invalids.length > 0) {
    //   invalids.forEach(email => {
    //     handleDeleteEmail(email, setStatus, setError, reloadEmails);
    //   });
    // }
    // eslint-disable-next-line
  }, [tokenStatus, savedEmails]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Kết nối Google</h1>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => signIn("google")}
        >
          Đăng nhập với Google
        </button>
      </div>
    );
  }
  if (session.user.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Không có quyền truy cập</h1>
        <div>Bạn cần quyền ADMIN để truy cập trang này.</div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kết nối Google & Lưu accessToken</h1>
        <div className="flex gap-4 items-center">
          <button className="text-sm text-blue-500" onClick={openGoogleOAuthPopup}>Kết nối Google khác</button>
          <button className="text-sm text-red-500" onClick={() => signOut()}>Đăng xuất</button>
        </div>
      </div>
      <div className="mb-4">
        {savedEmails.length === 0 && session && (
          <>
            <div className="mb-2">Email: <b>{session.user?.email}</b></div>
            <button
              className="px-4 py-2 bg-green-500 text-white rounded"
              onClick={handleSaveToken}
            >
              Lưu accessToken vào file json
            </button>
          </>
        )}
        <div className="text-gray-600 text-sm mt-2">
          Để thêm nhiều tài khoản Gmail, chỉ cần bấm <b>Kết nối Google khác</b> và đăng nhập tài khoản mới. Không cần đăng xuất!
        </div>
        {status && <div className="text-green-600 mt-2">{status}</div>}
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
      <div className="mt-8">
        <h2 className="font-semibold mb-2">Các tài khoản Gmail đã lưu:</h2>
        <ul className="list-disc pl-5">
          {savedEmails.map((email, i) => (
            <li key={i} className="break-all flex items-center gap-2">
              {email}
              {tokenStatus[email] === 'valid' && <span className="text-green-600 text-xs ml-1">(Hoạt động)</span>}
              {tokenStatus[email] === 'invalid' && <span className="text-red-600 text-xs ml-1">(Hết hạn)</span>}
              {tokenStatus[email] === 'checking' && <span className="text-gray-400 text-xs ml-1">(Đang kiểm tra...)</span>}
              <button
                className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                onClick={() => handleDeleteEmail(email, setStatus, setError, reloadEmails)}
              >
                Xoá
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 