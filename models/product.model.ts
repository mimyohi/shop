/**
 * Product 테이블 모델
 */
export interface Product {
  id: string
  slug?: string
  name: string
  description: string
  price: number
  discount_rate?: number // 0-100 (할인률 %)
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
