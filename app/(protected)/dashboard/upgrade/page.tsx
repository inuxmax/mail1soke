"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Icons } from "@/components/shared/icons";
import { nFormatter } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  slTrackedClicks: number;
  slNewLinks: number;
  slAnalyticsRetention: number;
  slDomains: number;
  slAdvancedAnalytics: boolean;
  slCustomQrCodeLogo: boolean;
  rcNewRecords: number;
  emEmailAddresses: number;
  emDomains: number;
  emSendEmails: number;
  stMaxFileSize: string;
  stMaxTotalSize: string;
  stMaxFileCount: number;
  appSupport: string;
  appApiAccess: boolean;
  isActive: boolean;
}

const PLAN_PRICES: Record<string, string> = {
  premium: "500.000 VND",
  business: "2.000.000 VND",
  free: "0 VND",
};

const getBenefits = (plan: Plan) => [
  `${nFormatter(plan.slTrackedClicks)} tracked clicks/mo`,
  `${nFormatter(plan.slNewLinks)} new links/mo`,
  `${plan.slAnalyticsRetention}-day analytics retention`,
  `Customize short link QR code: ${plan.slCustomQrCodeLogo ? "Yes" : "No"}`,
  `${nFormatter(plan.emEmailAddresses)} email addresses/mo`,
  `${nFormatter(plan.emSendEmails)} send emails/mo`,
  `${plan.slDomains} domain${plan.slDomains > 1 ? "s" : ""}`,
  `Advanced analytics: ${plan.slAdvancedAnalytics ? "Yes" : "No"}`,
  `${plan.appSupport.charAt(0).toUpperCase() + plan.appSupport.slice(1)} support`,
  `Open API Access: ${plan.appApiAccess ? "Yes" : "No"}`,
];

export default function UpgradePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/plan?all=1")
      .then((res) => res.json())
      .then((data) => {
        setPlans(data.list || []);
        setLoading(false);
      });
    if (typeof window !== "undefined") {
      setUserEmail(window.localStorage.getItem("userEmail") || "");
    }
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleUpgrade = async (plan: Plan) => {
    // TODO: Gọi API tạo session thanh toán Stripe, redirect sang Stripe checkout
    alert(`Chức năng thanh toán sẽ sớm được tích hợp. Bạn chọn nâng cấp lên: ${plan.name}`);
  };

  if (loading) return <div className="p-8 text-center">Đang tải các gói dịch vụ...</div>;

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Nâng cấp tài khoản</h1>
      {/* Hướng dẫn chuyển khoản thủ công */}
      <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2 text-blue-700 flex items-center gap-2">
          <Icons.info className="size-5 text-blue-500" /> Hướng dẫn nâng cấp qua chuyển khoản ngân hàng
        </h2>
        <ol className="list-decimal ml-6 mb-2 text-sm text-blue-900">
          <li>Chuyển khoản đúng số tiền tương ứng với gói bạn muốn nâng cấp:</li>
        </ol>
        <div className="mb-2">
          <table className="w-full text-sm border mb-2">
            <thead>
              <tr className="bg-blue-100">
                <th className="p-2 border">Gói</th>
                <th className="p-2 border">Giá</th>
              </tr>
            </thead>
            <tbody>
              {plans.filter(p => p.name !== "free").map(plan => (
                <tr key={plan.name}>
                  <td className="p-2 border font-semibold capitalize">{plan.name}</td>
                  <td className="p-2 border">{PLAN_PRICES[plan.name] || "Liên hệ"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mb-2 text-sm">
          <span className="font-semibold">Tài khoản nhận:</span> <span className="select-all">Nguyễn Văn A - 123456789 - ACB</span>
          <Button size="sm" className="ml-2 px-2 py-1 text-xs" onClick={() => handleCopy("123456789")}>{copied ? "Đã copy" : "Copy số tài khoản"}</Button>
        </div>
        <ol className="list-decimal ml-6 text-sm text-blue-900">
          <li>Ở phần <b>Nội dung chuyển khoản</b>, vui lòng nhập <b>email đăng ký tài khoản</b> của bạn. Ví dụ: <span className="bg-blue-100 px-1 rounded">user@email.com</span></li>
          <li>Sau khi chuyển khoản thành công, hệ thống sẽ tự động nâng cấp tài khoản trong vòng vài phút.</li>
          <li>Nếu có vấn đề, liên hệ <a href="https://t.me/blackpink2812" target="_blank" className="text-blue-600 underline">Admin hỗ trợ</a>.</li>
        </ol>
      </div>
      {/* Danh sách các gói dịch vụ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="flex flex-col justify-between">
            <CardHeader>
              <h2 className="text-xl font-semibold capitalize mb-2">{plan.name}</h2>
            </CardHeader>
            <CardContent>
              <ul className="mb-4 space-y-1">
                {getBenefits(plan).map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <Icons.check className="text-green-500 size-4" /> {benefit}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-2"
                onClick={() => handleUpgrade(plan)}
                disabled={plan.name === "free"}
              >
                {plan.name === "free" ? "Gói hiện tại" : "Nâng cấp"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 