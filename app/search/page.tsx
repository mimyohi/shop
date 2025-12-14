import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { fetchProductsServer } from "@/lib/server-data";
import SearchForm from "./SearchForm";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: searchQuery } = await searchParams;
  const query = searchQuery?.trim() || "";

  // 서버에서 검색 결과 가져오기
  const searchResult = query
    ? await fetchProductsServer({ search: query })
    : { products: [], totalCount: 0 };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1">
        <div className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            {/* 검색 입력 */}
            <div className="max-w-xl mx-auto mb-12">
              <SearchForm initialQuery={query} />
            </div>

            {/* 검색 결과 */}
            {query ? (
              <>
                <div className="mb-6">
                  <p className="text-sm text-gray-500">
                    &apos;{query}&apos; 검색 결과
                    <span className="ml-1 text-[#222222]">
                      ({searchResult.totalCount}개)
                    </span>
                  </p>
                </div>

                {searchResult.products.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {searchResult.products.map((product) => (
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
                <p className="text-gray-500 text-sm">검색어를 입력해 주세요.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
