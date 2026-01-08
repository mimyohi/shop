"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { useOptionalAuthContext } from "@/providers/AuthProvider";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // AuthProvider에서 서버에서 가져온 인증 상태 사용
  const {
    user: authUser,
    profile,
    isLoading: authLoading,
    isAuthenticated,
    signOut: contextSignOut,
  } = useOptionalAuthContext();

  const { setUser, setUserProfile, clearUser, setIsLoading } = useUserStore();

  // 표시할 사용자 이름 결정
  const displayName =
    profile?.display_name ||
    authUser?.user_metadata?.name ||
    authUser?.user_metadata?.full_name ||
    authUser?.email?.split("@")[0] ||
    "사용자";

  // 인증 상태를 userStore에 동기화
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsLoading(authLoading);

    if (!authLoading) {
      if (isAuthenticated && authUser) {
        setUser(authUser);
        if (profile) {
          setUserProfile(profile);
        }
      } else {
        clearUser();
      }
    }
  }, [
    authLoading,
    isAuthenticated,
    authUser,
    profile,
    setUser,
    setUserProfile,
    clearUser,
    setIsLoading,
  ]);

  const handleSignOut = async () => {
    await contextSignOut();
  };

  const isActive = (path: string) => pathname === path;

  // PC 왼쪽 네비게이션 메뉴
  const leftNavLinks = [
    /** TODO */
    // { href: "/brand", label: "Brand" },
    { href: "/products", label: "Shop" },
  ];

  return (
    <header className="bg-white sticky top-0 z-50">
      {/* 메인 네비게이션 */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[70px] md:h-[87px] flex items-center">
        {/* PC Navigation */}
        <div className="hidden md:flex items-center justify-between w-full">
          {/* 왼쪽: 메뉴 */}
          <div className="flex items-center space-x-8">
            {leftNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium tracking-wide ${
                  isActive(link.href)
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                } transition`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* 가운데: 로고 */}
          <Link
            href="/"
            className="absolute left-1/2 transform -translate-x-1/2"
          >
            <Image
              src="/images/logo.png"
              alt="MIMYOHI"
              width={153}
              height={37}
              className="h-[37px] w-auto"
              priority
            />
          </Link>

          {/* 오른쪽: 아이콘들 */}
          <div className="flex items-center space-x-5">
            {/* 검색 아이콘 */}
            <Link
              href="/search"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </Link>

            {/* 사용자 아이콘 / 로그인 */}
            {!mounted ? (
              <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
            ) : isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => router.push("/profile")}
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center justify-between w-full">
          {/* 왼쪽: 햄버거 메뉴 */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
            aria-label="메뉴"
          >
            {isMobileMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
                />
              </svg>
            )}
          </button>

          {/* 가운데: 로고 */}
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="MIMYOHI"
              width={123}
              height={30}
              className="h-[30px] w-auto"
              priority
            />
          </Link>

          {/* 오른쪽: 검색 + 사용자 아이콘 */}
          <div className="flex items-center space-x-2">
            <Link
              href="/search"
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </Link>
            {/* 사용자 아이콘 */}
            {!mounted ? (
              <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
            ) : isAuthenticated ? (
              <Link
                href="/profile"
                className="p-2 -mr-2 text-gray-600 hover:text-gray-900"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="p-2 -mr-2 text-gray-600 hover:text-gray-900"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {leftNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-3 text-sm font-medium rounded-lg ${
                  isActive(link.href)
                    ? "text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                } transition`}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile 로그인 상태 */}
            <div className="pt-3 mt-3 border-t border-gray-200">
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 text-sm font-medium text-gray-900">
                    {displayName}
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    마이페이지
                  </Link>
                  <Link
                    href="/profile/points"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    포인트
                  </Link>
                  <Link
                    href="/coupons"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    쿠폰
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-50 rounded-lg"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
