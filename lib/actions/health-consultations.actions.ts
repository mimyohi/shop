'use server'

import { createClient } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'
import type { UpsertUserHealthConsultationInput } from '@/repositories/user-health-consultations.repository'

// numeric(5,2) 범위 검증 (최대 999.99)
function validateNumericField(value: number | undefined, fieldName: string, max: number = 999.99): string | null {
  if (value === undefined) return null
  if (value < 0) return `${fieldName}은(는) 0 이상이어야 합니다.`
  if (value > max) return `${fieldName}이(가) 너무 큽니다. (최대: ${max})`
  return null
}

/**
 * 사용자 문진 정보 저장/수정 서버 액션
 */
export async function saveUserHealthConsultationAction(data: UpsertUserHealthConsultationInput) {
  try {
    // 숫자 필드 범위 검증 (DB: numeric(5,2) - 최대 999.99)
    const validationErrors = [
      validateNumericField(data.current_height, '키', 300),
      validateNumericField(data.current_weight, '체중', 500),
      validateNumericField(data.min_weight_since_20s, '최저체중', 500),
      validateNumericField(data.max_weight_since_20s, '최고체중', 500),
      validateNumericField(data.target_weight, '희망체중', 500),
    ].filter(Boolean)

    if (validationErrors.length > 0) {
      return {
        success: false,
        error: validationErrors[0],
      }
    }

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
