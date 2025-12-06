import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import MainBanner from "@/components/MainBanner";
import ProductBanner from "@/components/ProductBanner";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import Link from "next/link";

interface MainBannerType {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
  link_target: "_self" | "_blank";
  device_type: "pc" | "mobile" | "both";
  display_order: number;
  is_active: boolean;
}

interface ProductBannerType {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
  link_target: "_self" | "_blank";
  device_type: "pc" | "mobile" | "both";
  display_order: number;
  is_active: boolean;
}

interface HomeProduct {
  id: string;
  product_id: string;
  display_order: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discount_rate: number | null;
  image_url: string | null;
  is_new_badge: boolean;
  is_sale_badge: boolean;
  created_at: string;
}

async function getMainBanners(): Promise<MainBannerType[]> {
  const { data, error } = await supabase
    .from("main_banners")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching main banners:", error);
    return [];
  }

  return data || [];
}

async function getProductBanners(): Promise<ProductBannerType[]> {
  const { data, error } = await supabase
    .from("product_banners")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching product banners:", error);
    return [];
  }

  return data || [];
}

async function getHomeProducts(): Promise<HomeProduct[]> {
  const { data, error } = await supabase
    .from("home_products")
    .select(
      `
      id,
      product_id,
      display_order,
      products (
        id,
        name,
        slug,
        description,
        price,
        discount_rate,
        image_url,
        is_new_badge,
        is_sale_badge,
        created_at
      )
    `
    )
    .order("display_order", { ascending: true })
    .limit(6);

  if (error) {
    console.error("Error fetching home products:", error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    product_id: item.product_id,
    display_order: item.display_order,
    name: item.products?.name || "",
    slug: item.products?.slug || item.product_id,
    description: item.products?.description || null,
    price: item.products?.price || 0,
    discount_rate: item.products?.discount_rate || null,
    image_url: item.products?.image_url || null,
    is_new_badge: item.products?.is_new_badge || false,
    is_sale_badge: item.products?.is_sale_badge || false,
    created_at: item.products?.created_at || "",
  }));
}

export default async function Home() {
  const [mainBanners, productBanners, homeProducts] = await Promise.all([
    getMainBanners(),
    getProductBanners(),
    getHomeProducts(),
  ]);

  const products = homeProducts.map((hp) => ({
    id: hp.product_id,
    slug: hp.slug,
    name: hp.name,
    description: hp.description,
    price: hp.price,
    discount_rate: hp.discount_rate,
    image_url: hp.image_url,
    is_new_badge: hp.is_new_badge,
    is_sale_badge: hp.is_sale_badge,
    created_at: hp.created_at,
  }));

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* 메인 배너 */}
      <MainBanner banners={mainBanners} />

      {/* 상품 배너 */}
      <ProductBanner banners={productBanners} />

      {/* BEST ITEM 섹션 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {products.length > 0 && (
            <>
              {/* 데스크톱: 3열 그리드 */}
              <div className="hidden md:grid md:grid-cols-3 gap-x-6 gap-y-10">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
              </div>

              {/* 모바일: 2열 그리드 */}
              <div className="md:hidden grid grid-cols-2 gap-x-4 gap-y-8">
                {products.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
              </div>

              {/* 더보기 버튼 */}
              <div className="text-center mt-10">
                <Link
                  href="/products"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 border-b border-gray-400 pb-0.5 transition"
                >
                  제품 더보기 +
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
