/**
 * Product Group 관련 모델
 * Group → Options → Types 3단계 구조
 */

/**
 * 방문 타입
 */
export type VisitType = 'first' | 'revisit_with_consult' | 'revisit_no_consult'

/**
 * ProductGroup 테이블 모델
 */
export interface ProductGroup {
  id: string
  product_id?: string | null // Product와의 1:N 관계 (NULL 가능)
  slug?: string
  name: string
  description?: string
  category?: string
  image_url?: string
  detail_images?: string[]

  // 가격 (Group 단위)
  price: number

  // 방문 타입별 옵션 사용 여부
  use_options_on_first: boolean
  use_options_on_revisit_with_consult: boolean
  use_options_on_revisit_no_consult: boolean

  // 표시 관련
  is_visible?: boolean
  is_new_badge?: boolean
  is_sale_badge?: boolean
  display_order?: number

  created_at: string
  updated_at: string

  // Joined data
  options?: ProductGroupOption[]
}

/**
 * ProductGroupOption 테이블 모델
 */
export interface ProductGroupOption {
  id: string
  group_id: string
  name: string // e.g., "1개월차", "2개월차"
  description?: string
  display_order: number
  is_required: boolean

  created_at: string
  updated_at: string

  // Joined data
  types?: ProductGroupType[]
}

/**
 * ProductGroupType 테이블 모델
 */
export interface ProductGroupType {
  id: string
  option_id: string
  name: string // e.g., "1단계 한약", "2단계 한약"
  description?: string
  image_url?: string
  display_order: number
  is_available: boolean

  created_at: string
  updated_at: string
}

/**
 * 선택된 Group Type (주문용)
 */
export interface SelectedGroupType {
  option_id: string
  option_name: string
  type_id: string
  type_name: string
}

/**
 * Product with Groups (Product + 하위 Groups)
 */
export interface ProductWithGroups {
  id: string
  slug?: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  created_at: string
  updated_at: string

  // Product에 속한 Groups
  groups: ProductGroup[]
}
