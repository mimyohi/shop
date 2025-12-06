import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Product } from "@/models";
import { notFound } from "next/navigation";
import ProductPurchaseSection from "@/components/ProductPurchaseSection";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const revalidate = 0;

async function getProduct(idOrSlug: string): Promise<Product | null> {
  // slug 또는 id로 조회 (slug 우선)
  let query = supabase.from("products").select("*");

  // UUID 형식인지 확인
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug
    );

  if (isUUID) {
    query = query.eq("id", idOrSlug);
  } else {
    query = query.eq("slug", idOrSlug);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    console.error("Error fetching product:", error);
    return null;
  }

  return data;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  // 할인 가격 계산
  const discountedPrice =
    product.discount_rate && product.discount_rate > 0
      ? Math.floor(product.price * (1 - product.discount_rate / 100))
      : product.price;
  const hasDiscount = product.discount_rate && product.discount_rate > 0;

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* 왼쪽: 상품 이미지 */}
          <div className="relative w-full aspect-square bg-gray-50 rounded-lg overflow-hidden">
            <Image
              src={product.image_url || "https://via.placeholder.com/600"}
              alt={product.name}
              fill
              className="object-contain p-8"
              priority
            />
          </div>

          {/* 오른쪽: 상품 정보 */}
          <div className="flex flex-col">
            {/* 상품명 */}
            <h1 className="text-xl md:text-2xl font-medium text-gray-900 mb-6">
              {product.name}
            </h1>

            {/* 가격 정보 */}
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-gray-500 w-16">판매가</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-gray-900">
                    {discountedPrice.toLocaleString()} 원
                  </span>
                  {hasDiscount === true && (
                    <span className="text-sm text-gray-400 line-through">
                      {product.price.toLocaleString()}원
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-sm text-gray-500 w-16">배송안내</span>
                <div className="text-sm text-gray-700">
                  <p>3,500원 (300,000원 이상 구매 시 무료)</p>
                  <p className="text-gray-500">국내배송만 가능</p>
                </div>
              </div>
            </div>

            {/* 옵션 선택 및 구매 섹션 */}
            <ProductPurchaseSection product={product} />
          </div>
        </div>

        {/* 상세 이미지 갤러리 */}
        {product.detail_images && product.detail_images.length > 0 && (
          <div className="mt-16">
            <div className="space-y-0">
              {product.detail_images.map((imageUrl, index) => (
                <div key={index} className="relative w-full">
                  <Image
                    src={imageUrl}
                    alt={`${product.name} 상세 이미지 ${index + 1}`}
                    width={1200}
                    height={800}
                    className="w-full h-auto"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
