import { createClient } from "@/lib/supabaseServer";
import type { ProductFilters, ProductListResponse } from "@/repositories/products.repository";
import type { OrderWithItems } from "@/repositories/orders.repository";
import type { ProductOptionWithSettings } from "@/repositories/product-options.repository";
import type { UserPoints, PointHistory, UserCoupon, ShippingAddress, UserProfile, UserHealthConsultation, ProductAddon, Product, RepresentativeOption } from "@/models";
import { checkAndExpireVirtualAccount } from "@/lib/expire-virtual-account";

/**
 * 서버 사이드 전용 데이터 패칭 함수들
 * 이 파일은 Server Component에서만 import 가능합니다.
 */

/**
 * 상품 ID 목록에 대한 대표 옵션 조회 (서버용)
 */
async function fetchRepresentativeOptionsServer(
  supabase: any,
  productIds: string[]
): Promise<Map<string, RepresentativeOption>> {
  if (productIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("product_options")
    .select("id, product_id, name, price, discount_rate")
    .in("product_id", productIds)
    .eq("is_representative", true);

  if (error) {
    console.error("Error fetching representative options:", error);
    return new Map();
  }

  const map = new Map<string, RepresentativeOption>();
  data?.forEach((option: any) => {
    if (option.product_id) {
      const discountRate = option.discount_rate || 0;
      const discountedPrice =
        discountRate > 0
          ? Math.floor(option.price * (1 - discountRate / 100))
          : option.price;

      map.set(option.product_id, {
        id: option.id,
        name: option.name,
        price: option.price,
        discount_rate: discountRate,
        discounted_price: discountedPrice,
      });
    }
  });

  return map;
}

/**
 * DB에서 조회한 상품에 대표 옵션 정보를 매핑
 */
function mapProductWithRepresentativeOption(
  product: any,
  representativeOptions: Map<string, RepresentativeOption>
): Product {
  const repOption = representativeOptions.get(product.id);
  return {
    ...product,
    representative_option: repOption || undefined,
  };
}

// ===== Products =====
export async function fetchProductsServer(filters: ProductFilters = {}): Promise<ProductListResponse> {
  const supabase = await createClient();
  const {
    search,
    category,
    sortBy = "latest",
    page = 1,
    limit = 20,
  } = filters;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_visible_on_main", true)
    .is("deleted_at", null);

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (category) {
    query = query.eq("category", category);
  }

  // 정렬 (price 정렬은 클라이언트 사이드에서 처리)
  if (sortBy === "name") {
    query = query.order("name", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }

  const products = data || [];
  const productIds = products.map((p: any) => p.id);

  // 대표 옵션 조회
  const representativeOptions = await fetchRepresentativeOptionsServer(supabase, productIds);

  // 상품에 대표 옵션 정보 매핑
  let mappedProducts = products.map((p: any) =>
    mapProductWithRepresentativeOption(p, representativeOptions)
  );

  // 가격 정렬은 클라이언트 사이드에서 처리
  if (sortBy === "price_asc") {
    mappedProducts.sort((a, b) => {
      const priceA = a.representative_option?.discounted_price || 0;
      const priceB = b.representative_option?.discounted_price || 0;
      return priceA - priceB;
    });
  } else if (sortBy === "price_desc") {
    mappedProducts.sort((a, b) => {
      const priceA = a.representative_option?.discounted_price || 0;
      const priceB = b.representative_option?.discounted_price || 0;
      return priceB - priceA;
    });
  }

  return {
    products: mappedProducts,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    currentPage: page,
  };
}

// ===== Orders =====
export async function fetchOrderByOrderIdServer(order_id: string): Promise<OrderWithItems | null> {
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_id", order_id)
    .single();

  if (error || !order) {
    return null;
  }

  // 가상계좌 만료 체크 (Lazy Evaluation)
  const checkedOrder = await checkAndExpireVirtualAccount(order, supabase);

  // order_items 조회 (product 포함)
  const { data: orderItems } = await supabase
    .from("order_items")
    .select(
      `
      *,
      product:products(*)
    `
    )
    .eq("order_id", checkedOrder.id);

  // order_health_consultation 조회
  const { data: consultations } = await supabase
    .from("order_health_consultation")
    .select("*")
    .eq("order_id", checkedOrder.id);

  return {
    ...checkedOrder,
    order_items: orderItems || [],
    order_health_consultation: consultations?.[0]!,
  } as OrderWithItems;
}

// ===== Product Options =====
export async function fetchProductOptionsWithSettingsServer(productId: string): Promise<ProductOptionWithSettings[]> {
  const supabase = await createClient();

  const { data: optionsData, error: optionsError } = await supabase
    .from("product_options")
    .select("*")
    .eq("product_id", productId)
    .order("display_order");

  if (optionsError) {
    console.error("Error fetching product options:", optionsError);
    throw new Error("Failed to fetch product options");
  }

  const optionsWithSettings = await Promise.all(
    (optionsData || []).map(async (option) => {
      const { data: settingsData, error: settingsError } = await supabase
        .from("product_option_settings")
        .select("*")
        .eq("option_id", option.id)
        .order("display_order");

      if (settingsError) {
        console.error("Error fetching option settings:", settingsError);
        throw settingsError;
      }

      const settingsWithTypes = await Promise.all(
        (settingsData || []).map(async (setting) => {
          const { data: typesData, error: typesError } = await supabase
            .from("product_option_setting_types")
            .select("*")
            .eq("setting_id", setting.id)
            .order("display_order");

          if (typesError) {
            console.error("Error fetching setting types:", typesError);
            throw typesError;
          }

          return {
            ...setting,
            types: typesData || [],
          };
        })
      );

      return {
        ...option,
        settings: settingsWithTypes,
      };
    })
  );

  return optionsWithSettings as ProductOptionWithSettings[];
}

// ===== User Points =====
export async function fetchUserPointsServer(userId: string): Promise<UserPoints | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_points")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned - create default
      const { data: newData, error: createError } = await supabase
        .from("user_points")
        .insert({
          user_id: userId,
          points: 0,
          total_earned: 0,
          total_used: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating user points:", createError);
        return null;
      }
      return newData;
    }
    console.error("Error fetching user points:", error);
    return null;
  }

  return data;
}

