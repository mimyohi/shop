'use server'

import { createClient } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'

/**
 * 사용자에게 쿠폰 발급 서버 액션
 */
export async function issueCouponToUserAction(userId: string, couponId: string) {
  try {
    const supabase = await createClient()

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // user_id가 현재 사용자와 일치하는지 확인
    if (userId !== user.id) {
      return {
        success: false,
        error: 'Unauthorized to issue coupon for another user',
      }
    }

    // 쿠폰이 존재하고 활성화되어 있는지 확인
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .eq('is_active', true)
      .single()

    if (couponError || !coupon) {
      return {
        success: false,
        error: 'Coupon not found or inactive',
      }
    }

    // 이미 발급받은 쿠폰인지 확인
    const { data: existingCoupon } = await supabase
      .from('user_coupons')
      .select('id')
      .eq('user_id', userId)
      .eq('coupon_id', couponId)
      .single()

    if (existingCoupon) {
      return {
        success: false,
        error: 'Coupon already issued to this user',
      }
    }

    // 쿠폰 발급
    const { data, error } = await supabase
      .from('user_coupons')
      .insert({
        user_id: userId,
        coupon_id: couponId,
        is_used: false,
      })
      .select(
        `
        *,
        coupon:coupons(*)
      `
      )
      .single()

    if (error) {
      console.error('Error issuing coupon:', error)
      return {
        success: false,
        error: error.message || 'Failed to issue coupon',
      }
    }

    // 캐시 무효화
    revalidatePath('/profile')
    revalidatePath('/checkout')

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    console.error('Error in issueCouponToUserAction:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}

/**
 * 쿠폰 사용 처리 서버 액션
 */
export async function useCouponAction(userCouponId: string, orderId: string) {
  try {
    const supabase = await createClient()

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // 쿠폰이 사용자의 것인지 확인
    const { data: userCoupon, error: fetchError } = await supabase
      .from('user_coupons')
      .select('user_id, is_used')
      .eq('id', userCouponId)
      .single()

    if (fetchError || !userCoupon) {
      return {
        success: false,
        error: 'Coupon not found',
      }
    }

    if (userCoupon.user_id !== user.id) {
      return {
        success: false,
        error: 'Unauthorized to use this coupon',
      }
    }

    if (userCoupon.is_used) {
      return {
        success: false,
        error: 'Coupon already used',
      }
    }

    // 쿠폰 사용 처리
    const { data, error } = await supabase
      .from('user_coupons')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        order_id: orderId,
      })
      .eq('id', userCouponId)
      .select(
        `
        *,
        coupon:coupons(*)
      `
      )
      .single()

    if (error) {
      console.error('Error using coupon:', error)
      return {
        success: false,
        error: error.message || 'Failed to use coupon',
      }
    }

    // 캐시 무효화
    revalidatePath('/profile')

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    console.error('Error in useCouponAction:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}
