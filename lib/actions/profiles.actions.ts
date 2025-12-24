'use server'

import { createClient } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'
import type { UpdateUserProfileData } from '@/repositories/user-profiles.repository'

interface UpdateKakaoProfileData {
  display_name: string
  phone: string
  phone_verified: boolean
  phone_verified_at: string
  marketing_consent?: boolean
  sms_consent?: boolean
  email_consent?: boolean
}

/**
 * 카카오 사용자 프로필 완성 서버 액션
 * 카카오 로그인 후 추가 정보(이름, 전화번호) 입력 시 사용
 */
export async function updateKakaoUserProfileAction(
  userId: string,
  data: UpdateKakaoProfileData
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
        error: '로그인이 필요합니다.',
      }
    }

    // user_id가 현재 사용자와 일치하는지 확인
    if (userId !== user.id) {
      return {
        success: false,
        error: '권한이 없습니다.',
      }
    }

    // 카카오 사용자인지 확인
    if (user.app_metadata?.provider !== 'kakao') {
      return {
        success: false,
        error: '카카오 로그인 사용자만 이용 가능합니다.',
      }
    }

    // 프로필 업데이트
    const { data: updated, error } = await supabase
      .from('user_profiles')
      .update({
        display_name: data.display_name,
        phone: data.phone,
        phone_verified: data.phone_verified,
        phone_verified_at: data.phone_verified_at,
        marketing_consent: data.marketing_consent ?? false,
        sms_consent: data.sms_consent ?? false,
        email_consent: data.email_consent ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating kakao user profile:', error)
      return {
        success: false,
        error: '프로필 업데이트에 실패했습니다.',
      }
    }

    // 캐시 무효화
    revalidatePath('/profile')
    revalidatePath('/')

    return {
      success: true,
      data: updated,
    }
  } catch (error: any) {
    console.error('Error in updateKakaoUserProfileAction:', error)
    return {
      success: false,
      error: error.message || '오류가 발생했습니다.',
    }
  }
}

// 허용된 프로필 업데이트 필드 (화이트리스트)
const ALLOWED_PROFILE_UPDATE_FIELDS = ['display_name', 'phone'] as const;

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

    // 화이트리스트에 있는 필드만 업데이트 허용
    const sanitizedData: Record<string, unknown> = {}
    for (const field of ALLOWED_PROFILE_UPDATE_FIELDS) {
      if (field in data && data[field as keyof UpdateUserProfileData] !== undefined) {
        sanitizedData[field] = data[field as keyof UpdateUserProfileData]
      }
    }

    // 프로필 업데이트
    const { data: updated, error } = await supabase
      .from('user_profiles')
      .update({
        ...sanitizedData,
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
