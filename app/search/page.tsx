'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { productsQueries } from '@/queries/products.queries';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const { data, isLoading } = useQuery({
    ...productsQueries.list({ search: searchQuery }),
    enabled: searchQuery.length > 0,
  });

  const products = data?.products || [];
  const totalCount = data?.totalCount || 0;

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setSearchInput(q);
    setSearchQuery(q);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim());
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <>
      {/* 검색 입력 */}
      <div className="max-w-xl mx-auto mb-12">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="검색어를 입력하세요"
              className="w-full px-4 py-3 pr-12 border-b border-gray-300 focus:border-[#222222] focus:outline-none text-sm"
            />
            <button
              type="submit"
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#222222]"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* 검색 결과 */}
      {searchQuery ? (
        <>
          <div className="mb-6">
            <p className="text-sm text-gray-500">
              &apos;{searchQuery}&apos; 검색 결과
              <span className="ml-1 text-[#222222]">
                ({totalCount}개)
              </span>
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#222222]"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 text-sm mb-2">
                검색 결과가 없습니다.
              </p>
              <p className="text-gray-400 text-xs">
                다른 검색어로 다시 시도해 보세요.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500 text-sm">
            검색어를 입력해 주세요.
          </p>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1">
        <div className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <Suspense
              fallback={
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#222222]"></div>
                </div>
              }
            >
              <SearchContent />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
