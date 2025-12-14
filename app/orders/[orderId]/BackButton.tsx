"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="text-sm text-gray-500 hover:text-gray-900 mb-2 flex items-center gap-1"
    >
      <span>←</span> 뒤로가기
    </button>
  );
}
