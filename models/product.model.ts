/**
 * 대표 옵션 정보 (상품 목록 표시용)
 */
export interface RepresentativeOption {
  id: string
  name: string
  price: number
  discount_rate: number
  discounted_price: number
}

/**
 * Product 테이블 모델
 * 가격/할인율은 옵션(product_options)에서 관리
 */
export interface Product {
  id: string
  slug?: string
  name: string
  description: string
  image_url: string
  detail_images?: string[]
  category: string
  is_visible_on_main?: boolean
  is_new_badge?: boolean
  is_sale_badge?: boolean
  is_out_of_stock?: boolean
  sale_start_at?: string | null
  sale_end_at?: string | null
  created_at: string
  updated_at: string

  // 대표 옵션 정보 (조회 시 join)
  representative_option?: RepresentativeOption
}

/**
 * ProductAddon 테이블 모델 (추가 상품)
 */
export interface ProductAddon {
  id: string
  product_id: string
  name: string
  description: string | null
  price: number
  image_url?: string | null
  is_available: boolean
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * 선택된 추가상품 (주문용)
 */
export interface SelectedAddon {
  addon_id: string
  name: string
  price: number
  quantity: number
}

/**
 * 선택된 옵션 (주문용)
 */
export interface SelectedOption {
  option_id: string
  option_name: string
  value_id: string
  value: string
  price_adjustment: number
}
