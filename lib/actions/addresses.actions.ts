'use server'

import { createClient } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'
import type { CreateAddressData, UpdateAddressData } from '@/repositories/addresses.repository'

/**
 * 배송지 생성 서버 액션
 */
export async function createAddressAction(addressData: CreateAddressData) {
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
    if (addressData.user_id !== user.id) {
      return {
        success: false,
        error: 'Unauthorized to create address for another user',
      }
    }

    // 기본 배송지로 설정하는 경우, 기존 기본 배송지 해제
    if (addressData.is_default) {
      await supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', addressData.user_id)
        .eq('is_default', true)
    }

    const { data, error } = await supabase
      .from('shipping_addresses')
      .insert(addressData)
      .select()
      .single()

    if (error) {
      console.error('Error creating shipping address:', error)
      return {
        success: false,
        error: error.message || 'Failed to create shipping address',
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
    console.error('Error in createAddressAction:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}

/**
 * 배송지 수정 서버 액션
 */
export async function updateAddressAction(
  id: string,
  userId: string,
  updateData: UpdateAddressData
) {
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
        error: 'Unauthorized to update address for another user',
      }
    }

    // 기본 배송지로 변경하는 경우, 기존 기본 배송지 해제
    if (updateData.is_default) {
      await supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true)
    }

    const { data, error } = await supabase
      .from('shipping_addresses')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId) // 본인 소유의 배송지만 수정 가능
      .select()
      .single()

    if (error) {
      console.error('Error updating shipping address:', error)
      return {
        success: false,
        error: error.message || 'Failed to update shipping address',
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
    console.error('Error in updateAddressAction:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}

/**
 * 배송지 삭제 서버 액션
 */
export async function deleteAddressAction(id: string, userId: string) {
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
        error: 'Unauthorized to delete address for another user',
      }
    }

    const { error } = await supabase
      .from('shipping_addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId) // 본인 소유의 배송지만 삭제 가능

    if (error) {
      console.error('Error deleting shipping address:', error)
      return {
        success: false,
        error: error.message || 'Failed to delete shipping address',
      }
    }

    // 캐시 무효화
    revalidatePath('/profile')
    revalidatePath('/checkout')

    return {
      success: true,
    }
  } catch (error: any) {
    console.error('Error in deleteAddressAction:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}

/**
 * 기본 배송지 설정 서버 액션
 */
export async function setDefaultAddressAction(id: string, userId: string) {
  return updateAddressAction(id, userId, { is_default: true })
}
