"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useOrderStore } from "@/store/orderStore";

interface VirtualAccountInfo {
  bank: string;
  accountNumber: string;
  holder: string;
  dueDate: string;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const clearOrder = useOrderStore((state) => state.clearOrder);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CARD");
  const [virtualAccount, setVirtualAccount] =
    useState<VirtualAccountInfo | null>(null);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const isCalledRef = useRef(false);

  useEffect(() => {
    // Strict Mode에서 두 번 호출 방지
    if (isCalledRef.current) return;
    isCalledRef.current = true;

    const confirmPayment = async () => {
      const paymentId = searchParams.get("paymentId");

      if (!paymentId) {
        setError("결제 정보가 올바르지 않습니다.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "결제 확인에 실패했습니다.");
        }

        // 결제 방법 및 가상계좌 정보 저장
        if (data.paymentMethod) {
          setPaymentMethod(data.paymentMethod);
        }
        if (data.virtualAccount) {
          setVirtualAccount(data.virtualAccount);
        }
        if (data.verification?.totalAmount) {
          setTotalAmount(data.verification.totalAmount);
        }

        // 결제 성공 시 주문 정보 초기화
        clearOrder();
        setIsLoading(false);
      } catch (err) {
        console.error("결제 확인 실패:", err);
        setError("결제 확인 처리 중 오류가 발생했습니다.");
        setIsLoading(false);
      }
    };

    confirmPayment();
  }, [searchParams, clearOrder]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">결제를 처리하고 있습니다...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-md mx-auto px-4 py-24">
          <div className="text-center">
            <div className="w-16 h-16 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-gray-500">✕</span>
            </div>
            <h1 className="text-xl font-medium text-gray-900 mb-3">
              결제 실패
            </h1>
            <p className="text-gray-500 mb-8">{error}</p>
            <Link
              href="/products"
              className="inline-block border border-gray-900 text-gray-900 px-6 py-3 hover:bg-gray-900 hover:text-white transition text-sm"
            >
              상품 목록으로 돌아가기
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 날짜 포맷팅 함수
  const formatDueDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${date.getFullYear()}년 ${
        date.getMonth() + 1
      }월 ${date.getDate()}일 ${date.getHours()}시 ${date.getMinutes()}분`;
    } catch {
      return dateStr;
    }
  };

  // 가상계좌 결제인 경우
  const isVirtualAccount = paymentMethod === "VIRTUAL_ACCOUNT";

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* 히어로 배너 */}
      <div className="relative h-32 md:h-40 bg-gray-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-900/40" />
        <div className="relative h-full flex flex-col items-center justify-center text-white">
          <h1 className="text-xl md:text-2xl font-medium tracking-wide">
            {isVirtualAccount ? "가상계좌 발급 완료" : "결제 완료"}
          </h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            {isVirtualAccount
              ? "가상계좌가 발급되었습니다"
              : "주문이 완료되었습니다"}
          </h2>
          <p className="text-sm text-gray-500 mb-2">
            주문번호: {searchParams.get("paymentId")}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            {isVirtualAccount
              ? "아래 계좌로 입금해 주시면 결제가 완료됩니다."
              : "주문하신 상품이 정상적으로 결제되었습니다."}
          </p>

          {/* 가상계좌 정보 */}
          {isVirtualAccount && virtualAccount && (
            <div className="bg-black-50 border border-black-200 rounded-lg p-5 mb-6 text-left">
              <h3 className="text-sm font-medium text-black-800 mb-4 flex items-center gap-2">
                입금 정보
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">은행</span>
                  <span className="text-sm font-medium text-gray-900">
                    {virtualAccount.bank}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">계좌번호</span>
                  <span className="text-sm font-medium text-gray-900 font-mono">
                    {virtualAccount.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">예금주</span>
                  <span className="text-sm font-medium text-gray-900">
                    {virtualAccount.holder}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">입금액</span>
                  <span className="text-sm font-bold text-black-600">
                    {totalAmount.toLocaleString()}원
                  </span>
                </div>
                <div className="pt-3 border-t border-black-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">입금 기한</span>
                    <span className="text-sm font-medium text-red-600">
                      {formatDueDate(virtualAccount.dueDate)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-black-600 mt-4 bg-black-100 p-2 rounded">
                * 입금 기한 내 미입금 시 주문이 자동 취소됩니다.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/profile?tab=orders"
              className="block w-full border border-gray-900 text-gray-900 py-3 hover:bg-gray-900 hover:text-white transition text-sm"
            >
              주문 내역 확인
            </Link>
            <Link
              href="/products"
              className="block w-full border border-gray-300 text-gray-700 py-3 hover:border-gray-900 hover:text-gray-900 transition text-sm"
            >
              쇼핑 계속하기
            </Link>
            <Link
              href="/"
              className="block text-sm text-gray-400 hover:text-gray-900 mt-4 underline underline-offset-4"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
      <Footer />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
