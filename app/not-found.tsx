import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />

      <main className="flex-1 flex items-center justify-center px-6">
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
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* 404 */}
          <p className="text-6xl font-light text-gray-300 mb-4">404</p>

          {/* 메시지 */}
          <h1 className="text-2xl font-medium text-gray-900 mb-3">
            페이지를 찾을 수 없습니다
          </h1>

          <p className="text-gray-500 mb-8">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>

          {/* 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pb-20">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-3 border border-gray-900 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
            >
              홈으로 돌아가기
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              상품 보러가기
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
