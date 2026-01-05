import { supabase } from "@/lib/supabase";
import { Product, RepresentativeOption } from "@/models";

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "latest" | "price_asc" | "price_desc" | "name";
  page?: number;
  limit?: number;
}

export interface ProductListResponse {
  products: Product[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
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

/**
 * 상품 ID 목록에 대한 대표 옵션 조회
 */
async function fetchRepresentativeOptions(
  productIds: string[]
): Promise<Map<string, RepresentativeOption>> {
  if (productIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("product_options")
    .select("id, product_id, name, price, discount_rate")
    .in("product_id", productIds)
    .eq("is_representative", true)
    .is("deleted_at", null);

  if (error) {
    return new Map();
  }

  const map = new Map<string, RepresentativeOption>();
  data?.forEach((option) => {
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

export const productsRepository = {
  /**
   * 상품 목록 조회 (필터링, 정렬, 페이지네이션)
   */
  async findMany(filters: ProductFilters = {}): Promise<ProductListResponse> {
    const {
      search,
      category,
      sortBy = "latest",
      page = 1,
      limit = 20,
    } = filters;

    // 페이지네이션 계산
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 쿼리 시작
    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("is_visible_on_main", true)
      .is("deleted_at", null);

    // 검색 필터
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // 카테고리 필터
    if (category) {
      query = query.eq("category", category);
    }

    // 정렬 (price 정렬은 클라이언트 사이드에서 처리)
    if (sortBy === "name") {
      query = query.order("name", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // 페이지네이션 적용
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error("Failed to fetch products");
    }

    const products = data || [];
    const productIds = products.map((p) => p.id);

    // 대표 옵션 조회
    const representativeOptions = await fetchRepresentativeOptions(productIds);

    // 상품에 대표 옵션 정보 매핑
    let mappedProducts = products.map((p) =>
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
  },

  /**
   * 카테고리 목록 조회
   */
  async findCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from("products")
      .select("category")
      .eq("is_visible_on_main", true)
      .is("deleted_at", null)
      .not("category", "is", null);

    if (error) {
      throw new Error("Failed to fetch categories");
    }

    const uniqueCategories = Array.from(
      new Set(data?.map((item) => item.category).filter(Boolean))
    ) as string[];

    return uniqueCategories;
  },

  /**
   * 상품 상세 조회 (ID로)
   */
  async findById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) {
      return null;
    }

    // 대표 옵션 조회
    const representativeOptions = await fetchRepresentativeOptions([id]);

    return mapProductWithRepresentativeOption(data, representativeOptions);
  },

  /**
   * 상품 상세 조회 (slug로)
   */
  async findBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .is("deleted_at", null)
      .single();

    if (error) {
      return null;
    }

    // 대표 옵션 조회
    const representativeOptions = await fetchRepresentativeOptions([data.id]);

    return mapProductWithRepresentativeOption(data, representativeOptions);
  },

  /**
   * 상품 상세 조회 (ID 또는 slug로)
   * UUID 형식이면 ID로, 아니면 slug로 조회
   */
  async findByIdOrSlug(idOrSlug: string): Promise<Product | null> {
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug
      );

    if (isUUID) {
      return this.findById(idOrSlug);
    } else {
      return this.findBySlug(idOrSlug);
    }
  },

  /**
   * 베스트 상품 조회 (최신순)
   */
  async findBest(limit = 10): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_visible_on_main", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    const products = data || [];
    const productIds = products.map((p) => p.id);

    // 대표 옵션 조회
    const representativeOptions = await fetchRepresentativeOptions(productIds);

    return products.map((p) =>
      mapProductWithRepresentativeOption(p, representativeOptions)
    );
  },

  /**
   * 신상품 조회
   */
  async findNew(limit = 10): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_visible_on_main", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    const products = data || [];
    const productIds = products.map((p) => p.id);

    // 대표 옵션 조회
    const representativeOptions = await fetchRepresentativeOptions(productIds);

    return products.map((p) =>
      mapProductWithRepresentativeOption(p, representativeOptions)
    );
  },

  /**
   * ID 목록으로 상품 조회
   */
  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .in("id", ids)
      .is("deleted_at", null);

    if (error) {
      throw new Error("Failed to fetch products");
    }

    const products = data || [];

    // 대표 옵션 조회
    const representativeOptions = await fetchRepresentativeOptions(ids);

    return products.map((p) =>
      mapProductWithRepresentativeOption(p, representativeOptions)
    );
  },
};
