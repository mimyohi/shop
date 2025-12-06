import { supabase } from '@/lib/supabase'
import { Coupon, UserCoupon } from '@/models'

export const couponsRepository = {
  /**
   * 사용자의 사용 가능한 쿠폰 목록 조회
   */
  async findUserCoupons(userId: string): Promise<UserCoupon[]> {
    const { data, error } = await supabase
      .from('user_coupons')
      .select(`
        *,
        coupon:coupons(*)
      `)
      .eq('user_id', userId)
      .eq('is_used', false)
      .gte('coupon.valid_until', new Date().toISOString())

    if (error) {
      console.error('Error fetching user coupons:', error)
      throw new Error('Failed to fetch user coupons')
    }

    return (data || []) as UserCoupon[]
  },

  /**
   * 모든 활성 쿠폰 조회
   */
  async findActiveCoupons(): Promise<Coupon[]> {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .lte('valid_from', now)
      .or(`valid_until.is.null,valid_until.gte.${now}`)

    if (error) {
      console.error('Error fetching active coupons:', error)
      throw new Error('Failed to fetch active coupons')
    }

    return data || []
  },

  /**
   * 쿠폰 코드로 조회
   */
  async findByCode(code: string): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching coupon by code:', error)
      return null
    }

    return data
  },

  /**
   * 사용자에게 쿠폰 발급
   */
  async issueCouponToUser(userId: string, couponId: string): Promise<UserCoupon> {
    const { data, error } = await supabase
      .from('user_coupons')
      .insert({
        user_id: userId,
        coupon_id: couponId,
        is_used: false,
      })
      .select(`
        *,
        coupon:coupons(*)
      `)
      .single()

    if (error) {
      console.error('Error issuing coupon:', error)
      throw new Error('Failed to issue coupon')
    }

    return data as UserCoupon
  },

  /**
   * 쿠폰 사용 처리
   */
  async useCoupon(userCouponId: string, orderId: string): Promise<UserCoupon> {
    const { data, error } = await supabase
      .from('user_coupons')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        order_id: orderId,
      })
      .eq('id', userCouponId)
      .select(`
        *,
        coupon:coupons(*)
      `)
      .single()

    if (error) {
      console.error('Error using coupon:', error)
      throw new Error('Failed to use coupon')
    }

    return data as UserCoupon
  },
}
