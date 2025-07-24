'use client';

import React, { useState, useEffect } from "react";

interface Plan {
  id: string;
  name: string;
  price: number;
  description?: string;
}

const PLAN_PRICES: Record<string, number> = {
  premium: 1,
  business: 30,
  free: 0,
};

export default function UpgradePlanPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [urlPayment, setUrlPayment] = useState("");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    fetch("/api/plan?all=1")
      .then(res => res.json())
      .then(data => {
        if (data && data.list) {
          const plansWithPrice = data.list.map((p: any) => ({
            ...p,
            price: PLAN_PRICES[p.name] || 0,
            description: p.description || `Gói ${p.name}`,
          }));
          setPlans(plansWithPrice);
        }
      });
    // Lấy userId hiện tại
    fetch("/api/user")
      .then(res => res.json())
      .then(data => {
        if (data && data.id) setUserId(data.id);
      });
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setStatus("");
    setError("");
    setUrlPayment("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");
    setError("");
    setUrlPayment("");
    if (!selectedPlan) {
      setError("Vui lòng chọn gói nâng cấp.");
      return;
    }
    if (!userId) {
      setError("Không xác định được user. Vui lòng đăng nhập lại.");
      return;
    }
    try {
      const res = await fetch("/api/plan/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Nâng cấp ${selectedPlan.name}`,
          description: selectedPlan.description,
          amount: selectedPlan.price,
          userId,
        })
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setStatus("Tạo hóa đơn thành công!");
        setUrlPayment(data.data.url_payment);
      } else {
        setError(data.msg || "Lỗi khi tạo hóa đơn!");
      }
    } catch (e) {
      setError("Lỗi kết nối server!");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Nâng cấp Plan - Thanh toán USDT</h1>
      <div className="mb-6">
        <div className="grid grid-cols-1 gap-4">
          {plans.map(plan => (
            <button
              key={plan.id}
              type="button"
              className={`border rounded p-4 text-left w-full ${selectedPlan?.id === plan.id ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}
              onClick={() => handleSelectPlan(plan)}
            >
              <div className="font-bold text-lg capitalize">{plan.name}</div>
              <div className="text-gray-600 mb-1">{plan.description}</div>
              <div className="text-blue-600 font-semibold">Giá: {plan.price} USDT</div>
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Tên hóa đơn</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            value={selectedPlan ? `Nâng cấp ${selectedPlan.name}` : ""}
            readOnly
            placeholder="Chọn gói phía trên"
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Mô tả hóa đơn</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            value={selectedPlan?.description || ""}
            readOnly
            placeholder="Chọn gói phía trên"
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Số lượng USDT</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            value={selectedPlan?.price || ""}
            readOnly
            placeholder="Chọn gói phía trên"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={!selectedPlan}
        >
          Tạo hóa đơn
        </button>
        {status && <div className="text-green-600 mt-2">{status}</div>}
        {error && <div className="text-red-600 mt-2">{error}</div>}
        {urlPayment && (
          <div className="mt-4">
            <a
              href={urlPayment}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Thanh toán ngay
            </a>
          </div>
        )}
      </form>
    </div>
  );
} 