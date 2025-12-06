/**
 * UserProfiles 테이블 모델
 */
export interface UserProfile {
  id: string
  user_id: string
  email: string
  display_name?: string
  phone?: string
  phone_verified?: boolean
  phone_verified_at?: string
  created_at: string
  updated_at: string
}

/**
 * UserHealthProfiles 테이블 모델
 */
export interface UserHealthProfile {
  id: string
  user_id: string
  birth_date?: string
  gender?: Gender
  height?: number // cm
  weight?: number // kg
  constitution_type?: ConstitutionType
  symptoms?: string[]
  health_conditions?: Record<string, any>
  allergies?: string
  medications?: string
  medical_history?: string
  family_history?: string
  pulse_diagnosis?: string
  tongue_diagnosis?: string
  notes?: string
  created_at: string
  updated_at: string
}

/**
 * ShippingAddresses 테이블 모델
 */
export interface ShippingAddress {
  id: string
  user_id: string
  name: string
  recipient: string
  phone: string
  postal_code?: string
  address: string
  address_detail?: string
  is_default: boolean
  created_at: string
  updated_at: string
}

/**
 * 성별
 */
export type Gender = 'male' | 'female' | 'other'

/**
 * 체질 타입 (사상체질)
 */
export type ConstitutionType = 'taeyang' | 'taeeum' | 'soyang' | 'soeum'
