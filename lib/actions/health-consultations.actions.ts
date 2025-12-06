'use server'

import { createClient } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'
import type { UpsertUserHealthConsultationInput } from '@/repositories/user-health-consultations.repository'

/**
 * 사용자 문진 정보 저장/수정 서버 액션
 */
export async function saveUserHealthConsultationAction(data: UpsertUserHealthConsultationInput) {
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
    if (data.user_id !== user.id) {
      return {
        success: false,
        error: 'Unauthorized to save health consultation for another user',
      }
    }

    // 문진 정보 저장/수정 (upsert)
    const { data: upserted, error } = await supabase
      .from('user_health_consultations')
      .upsert(data, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (error || !upserted) {
      console.error('Error saving user health consultation:', error)
      return {
        success: false,
        error: error?.message || 'Failed to save user health consultation',
      }
    }

    // 캐시 무효화
    revalidatePath('/profile')
    revalidatePath('/checkout')

    return {
      success: true,
      data: upserted,
    }
  } catch (error: any) {
    console.error('Error in saveUserHealthConsultationAction:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}
