'use client';

export default function UpgradeSuccessPage() {
  return (
    <div className="max-w-xl mx-auto mt-20 p-8 bg-white rounded shadow text-center">
      <h1 className="text-3xl font-bold mb-4 text-green-600">Thanh toán thành công!</h1>
      <p className="text-lg mb-4">Cảm ơn bạn đã nâng cấp gói dịch vụ. Tài khoản của bạn sẽ được kích hoạt gói mới trong ít phút.</p>
      <a href="/dashboard" className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Quay về Dashboard</a>
    </div>
  );
} 