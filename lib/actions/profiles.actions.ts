'use server'

import { createClient } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'
import type { UpdateUserProfileData } from '@/repositories/user-profiles.repository'

/**
 * 사용자 프로필 업데이트 서버 액션
 */
export async function updateUserProfileAction(userId: string, data: UpdateUserProfileData) {
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
        error: 'Unauthorized to update profile for another user',
      }
    }

    // 프로필 업데이트
    const { data: updated, error } = await supabase
      .from('user_profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return {
        success: false,
        error: error.message || 'Failed to update user profile',
      }
    }

    // 캐시 무효화
    revalidatePath('/profile')

    return {
      success: true,
      data: updated,
    }
  } catch (error: any) {
    console.error('Error in updateUserProfileAction:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}
