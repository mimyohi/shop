import { supabaseAuth } from '@/lib/supabaseAuth'
import { HealthConsultationDetails, UserHealthConsultation } from '@/models'

export interface UpsertUserHealthConsultationInput extends HealthConsultationDetails {
  user_id: string
}

export const userHealthConsultationsRepository = {
  /**
   * 사용자 문진 정보 조회
   */
  async findByUserId(userId: string): Promise<UserHealthConsultation | null> {
    const { data, error } = await supabaseAuth
      .from('user_health_consultations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      throw new Error('Failed to fetch user health consultation')
    }

    return data
  },

  /**
   * 사용자 문진 정보 저장/수정 (user_id 기준 upsert)
   */
  async upsert(data: UpsertUserHealthConsultationInput): Promise<UserHealthConsultation> {
    const { data: upserted, error } = await supabaseAuth
      .from('user_health_consultations')
      .upsert(data, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (error || !upserted) {
      throw new Error('Failed to save user health consultation')
    }

    return upserted
  },
}
