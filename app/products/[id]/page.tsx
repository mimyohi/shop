import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabaseServer";
import { fetchProductOptionsWithSettingsServer, fetchProductAddonsServer } from "@/lib/server-data";
import ProductPurchaseSection from "@/components/ProductPurchaseSection";
import ProductInfoSections from "@/components/ProductInfoSections";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Product } from "@/models";

export const revalidate = 0;

async function getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
  const supabase = createServiceRoleClient();
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug
    );

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq(isUUID ? "id" : "slug", idOrSlug)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error fetching product:", error);
    return null;
  }

  return data;
}

type SaleStatus = "before" | "ended" | "active";

function getSaleStatus(product: Product): SaleStatus {
  const now = new Date();

  if (product.sale_start_at) {
    const startDate = new Date(product.sale_start_at);
    if (now < startDate) {
      return "before";
    }
  }

  if (product.sale_end_at) {
    const endDate = new Date(product.sale_end_at);
    if (now > endDate) {
      return "ended";
    }
  }

  return "active";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",  // 한국 시간대 강제 지정
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductByIdOrSlug(id);

  if (!product) {
    notFound();
  }

  // 판매 기간 체크
  const saleStatus = getSaleStatus(product);

  if (saleStatus !== "active") {
    const isBefore = saleStatus === "before";

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navigation />

        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md pt-20">
            {/* 메시지 */}
            <h1 className="text-2xl font-medium text-gray-900 mb-3">
              {isBefore ? "판매 시작 전입니다" : "판매가 종료되었습니다"}
            </h1>

            <p className="text-gray-500 mb-6">{product.name}</p>

            {/* 기간 정보 */}
            <div className="border-t border-b border-gray-200 py-4 mb-8">
              {isBefore && product.sale_start_at && (
                <div className="text-sm text-gray-600">
                  <span className="text-gray-400">판매 시작</span>
                  <p className="mt-1 font-medium text-gray-800">
                    {formatDate(product.sale_start_at)}
                  </p>
                </div>
              )}
              {!isBefore && product.sale_end_at && (
                <div className="text-sm text-gray-600">
                  <span className="text-gray-400">판매 종료</span>
                  <p className="mt-1 font-medium text-gray-800">
                    {formatDate(product.sale_end_at)}
                  </p>
                </div>
              )}
            </div>

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

  // 상품 옵션 및 추가 상품 가져오기 (서버 사이드)
  const [productOptions, productAddons] = await Promise.all([
    fetchProductOptionsWithSettingsServer(product.id),
    fetchProductAddonsServer(product.id),
  ]);

  // 대표 옵션에서 가격 정보 가져오기
  const representativeOption = productOptions.find(opt => opt.is_representative);
  const originalPrice = representativeOption?.price || 0;
  const discountRate = representativeOption?.discount_rate || 0;
  const discountedPrice = discountRate > 0
    ? Math.floor(originalPrice * (1 - discountRate / 100))
    : originalPrice;
  const hasDiscount = discountRate > 0;

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
                      {originalPrice.toLocaleString()}원
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
            <ProductPurchaseSection
              product={product}
              productOptions={productOptions}
              productAddons={productAddons}
            />
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
