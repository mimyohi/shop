"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, signInWithKakao } from "@/lib/supabaseAuth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nextUrl = searchParams?.get("next");
  const errorParam = searchParams?.get("error");

  // URL 에러 파라미터 처리
  useEffect(() => {
    if (errorParam) {
      switch (errorParam) {
        case "email_already_registered":
          setError(
            "이미 이메일로 가입된 계정이 있습니다. 이메일과 비밀번호로 로그인해주세요."
          );
          break;
        case "auth_callback_failed":
          setError("로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
          break;
        default:
          setError("로그인 중 오류가 발생했습니다.");
      }
      // URL에서 에러 파라미터 제거
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [errorParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await signIn(email, password);

    if (error) {
      // Supabase 에러 코드에 따른 구체적인 메시지
      if (error.code === "invalid_credentials") {
        setError("이메일 또는 비밀번호가 일치하지 않습니다. 다시 확인해주세요.");
      } else if (error.code === "email_not_confirmed") {
        setError("이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.");
      } else if (error.code === "user_not_found") {
        setError("가입되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.");
      } else if (error.code === "too_many_requests") {
        setError("로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.");
      } else {
        setError("로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
      setLoading(false);
    } else {
      router.push(nextUrl || "/");
      router.refresh();
    }
  };

  const handleKakaoLogin = async () => {
    setLoading(true);
    const { error } = await signInWithKakao();
    if (error) {
      setError("카카오 로그인에 실패했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center px-4 py-4 md:py-6">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2"
          aria-label="뒤로가기"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-lg font-medium pr-8">로그인</h1>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col px-5 md:px-0 md:max-w-[400px] md:mx-auto md:w-full md:pt-10">
        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400"
              placeholder="아이디"
            />
          </div>
          <div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400"
              placeholder="비밀번호"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#8B8B73] text-white text-sm font-medium rounded-md hover:bg-[#7a7a65] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>

          {/* 카카오 로그인 */}
          <button
            type="button"
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center py-3.5 rounded-md text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "#FEE500", color: "#000000" }}
          >
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.8 1.8 5.3 4.5 6.7-.2.7-.6 2.3-.7 2.7-.1.4.1.4.3.3.2-.1 2.4-1.6 3.2-2.1.6.1 1.1.1 1.7.1 5.5 0 10-3.5 10-7.8S17.5 3 12 3z" />
            </svg>
            카카오로 로그인하기
          </button>
        </form>

        {/* Links */}
        <div className="flex items-center justify-center gap-4 mt-5 text-sm text-gray-500">
          <Link href="/auth/forgot-password" className="hover:text-gray-700">
            아이디 찾기
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/auth/forgot-password" className="hover:text-gray-700">
            비밀번호 찾기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center text-gray-500">로딩 중...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
