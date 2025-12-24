import ProductCard from "@/components/ProductCard";
import Link from "next/link";

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  discount_rate: number | null;
  image_url: string | null;
  is_new_badge: boolean;
  is_sale_badge: boolean;
  created_at: string;
}

interface BestItemSectionProps {
  products: Product[];
}

export default function BestItemSection({ products }: BestItemSectionProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="bg-white">
      {/* 데스크톱: 3열 그리드 */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-x-6 gap-y-10">
          {products.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>

        {/* 데스크톱 더보기 버튼 */}
        <div className="text-center mt-10">
          <Link
            href="/products"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 border-b border-gray-400 pb-0.5 transition"
          >
            제품 더보기 +
          </Link>
        </div>
      </div>

      {/* 모바일: 가로 스크롤 캐러셀 */}
      <div className="md:hidden">
        <div
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[200px]">
              <ProductCard product={product as any} />
            </div>
          ))}
        </div>

        {/* 모바일 버튼 */}
        <div className="text-center mt-6 px-4">
          <Link
            href="/products"
            className="inline-flex items-center justify-center w-full max-w-sm text-sm text-[#5a9a9a] border border-[#c5dde0] rounded-full py-3 px-6 hover:bg-[#f0f7f8] transition"
          >
            제품 보러가기 →
          </Link>
        </div>
      </div>
    </section>
  );
}
