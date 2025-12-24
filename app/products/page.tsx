import { Suspense } from "react";
import ProductCard from "@/components/ProductCard";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { productsRepository } from "@/repositories/products.repository";
import ProductFilter, { SortOption } from "@/components/ProductFilter";

const ITEMS_PER_PAGE = 12;

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sortBy?: string;
    page?: string;
  }>;
}

function ProductsLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="w-full aspect-[4/1] md:aspect-[6/1] bg-gray-200 animate-pulse" />
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

async function ProductsContent({
  searchParams,
}: {
  searchParams: ProductsPageProps["searchParams"];
}) {
  const params = await searchParams;
  const search = params.search || "";
  const category = params.category || "";
  const sortBy = (params.sortBy as SortOption) || "latest";
  const currentPage = parseInt(params.page || "1", 10);

  const productData = await productsRepository.findMany({
    search: search || undefined,
    category: category || undefined,
    sortBy,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  });

  const { products, totalCount, totalPages } = productData;

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* 히어로 배너 */}
      <div className="relative w-full max-w-7xl mx-auto md:pt-10 pt-0 px-4 sm:px-6 lg:px-8">
        {/* PC 배너 */}
        <img
          src="/images/product-pc-banner.png"
          alt="Shop 배너"
          className="hidden md:block w-full h-auto"
        />
        {/* 모바일 배너 */}
        <img
          src="/images/product-mobile-banner.png"
          alt="Shop 배너"
          className="block md:hidden w-full h-auto"
        />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-[40px]">
        {/* 상단 정보 바 */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-600">
            총 {totalCount}개의 상품이 있습니다
          </p>
          <ProductFilter />
        </div>

        {products.length === 0 ? (
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
              <Pagination currentPage={currentPage} totalPages={totalPages} />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  return (
    <div className="flex justify-center items-center space-x-2 mt-12">
      <a
        href={currentPage > 1 ? `?page=${currentPage - 1}` : "#"}
        className={`px-4 py-2 text-sm font-medium transition ${
          currentPage === 1
            ? "text-gray-300 pointer-events-none"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        이전
      </a>

      <div className="flex space-x-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          if (
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 2 && page <= currentPage + 2)
          ) {
            return (
              <a
                key={page}
                href={`?page=${page}`}
                className={`w-8 h-8 flex items-center justify-center text-sm font-medium transition ${
                  currentPage === page
                    ? "text-gray-900 border-b-2 border-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {page}
              </a>
            );
          } else if (page === currentPage - 3 || page === currentPage + 3) {
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
        })}
      </div>

      <a
        href={currentPage < totalPages ? `?page=${currentPage + 1}` : "#"}
        className={`px-4 py-2 text-sm font-medium transition ${
          currentPage === totalPages
            ? "text-gray-300 pointer-events-none"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        다음
      </a>
    </div>
  );
}

export default function ProductsPage(props: ProductsPageProps) {
  return (
    <Suspense fallback={<ProductsLoadingSkeleton />}>
      <ProductsContent searchParams={props.searchParams} />
    </Suspense>
  );
}
