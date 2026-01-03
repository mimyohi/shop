import { supabaseAuth } from '@/lib/supabaseAuth'
import { UserProfile } from '@/models'

export interface UpdateUserProfileData {
  display_name?: string
  phone?: string
}

export const userProfilesRepository = {
  /**
   * 사용자 프로필 조회
   */
  async findByUserId(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabaseAuth
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error('Failed to fetch user profile')
    }

    return data
  },

  /**
   * 사용자 프로필 업데이트
   */
  async update(userId: string, data: UpdateUserProfileData): Promise<UserProfile | null> {
    const { data: updated, error } = await supabaseAuth
      .from('user_profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error('Failed to update user profile')
    }

    return updated
  },
}
