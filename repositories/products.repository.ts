import { supabase } from '@/lib/supabase'
import { Product } from '@/models'

export interface ProductFilters {
  search?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'latest' | 'price_asc' | 'price_desc' | 'name'
  page?: number
  limit?: number
}

export interface ProductListResponse {
  products: Product[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export const productsRepository = {
  /**
   * 상품 목록 조회 (필터링, 정렬, 페이지네이션)
   */
  async findMany(filters: ProductFilters = {}): Promise<ProductListResponse> {
    const {
      search,
      category,
      minPrice = 0,
      maxPrice = 10000000,
      sortBy = 'latest',
      page = 1,
      limit = 20,
    } = filters

    // 페이지네이션 계산
    const from = (page - 1) * limit
    const to = from + limit - 1

    // 쿼리 시작
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_visible_on_main', true)
      .is('deleted_at', null) // Soft delete된 상품 제외

    // 검색 필터
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // 카테고리 필터
    if (category) {
      query = query.eq('category', category)
    }

    // 가격 범위 필터
    query = query.gte('price', minPrice).lte('price', maxPrice)

    // 정렬
    switch (sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price', { ascending: false })
        break
      case 'name':
        query = query.order('name', { ascending: true })
        break
      case 'latest':
      default:
        query = query.order('created_at', { ascending: false })
    }

    // 페이지네이션 적용
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching products:', error)
      throw new Error('Failed to fetch products')
    }

    return {
      products: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    }
  },

  /**
   * 카테고리 목록 조회
   */
  async findCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('is_visible_on_main', true)
      .is('deleted_at', null)
      .not('category', 'is', null)

    if (error) {
      console.error('Error fetching categories:', error)
      throw new Error('Failed to fetch categories')
    }

    const uniqueCategories = Array.from(
      new Set(data?.map((item) => item.category).filter(Boolean))
    ) as string[]

    return uniqueCategories
  },

  /**
   * 상품 상세 조회 (ID로)
   */
  async findById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Error fetching product:', error)
      return null
    }

    return data
  },

  /**
   * 상품 상세 조회 (slug로)
   */
  async findBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Error fetching product:', error)
      return null
    }

    return data
  },

  /**
   * 베스트 상품 조회 (최신순)
   */
  async findBest(limit = 10): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_visible_on_main', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching best products:', error)
      return []
    }

    return data || []
  },

  /**
   * 신상품 조회
   */
  async findNew(limit = 10): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_visible_on_main', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching new products:', error)
      return []
    }

    return data || []
  },

  /**
   * ID 목록으로 상품 조회
   */
  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('id', ids)
      .is('deleted_at', null)

    if (error) {
      console.error('Error fetching products by ids:', error)
      throw new Error('Failed to fetch products')
    }

    return data || []
  },

}
