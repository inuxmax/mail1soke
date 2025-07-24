"use client";
import { useEffect, useState } from "react";
import EmailViewer from "./EmailViewer";

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
    // Hàm fetchInbox: showLoading = true khi lần đầu, false khi reload tự động
    const fetchInbox = (showLoading = false) => {
      if (showLoading) setLoading(true);
      setError("");
      // Đừng setMessages([]) khi reload tự động!
      fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=to:${alias}&maxResults=10`,
        { headers: { Authorization: `Bearer ${token.accessToken}` } }
      )
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(async data => {
          if (!data.messages) {
            if (showLoading) setMessages([]);
            setSelectedId(null);
            if (showLoading) setLoading(false);
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
              // Thêm hàm decode đúng UTF-8
              function decodeBase64Utf8(str: string) {
                str = str.replace(/-/g, "+").replace(/_/g, "/");
                while (str.length % 4) str += "=";
                const binary = atob(str);
                const bytes = new Uint8Array([...binary].map(char => char.charCodeAt(0)));
                return new TextDecoder("utf-8").decode(bytes);
              }
              // Lấy body (text hoặc html)
              let body = "";
              let isHtml = false;
              if (d.payload?.parts) {
                // Ưu tiên lấy HTML nếu có
                const htmlPart = d.payload.parts.find((p: any) => p.mimeType === "text/html");
                const textPart = d.payload.parts.find((p: any) => p.mimeType === "text/plain");
                if (htmlPart) {
                  body = decodeBase64Utf8(htmlPart.body.data);
                  isHtml = true;
                } else if (textPart) {
                  body = decodeBase64Utf8(textPart.body.data);
                  isHtml = false;
                } else {
                  const part = d.payload.parts[0];
                  body = decodeBase64Utf8(part?.body?.data || "");
                  isHtml = part?.mimeType === "text/html";
                }
              } else if (d.payload?.body?.data) {
                body = decodeBase64Utf8(d.payload.body.data);
                isHtml = d.payload.mimeType === "text/html";
              }
              return {
                id: msg.id,
                subject: get("subject"),
                from: get("from"),
                date: get("date"),
                body,
                isHtml,
              };
            })
          );
          setMessages(details.filter(Boolean));
          // Nếu có mail mới và chưa chọn, tự động chọn mail đầu tiên
          if (details.length > 0 && !selectedId) {
            setSelectedId(details[0]?.id);
          }
          if (showLoading) setLoading(false);
        })
        .catch(() => {
          setError("Lỗi khi lấy inbox alias Gmail!");
          if (showLoading) setLoading(false);
        });
    };
    fetchInbox(true); // Lần đầu show loading
    interval = setInterval(() => fetchInbox(false), 15000); // Tự động, không loading
    return () => clearInterval(interval);
  }, [token, alias]);

  if (!token) return <div className="text-red-500">Email lỗi liên hệ với admin.</div>;

  return (
    <div className="flex flex-row h-full">
      {/* Danh sách email */}
      <div className="w-1/3 border-r overflow-y-auto bg-neutral-50 dark:bg-neutral-900">
        <div className="font-semibold text-xs text-blue-700 mb-1 p-2">Gmail inbox: {alias}</div>
        {loading && <div className="p-2">Đang tải inbox Gmail...</div>}
        {error && <div className="text-red-500 p-2">{error}</div>}
        {messages.length === 0 && !loading && <div className="text-xs text-gray-500 p-2">Không có thư nào gửi đến Email này.</div>}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 cursor-pointer border-b hover:bg-gray-100 dark:border-neutral-700 dark:hover:bg-neutral-700 ${selectedId === msg.id ? "bg-blue-50" : ""}`}
            onClick={() => setSelectedId(msg.id)}
          >
            <div className="font-semibold truncate">{msg.subject || "(No subject)"}</div>
            <div className="text-xs text-gray-500 truncate">{msg.from}</div>
            <div className="text-xs text-gray-400">{msg.date}</div>
          </div>
        ))}
      </div>
      {/* Nội dung chi tiết */}
      <div className="flex-1 p-4 overflow-y-auto">
        {selectedId && (
          <>
            <div className="font-bold mb-2">
              {messages.find((m) => m.id === selectedId)?.subject}
            </div>
            <div className="text-xs text-gray-600 mb-1">
              From: {messages.find((m) => m.id === selectedId)?.from} | Date: {messages.find((m) => m.id === selectedId)?.date}
            </div>
            <div className="max-h-[90vh] overflow-y-auto">
              {messages.find((m) => m.id === selectedId)?.isHtml ? (
                <EmailViewer email={messages.find((m) => m.id === selectedId)?.body || ""} />
              ) : (
                <div className="whitespace-pre-line text-sm bg-gray-50 p-2 rounded border mt-1">
                  {messages.find((m) => m.id === selectedId)?.body}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 