"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
  useQueryStates,
} from "nuqs";
import ProductCard from "@/components/ProductCard";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  productsQueries,
  type ProductFilters,
} from "@/queries/products.queries";

const ITEMS_PER_PAGE = 12;

type SortOption = "latest" | "price_asc" | "price_desc" | "name";

const DEFAULT_FILTERS = {
  search: "",
  category: "",
  sortBy: "latest" as SortOption,
};

function ProductsContent() {
  const [queryFilters, setFilters] = useQueryStates(
    {
      search: parseAsString.withDefault(DEFAULT_FILTERS.search),
      category: parseAsString.withDefault(DEFAULT_FILTERS.category),
      sortBy: parseAsStringEnum([
        "latest",
        "price_asc",
        "price_desc",
        "name",
      ] as const).withDefault(DEFAULT_FILTERS.sortBy),
    },
    {
      history: "push",
    }
  );
  const [currentPage, setCurrentPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );

  // FilterState를 ProductFilters로 변환
  const productFilters: ProductFilters = {
    search: queryFilters.search || undefined,
    category: queryFilters.category || undefined,
    sortBy: queryFilters.sortBy as ProductFilters["sortBy"],
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  };

  // 상품 목록 조회
  const {
    data: productData,
    isLoading,
    error,
  } = useQuery(productsQueries.list(productFilters));

  const products = productData?.products || [];
  const totalCount = productData?.totalCount || 0;
  const totalPages = productData?.totalPages || 0;

  const handleSortChange = (sortBy: SortOption) => {
    void setFilters({ ...queryFilters, sortBy });
    void setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    void setCurrentPage(Math.max(1, page));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12">
            <p className="text-red-500 text-lg mb-4">
              상품 목록을 불러오는데 실패했습니다.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-gray-600 hover:text-gray-900 underline"
            >
              다시 시도
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* 히어로 배너 */}
      <div className="relative h-40 md:h-52 bg-gray-800 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1920&q=80)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/70 to-gray-900/30" />
        <div className="relative h-full flex flex-col items-center justify-center text-white">
          <h1 className="text-2xl md:text-3xl font-medium tracking-wide mb-2">
            Shop
          </h1>
          <p className="text-sm text-gray-300 text-center px-4">
            몸의 흐름을 회복해 건강한 변화를 완성합니다
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 상단 정보 바 */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-600">
            총 {totalCount}개의 상품이 있습니다
          </p>
          <div className="relative">
            <select
              value={queryFilters.sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="appearance-none bg-white border border-gray-200 rounded px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:border-gray-400"
            >
              <option value="latest">정렬방식</option>
              <option value="latest">최신순</option>
              <option value="price_asc">낮은 가격순</option>
              <option value="price_desc">높은 가격순</option>
              <option value="name">이름순</option>
            </select>
            <svg
              className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="w-full aspect-square bg-gray-200 rounded-lg"></div>
                <div className="mt-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-2">상품이 없습니다.</p>
            <p className="text-gray-400 text-sm">
              다른 검색 조건을 시도해보세요.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-12">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 text-sm font-medium transition ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  이전
                </button>

                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-8 h-8 text-sm font-medium transition ${
                              currentPage === page
                                ? "text-gray-900 border-b-2 border-gray-900"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 3 ||
                        page === currentPage + 3
                      ) {
                        return (
                          <span
                            key={page}
                            className="w-8 h-8 flex items-center justify-center text-gray-400"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    }
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 text-sm font-medium transition ${
                    currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function ProductsLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      {/* 히어로 배너 스켈레톤 */}
      <div className="h-40 md:h-52 bg-gray-200 animate-pulse" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="w-full aspect-square bg-gray-200 rounded-lg"></div>
              <div className="mt-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoadingSkeleton />}>
      <ProductsContent />
    </Suspense>
  );
}
