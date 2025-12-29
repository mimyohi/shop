/**
 * Product Option 관련 모델
 * Option → Settings → SettingTypes 3단계 구조
 */

/**
 * 방문 타입
 */
export type VisitType = 'first' | 'revisit_with_consult' | 'revisit_no_consult'

/**
 * ProductOption 테이블 모델 (이전 ProductGroup)
 */
export interface ProductOption {
  id: string
  product_id?: string | null // Product와의 1:N 관계 (NULL 가능)
  slug?: string
  name: string
  category?: string
  image_url?: string
  detail_images?: string[]

  // 가격 및 할인
  price: number
  discount_rate: number // 0-100 (할인률 %)
  is_representative: boolean // 대표 옵션 여부

  // 방문 타입별 설정 사용 여부
  use_settings_on_first: boolean
  use_settings_on_revisit_with_consult: boolean
  use_settings_on_revisit_no_consult: boolean

  // 표시 관련
  is_new_badge?: boolean
  is_sale_badge?: boolean
  display_order?: number

  created_at: string
  updated_at: string

  // Joined data
  settings?: ProductOptionSetting[]
}

/**
 * ProductOptionSetting 테이블 모델 (이전 ProductGroupOption)
 */
export interface ProductOptionSetting {
  id: string
  option_id: string
  name: string // e.g., "1개월차", "2개월차"
  display_order: number

  created_at: string
  updated_at: string

  // Joined data
  types?: ProductOptionSettingType[]
}

/**
 * ProductOptionSettingType 테이블 모델 (이전 ProductGroupType)
 */
export interface ProductOptionSettingType {
  id: string
  setting_id: string
  name: string // e.g., "1단계 한약", "2단계 한약"
  display_order: number

  created_at: string
  updated_at: string
}

/**
 * 선택된 Option Setting (주문용)
 */
export interface SelectedOptionSetting {
  setting_id: string
  setting_name: string
  type_id: string
  type_name: string
}

/**
 * Product with Options (Product + 하위 Options)
 */
export interface ProductWithOptions {
  id: string
  slug?: string
  name: string
  description: string
  image_url: string
  category: string
  created_at: string
  updated_at: string

  // Product에 속한 Options
  options: ProductOption[]
}
