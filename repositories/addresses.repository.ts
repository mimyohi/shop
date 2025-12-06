import { supabaseAuth } from '@/lib/supabaseAuth'
import { ShippingAddress } from '@/models'

export interface CreateAddressData {
  user_id: string
  name: string
  recipient: string
  phone: string
  postal_code?: string
  address: string
  address_detail?: string
  is_default?: boolean
}

export interface UpdateAddressData {
  name?: string
  recipient?: string
  phone?: string
  postal_code?: string
  address?: string
  address_detail?: string
  is_default?: boolean
}

export const addressesRepository = {
  /**
   * 사용자의 배송지 목록 조회
   */
  async findByUserId(userId: string): Promise<ShippingAddress[]> {
    const { data, error } = await supabaseAuth
      .from('shipping_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching shipping addresses:', error)
      throw new Error('Failed to fetch shipping addresses')
    }

    return data || []
  },

  /**
   * 배송지 조회 (ID로)
   */
  async findById(id: string): Promise<ShippingAddress | null> {
    const { data, error } = await supabaseAuth
      .from('shipping_addresses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching shipping address:', error)
      return null
    }

    return data
  },

  /**
   * 배송지 생성
   */
  async create(addressData: CreateAddressData): Promise<ShippingAddress> {
    // 기본 배송지로 설정하는 경우, 기존 기본 배송지 해제
    if (addressData.is_default) {
      await supabaseAuth
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', addressData.user_id)
        .eq('is_default', true)
    }

    const { data, error } = await supabaseAuth
      .from('shipping_addresses')
      .insert(addressData)
      .select()
      .single()

    if (error) {
      console.error('Error creating shipping address:', error)
      throw new Error('Failed to create shipping address')
    }

    return data
  },

  /**
   * 배송지 수정
   */
  async update(id: string, userId: string, updateData: UpdateAddressData): Promise<ShippingAddress> {
    // 기본 배송지로 변경하는 경우, 기존 기본 배송지 해제
    if (updateData.is_default) {
      await supabaseAuth
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true)
    }

    const { data, error } = await supabaseAuth
      .from('shipping_addresses')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId) // 본인 소유의 배송지만 수정 가능
      .select()
      .single()

    if (error) {
      console.error('Error updating shipping address:', error)
      throw new Error('Failed to update shipping address')
    }

    return data
  },

  /**
   * 배송지 삭제
   */
  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabaseAuth
      .from('shipping_addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId) // 본인 소유의 배송지만 삭제 가능

    if (error) {
      console.error('Error deleting shipping address:', error)
      throw new Error('Failed to delete shipping address')
    }
  },

  /**
   * 기본 배송지 설정
   */
  async setDefault(id: string, userId: string): Promise<ShippingAddress> {
    return this.update(id, userId, { is_default: true })
  },
}
