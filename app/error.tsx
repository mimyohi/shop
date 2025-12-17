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
        {/* 아이콘 */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 border-2 border-gray-300 rounded-full">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

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
