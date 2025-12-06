"use client";

import { useEffect, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useOrderStore } from "@/store/orderStore";
import { updateOrderStatusAction } from "@/lib/actions/orders.actions";

function TestSuccessContent() {
  const searchParams = useSearchParams();
  const clearOrder = useOrderStore((state) => state.clearOrder);
  const orderId = searchParams.get("orderId");
  const [statusUpdated, setStatusUpdated] = useState(false);

  useEffect(() => {
    // 테스트 결제 완료 시 주문 정보 초기화
    clearOrder();

    // 주문 상태를 paid로 업데이트
    const updateStatus = async () => {
      if (orderId && !statusUpdated) {
        const result = await updateOrderStatusAction(orderId, "paid", `TEST_PAYMENT_${Date.now()}`);
        if (result.success) {
          setStatusUpdated(true);
        } else {
          console.error("Failed to update order status:", result.error);
        }
      }
    };
    updateStatus();
  }, [clearOrder, orderId, statusUpdated]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
        <div className="text-orange-500 text-5xl mb-4">🧪</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          테스트 결제 완료
        </h1>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-orange-700 text-sm font-medium">
            이것은 테스트 결제입니다. 실제 결제가 진행되지 않았습니다.
          </p>
        </div>
        {orderId && (
          <p className="text-gray-600 mb-6">주문 ID: {orderId}</p>
        )}
        <p className="text-gray-500 text-sm mb-8">
          주문이 정상적으로 생성되었습니다.
          <br />
          관리자 페이지에서 주문을 확인할 수 있습니다.
        </p>
        <div className="space-y-3">
          <Link
            href="/profile?tab=orders"
            className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            주문 내역 확인
          </Link>
          <Link
            href="/products"
            className="block w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            쇼핑 계속하기
          </Link>
          <Link
            href="/"
            className="block w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TestSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      }
    >
      <TestSuccessContent />
    </Suspense>
  );
}
