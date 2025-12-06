"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

function CheckoutFailContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") || "결제에 실패했습니다.";

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* 히어로 배너 */}
      <div className="relative h-32 md:h-40 bg-gray-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-900/40" />
        <div className="relative h-full flex flex-col items-center justify-center text-white">
          <h1 className="text-xl md:text-2xl font-medium tracking-wide">
            결제 실패
          </h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-red-500">✕</span>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-3">
            결제를 완료하지 못했습니다
          </h2>
          <p className="text-sm text-gray-500 mb-8">{message}</p>

          <div className="space-y-3">
            <Link
              href="/checkout"
              className="block w-full bg-gray-900 text-white py-3 rounded hover:bg-gray-800 transition text-sm"
            >
              다시 시도하기
            </Link>
            <Link
              href="/products"
              className="block w-full border border-gray-200 text-gray-700 py-3 rounded hover:bg-gray-50 transition text-sm"
            >
              상품 목록으로 돌아가기
            </Link>
            <Link
              href="/"
              className="block text-sm text-gray-500 hover:text-gray-900 mt-4"
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

export default function CheckoutFailPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CheckoutFailContent />
    </Suspense>
  );
}
