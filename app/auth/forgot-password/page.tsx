"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/supabaseAuth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      setError("비밀번호 재설정 이메일 발송에 실패했습니다. 이메일 주소를 확인해주세요.");
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <Link href="/" className="flex justify-center">
              <h1 className="text-4xl font-bold text-gray-900">SHOP</h1>
            </Link>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              이메일을 확인하세요
            </h2>
          </div>

          <div className="bg-green-50 rounded-lg p-6 text-center">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <p className="text-green-800 font-medium mb-2">
              비밀번호 재설정 이메일이 발송되었습니다.
            </p>
            <p className="text-green-700 text-sm">
              <span className="font-medium">{email}</span>으로 전송된 이메일의 링크를 클릭하여 비밀번호를 재설정해주세요.
            </p>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              이메일이 도착하지 않았나요?
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="text-blue-600 hover:text-blue-500 font-medium text-sm"
            >
              다시 발송하기
            </button>
            <div className="pt-4">
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-500 text-sm"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/" className="flex justify-center">
            <h1 className="text-4xl font-bold text-gray-900">SHOP</h1>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            비밀번호 찾기
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            가입한 이메일 주소를 입력하시면
            <br />
            비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="sr-only">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="이메일 주소"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? "발송 중..." : "비밀번호 재설정 이메일 받기"}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              로그인으로 돌아가기
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
