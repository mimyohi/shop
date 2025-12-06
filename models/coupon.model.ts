/**
 * Coupons 테이블 모델
 */
export interface Coupon {
  id: string
  code: string
  name: string
  description?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase: number
  max_discount?: number
  valid_from: string
  valid_until?: string
  usage_limit?: number
  used_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * UserCoupons 테이블 모델
 */
export interface UserCoupon {
  id: string
  user_id: string
  coupon_id: string
  is_used: boolean
  used_at?: string
  order_id?: string
  created_at: string
  coupon?: Coupon
}

/**
 * CouponProducts 테이블 모델
 */
export interface CouponProduct {
  id: string
  coupon_id: string
  product_id: string
  created_at: string
}

/**
 * CouponProducts 테이블 모델
 */
export interface CouponProduct {
  id: string
  coupon_id: string
  product_id: string
  created_at: string
}
