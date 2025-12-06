/**
 * UserPoints 테이블 모델
 */
export interface UserPoints {
  id: string
  user_id: string
  points: number
  total_earned: number
  total_used: number
  created_at: string
  updated_at: string
}

/**
 * PointHistory 테이블 모델
 */
export interface PointHistory {
  id: string
  user_id: string
  points: number
  type: 'earn' | 'use'
  reason: string
  order_id?: string
  created_at: string
}
