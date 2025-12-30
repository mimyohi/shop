import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import MainBanner from "@/components/MainBanner";
import ProductBanner from "@/components/ProductBanner";
import BestItemSection from "@/components/BestItemSection";
import BrandIntroSection from "@/components/BrandIntroSection";
import InstagramSection from "@/components/InstagramSection";
import Footer from "@/components/Footer";

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

interface RepresentativeOptionData {
  id: string;
  name: string;
  price: number;
  discount_rate: number;
  discounted_price: number;
}

interface HomeProduct {
  id: string;
  product_id: string;
  display_order: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_new_badge: boolean;
  is_sale_badge: boolean;
  created_at: string;
  representative_option?: RepresentativeOptionData;
}

interface InstagramImageType {
  id: string;
  image_url: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
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
  // 삭제된 상품(deleted_at이 설정된 상품)은 제외
  const { data, error } = await supabase
    .from("home_products")
    .select(
      `
      id,
      product_id,
      display_order,
      products!inner (
        id,
        name,
        slug,
        description,
        image_url,
        is_new_badge,
        is_sale_badge,
        created_at,
        deleted_at
      )
    `
    )
    .is("products.deleted_at", null)
    .order("display_order", { ascending: true })
    .limit(6);

  if (error) {
    console.error("Error fetching home products:", error);
    return [];
  }

  // 대표 옵션 조회
  const productIds = (data || []).map((item: any) => item.product_id);
  const { data: repOptions } = await supabase
    .from("product_options")
    .select("id, product_id, name, price, discount_rate")
    .in("product_id", productIds)
    .eq("is_representative", true);

  const repOptionsMap = new Map<string, RepresentativeOptionData>();
  repOptions?.forEach((option: any) => {
    if (option.product_id) {
      const discountRate = option.discount_rate || 0;
      const discountedPrice =
        discountRate > 0
          ? Math.floor(option.price * (1 - discountRate / 100))
          : option.price;
      repOptionsMap.set(option.product_id, {
        id: option.id,
        name: option.name,
        price: option.price,
        discount_rate: discountRate,
        discounted_price: discountedPrice,
      });
    }
  });

  return (data || []).map((item: any) => ({
    id: item.id,
    product_id: item.product_id,
    display_order: item.display_order,
    name: item.products?.name || "",
    slug: item.products?.slug || item.product_id,
    description: item.products?.description || null,
    image_url: item.products?.image_url || null,
    is_new_badge: item.products?.is_new_badge || false,
    is_sale_badge: item.products?.is_sale_badge || false,
    created_at: item.products?.created_at || "",
    representative_option: repOptionsMap.get(item.product_id),
  }));
}

async function getInstagramImages(): Promise<InstagramImageType[]> {
  const { data, error } = await supabase
    .from("instagram_images")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .limit(6);

  if (error) {
    console.error("Error fetching instagram images:", error);
    return [];
  }

  return data || [];
}

export default async function Home() {
  const [mainBanners, productBanners, homeProducts, instagramImages] =
    await Promise.all([
      getMainBanners(),
      getProductBanners(),
      getHomeProducts(),
      getInstagramImages(),
    ]);

  const products = homeProducts.map((hp) => ({
    id: hp.product_id,
    slug: hp.slug,
    name: hp.name,
    description: hp.description || "",
    image_url: hp.image_url || "",
    is_new_badge: hp.is_new_badge,
    is_sale_badge: hp.is_sale_badge,
    created_at: hp.created_at,
    updated_at: hp.created_at,
    category: "",
    representative_option: hp.representative_option,
  }));

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* 메인 배너 */}
      <MainBanner banners={mainBanners} />

      {/* 상품 배너 */}
      <ProductBanner banners={productBanners} />

      {/* BEST ITEM 섹션 */}
      <BestItemSection products={products} />

      {/* 브랜드 소개 섹션 */}
      {/* <BrandIntroSection /> */}

      {/* 인스타그램 섹션 */}
      {/* {instagramImages.length > 0 && (
        <InstagramSection images={instagramImages} />
      )} */}

      <div className="h-10" />
      {/* Footer */}
      <Footer />
    </div>
  );
}