export async function fetchPointHistoryServer(userId: string, limit = 50): Promise<PointHistory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("point_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching point history:", error);
    return [];
  }

  return data || [];
}

// ===== User Coupons =====
export async function fetchAvailableUserCouponsServer(userId: string): Promise<UserCoupon[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_coupons")
    .select(
      `
      *,
      coupon:coupons(*)
    `
    )
    .eq("user_id", userId)
    .eq("is_used", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching available user coupons:", error);
    return [];
  }

  // coupon이 null이거나 만료된 쿠폰 필터링
  const now = new Date();
  return (data || []).filter((item: any) => {
    if (!item.coupon) return false;
    if (item.coupon.valid_until) {
      return new Date(item.coupon.valid_until) >= now;
    }
    return true;
  }) as UserCoupon[];
}

// ===== Shipping Addresses =====
export async function fetchShippingAddressesServer(userId: string): Promise<ShippingAddress[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shipping_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching shipping addresses:", error);
    return [];
  }

  return data || [];
}

// ===== User Profile =====
export async function fetchUserProfileServer(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
}

// ===== User Health Consultations =====
export async function fetchUserHealthConsultationServer(userId: string): Promise<UserHealthConsultation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_health_consultations")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user health consultation:", error);
    return null;
  }

  return data;
}

// ===== Product Addons =====
export async function fetchProductAddonsServer(productId: string): Promise<ProductAddon[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_addons")
    .select("*")
    .eq("product_id", productId)
    .eq("is_available", true)
    .order("display_order");

  if (error) {
    console.error("Error fetching product addons:", error);
    return [];
  }

  return data || [];
}
