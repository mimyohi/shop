'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWishlistStore } from '@/store/wishlistStore';
import ProductCard from '@/components/ProductCard';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { productsQueries } from '@/queries/products.queries';

export default function WishlistPage() {
  const wishlistItems = useWishlistStore((state) => state.items);
  const wishlistProductIds = useMemo(() => Array.from(new Set(wishlistItems)), [wishlistItems]);
  const hasItems = wishlistProductIds.length > 0;

  const {
    data: fetchedProducts,
    isLoading,
    isFetching,
  } = useQuery({
    ...productsQueries.byIds(wishlistProductIds),
    enabled: hasItems,
  });

  const products = hasItems ? fetchedProducts || [] : [];
  const isLoadingProducts = hasItems && (isLoading || isFetching);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* 히어로 배너 */}
      <div className="relative h-32 md:h-40 bg-gray-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-900/40" />
        <div className="relative h-full flex flex-col items-center justify-center text-white">
          <p className="text-xs tracking-widest mb-1 text-gray-300">MIMYOHI</p>
          <h1 className="text-xl md:text-2xl font-medium tracking-wide">위시리스트</h1>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <p className="text-sm text-gray-500">
            {products.length}개의 상품
          </p>
        </div>

        {isLoadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded animate-pulse">
                <div className="w-full h-48 bg-gray-100"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded w-full"></div>
                  <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-gray-400">♡</span>
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              위시리스트가 비어있습니다
            </h2>
            <p className="text-sm text-gray-500 mb-8">
              마음에 드는 상품에 하트를 눌러 저장해보세요!
            </p>
            <Link
              href="/products"
              className="inline-block bg-gray-900 text-white px-6 py-3 rounded hover:bg-gray-800 transition text-sm"
            >
              상품 둘러보기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
