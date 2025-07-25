"use client";
import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";

interface Token {
  email: string;
  accessToken: string;
}

export default function GmailInboxPage() {
  const { data: session } = useSession();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Các hook luôn được gọi
  useEffect(() => {
    const fetchTokens = () => {
      fetch("/api/tokens")
        .then(res => res.json())
        .then(data => setTokens(Array.isArray(data) ? data : []));
    };
    fetchTokens();
    const interval = setInterval(fetchTokens, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selected === null || !tokens[selected]) return;
    const fetchInbox = async () => {
      setLoading(true);
      setError("");
      setMessages([]);
      const token = tokens[selected];
      if (!token) return;
      try {
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10`,
          {
            headers: { Authorization: `Bearer ${token.accessToken}` },
          }
        );
        if (!res.ok) throw new Error("Không lấy được danh sách thư");
        const data = await res.json();
        if (!data.messages) {
          setMessages([]);
          setLoading(false);
          return;
        }
        const details = await Promise.all(
          data.messages.map(async (msg: any) => {
            const r = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=subject&metadataHeaders=from&metadataHeaders=date`,
              { headers: { Authorization: `Bearer ${token.accessToken}` } }
            );
            if (!r.ok) return null;
            const d = await r.json();
            const headers = d.payload?.headers || [];
            const get = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
            return {
              id: msg.id,
              subject: get("subject"),
              from: get("from"),
              date: get("date"),
            };
          })
        );
        setMessages(details.filter(Boolean));
      } catch (e) {
        setError("Lỗi khi lấy inbox Gmail!");
      }
      setLoading(false);
    };
    fetchInbox();
    const interval = setInterval(fetchInbox, 15000);
    return () => clearInterval(interval);
  }, [selected, tokens]);

  const fetchInbox = async (idx: number) => {
    setLoading(true);
    setError("");
    setMessages([]);
    const token = tokens[idx];
    if (!token) return;
    try {
      const res = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10",
        {
          headers: { Authorization: `Bearer ${token.accessToken}` },
        }
      );
      if (!res.ok) throw new Error("Không lấy được danh sách thư");
      const data = await res.json();
      if (!data.messages) {
        setMessages([]);
        setLoading(false);
        return;
      }
      // Lấy chi tiết từng thư (subject, from, date)
      const details = await Promise.all(
        data.messages.map(async (msg: any) => {
          const r = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=subject&metadataHeaders=from&metadataHeaders=date`,
            { headers: { Authorization: `Bearer ${token.accessToken}` } }
          );
          if (!r.ok) return null;
          const d = await r.json();
          const headers = d.payload?.headers || [];
          const get = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
          return {
            id: msg.id,
            subject: get("subject"),
            from: get("from"),
            date: get("date"),
          };
        })
      );
      setMessages(details.filter(Boolean));
    } catch (e) {
      setError("Lỗi khi lấy inbox Gmail!");
    }
    setLoading(false);
  };

  // Chỉ điều kiện hóa phần return giao diện
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Gmail Inbox</h1>
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
    <div className="flex gap-8 p-8">
      <div className="w-64 border-r pr-4">
        <h2 className="font-bold mb-2">Tài khoản Gmail</h2>
        <ul>
          {tokens.map((t, i) => (
            <li key={t.email}>
              <button
                className={`block w-full text-left px-2 py-1 rounded mb-1 ${selected === i ? "bg-blue-100 font-bold" : "hover:bg-gray-100"}`}
                onClick={() => {
                  setSelected(i);
                  fetchInbox(i);
                }}
              >
                {t.email}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1">
        {!tokens.length && <div>Chưa có tài khoản Gmail nào được lưu.</div>}
        {selected === null && tokens.length > 0 && (
          <div>Chọn một tài khoản Gmail để xem inbox.</div>
        )}
        {loading && <div>Đang tải inbox...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {messages.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Inbox (10 thư mới nhất):</h3>
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Subject</th>
                  <th className="p-2 text-left">From</th>
                  <th className="p-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg, i) => (
                  <tr key={msg.id} className="border-t">
                    <td className="p-2">{msg.subject}</td>
                    <td className="p-2">{msg.from}</td>
                    <td className="p-2">{msg.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 