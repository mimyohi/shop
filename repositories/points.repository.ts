import { supabaseAuth } from '@/lib/supabaseAuth'
import { UserPoints, PointHistory } from '@/models'

export const pointsRepository = {
  /**
   * 사용자 포인트 정보 조회
   */
  async findByUserId(userId: string): Promise<UserPoints | null> {
    const { data, error } = await supabaseAuth
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - 포인트 정보가 없으면 생성
        return this.create(userId)
      }
      return null
    }

    return data
  },

  /**
   * 포인트 정보 생성
   */
  async create(userId: string): Promise<UserPoints> {
    const { data, error } = await supabaseAuth
      .from('user_points')
      .insert({
        user_id: userId,
        points: 0,
        total_earned: 0,
        total_used: 0,
      })
      .select()
      .single()

    if (error) {
      throw new Error('Failed to create user points')
    }

    return data
  },

  /**
   * 포인트 히스토리 조회
   */
  async findHistoryByUserId(userId: string, limit = 50): Promise<PointHistory[]> {
    const { data, error } = await supabaseAuth
      .from('point_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error('Failed to fetch point history')
    }

    return data || []
  },

  /**
   * 포인트 적립
   */
  async earnPoints(
    userId: string,
    points: number,
    reason: string,
    orderId?: string
  ): Promise<UserPoints> {
    // 1. 포인트 히스토리 추가
    const { error: historyError } = await supabaseAuth.from('point_history').insert({
      user_id: userId,
      points,
      type: 'earn',
      reason,
      order_id: orderId,
    })

    if (historyError) {
      throw new Error('Failed to earn points')
    }

    // 2. 사용자 포인트 업데이트
    const userPoints = await this.findByUserId(userId)
    if (!userPoints) {
      throw new Error('User points not found')
    }

    const { data, error } = await supabaseAuth
      .from('user_points')
      .update({
        points: userPoints.points + points,
        total_earned: userPoints.total_earned + points,
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error('Failed to update user points')
    }

    return data
  },

  /**
   * 포인트 사용
   */
  async usePoints(
    userId: string,
    points: number,
    reason: string,
    orderId?: string
  ): Promise<UserPoints> {
    const userPoints = await this.findByUserId(userId)
    if (!userPoints) {
      throw new Error('User points not found')
    }

    if (userPoints.points < points) {
      throw new Error('Insufficient points')
    }

    // 1. 포인트 히스토리 추가
    const { error: historyError } = await supabaseAuth.from('point_history').insert({
      user_id: userId,
      points: -points, // 음수로 저장
      type: 'use',
      reason,
      order_id: orderId,
    })

    if (historyError) {
      throw new Error('Failed to use points')
    }

    // 2. 사용자 포인트 업데이트
    const { data, error } = await supabaseAuth
      .from('user_points')
      .update({
        points: userPoints.points - points,
        total_used: userPoints.total_used + points,
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error('Failed to update user points')
    }

    return data
  },
}
