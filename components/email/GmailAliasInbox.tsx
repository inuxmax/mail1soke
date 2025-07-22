"use client";
import { useEffect, useState } from "react";

interface Props {
  alias: string;
}

interface Token {
  email: string;
  accessToken: string;
}

export default function GmailAliasInbox({ alias }: Props) {
  const [token, setToken] = useState<Token | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Tìm accessToken phù hợp với alias
  useEffect(() => {
    fetch("/api/tokens")
      .then(res => res.json())
      .then((data: Token[]) => {
        if (!Array.isArray(data)) return;
        const aliasUser = alias.split("@")[0].replace(/\./g, "").split("+")[0];
        const found = data.find(t => t.email.split("@")[0] === aliasUser);
        if (found) setToken(found);
        else setToken(null);
      });
  }, [alias]);

  // Fetch inbox alias Gmail, tự động reload mỗi 15 giây
  useEffect(() => {
    if (!token) return;
    let interval: NodeJS.Timeout;
    const fetchInbox = () => {
      setLoading(true);
      setError("");
      setMessages([]);
      fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=to:${alias}&maxResults=10`,
        { headers: { Authorization: `Bearer ${token.accessToken}` } }
      )
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(async data => {
          if (!data.messages) {
            setMessages([]);
            setSelectedId(null);
            setLoading(false);
            return;
          }
          // Lấy chi tiết từng thư (subject, from, date, body)
          const details = await Promise.all(
            data.messages.map(async (msg: any) => {
              const r = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
                { headers: { Authorization: `Bearer ${token.accessToken}` } }
              );
              if (!r.ok) return null;
              const d = await r.json();
              const headers = d.payload?.headers || [];
              const get = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
              // Lấy body (text hoặc html)
              let body = "";
              if (d.payload?.parts) {
                const part = d.payload.parts.find((p: any) => p.mimeType === "text/plain") || d.payload.parts[0];
                body = atob(part?.body?.data?.replace(/-/g, "+").replace(/_/g, "/") || "");
              } else if (d.payload?.body?.data) {
                body = atob(d.payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
              }
              return {
                id: msg.id,
                subject: get("subject"),
                from: get("from"),
                date: get("date"),
                body,
              };
            })
          );
          setMessages(details.filter(Boolean));
          // Nếu có mail mới và chưa chọn, tự động chọn mail đầu tiên
          if (details.length > 0 && !selectedId) {
            setSelectedId(details[0]?.id);
          }
          setLoading(false);
        })
        .catch(() => {
          setError("Lỗi khi lấy inbox alias Gmail!");
          setLoading(false);
        });
    };
    fetchInbox();
    interval = setInterval(fetchInbox, 15000);
    return () => clearInterval(interval);
  }, [token, alias]);

  if (!token) return <div className="text-red-500">Email lỗi liên hệ với admin.</div>;

  return (
    <div className="mb-2">
      <div className="font-semibold text-xs text-blue-700 mb-1">Gmail inbox: {alias}</div>
      {loading && <div>Đang tải inbox Gmail...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {messages.length === 0 && !loading && <div className="text-xs text-gray-500">Không có thư nào gửi đến Email này.</div>}
      {messages.length > 0 && (
        <div>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`border-b bg-neutral-100/50 px-3 py-2 hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-900 hover:dark:bg-neutral-700 cursor-pointer ${selectedId === msg.id ? "bg-blue-50" : ""}`}
              onClick={() => setSelectedId(msg.id)}
            >
              <div className="flex items-center justify-between">
                <span className="w-3/4 truncate text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  {msg.subject || "(No subject)"}
                </span>
                <span className="ml-auto text-xs text-neutral-600 dark:text-neutral-400">
                  {msg.date}
                </span>
              </div>
              <div className="mb-0.5 line-clamp-1 w-3/4 truncate text-xs font-medium text-neutral-600 dark:text-neutral-400">
                {msg.from}
              </div>
            </div>
          ))}
          {selectedId && (
            <div className="border rounded bg-white p-4 mt-2">
              <div className="font-bold mb-2">
                {messages.find((m) => m.id === selectedId)?.subject}
              </div>
              <div className="text-xs text-gray-600 mb-1">
                From: {messages.find((m) => m.id === selectedId)?.from} | Date: {messages.find((m) => m.id === selectedId)?.date}
              </div>
              <div className="whitespace-pre-line text-sm bg-gray-50 p-2 rounded border mt-1">
                {messages.find((m) => m.id === selectedId)?.body}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 