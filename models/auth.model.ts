/**
 * PhoneOTP 테이블 모델
 */
export interface PhoneOTP {
  id: string
  phone: string
  otp_hash: string
  attempts: number
  verified: boolean
  expires_at: string
  created_at: string
  updated_at: string
}
