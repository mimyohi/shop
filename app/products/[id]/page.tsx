import Image from "next/image";
import { notFound } from "next/navigation";
import { productsRepository } from "@/repositories/products.repository";
import { fetchProductOptionsWithSettingsServer } from "@/lib/server-data";
import ProductPurchaseSection from "@/components/ProductPurchaseSection";
import ProductInfoSections from "@/components/ProductInfoSections";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const revalidate = 0;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await productsRepository.findByIdOrSlug(id);

  if (!product) {
    notFound();
  }

  // 상품 옵션 가져오기 (서버 사이드)
  const productOptions = await fetchProductOptionsWithSettingsServer(product.id);

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
            <div className="mb-6">
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
            <ProductPurchaseSection product={product} productOptions={productOptions} />
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

        {/* 결제/배송/교환/서비스 정보 */}
        <ProductInfoSections />
      </main>

      <Footer />
    </div>
  );
}
