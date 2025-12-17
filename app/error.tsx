"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-md pt-20">
        {/* 메시지 */}
        <h1 className="text-2xl font-medium text-gray-900 mb-3">
          오류가 발생했습니다
        </h1>

        <p className="text-gray-500 mb-8">
          일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>

        {/* 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pb-20">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-8 py-3 border border-gray-900 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
