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
        const result = await updateOrderStatusAction(
          orderId,
          "paid",
          `TEST_PAYMENT_${Date.now()}`
        );
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
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md w-full border border-gray-200 p-8 text-center">
        <h1 className="text-xl font-medium text-gray-900 mb-4">
          테스트 결제 완료
        </h1>
        <p className="text-gray-600 text-sm">
          이것은 테스트 결제입니다. 실제 결제가 진행되지 않았습니다.
        </p>
        {orderId && (
          <p className="text-gray-500 text-sm mb-6">주문 ID: {orderId}</p>
        )}
        <p className="text-gray-400 text-sm mb-8">
          주문이 정상적으로 생성되었습니다.
          <br />
          관리자 페이지에서 주문을 확인할 수 있습니다.
        </p>
        <div className="space-y-3">
          <Link
            href="/profile?tab=orders"
            className="block w-full border border-gray-900 text-gray-900 px-6 py-3 hover:bg-gray-900 hover:text-white transition text-sm"
          >
            주문 내역 확인
          </Link>
          <Link
            href="/products"
            className="block w-full border border-gray-300 text-gray-700 px-6 py-3 hover:border-gray-900 hover:text-gray-900 transition text-sm"
          >
            쇼핑 계속하기
          </Link>
          <Link
            href="/"
            className="block text-sm text-gray-400 hover:text-gray-900 mt-4 underline underline-offset-4"
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
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
        </div>
      }
    >
      <TestSuccessContent />
    </Suspense>
  );
}
