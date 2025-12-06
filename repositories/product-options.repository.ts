import { supabase } from '@/lib/supabase'
import { ProductAddon, ProductOption } from '@/models'

export interface ProductConfiguration {
  options: ProductOption[]
  addons: ProductAddon[]
}

export const productOptionsRepository = {
  /**
   * 상품 옵션 목록 조회 (옵션 값 포함)
   */
  async findOptionsByProductId(productId: string): Promise<ProductOption[]> {
    const { data, error } = await supabase
      .from('product_options')
      .select(
        `
        *,
        product_option_values (*)
      `
      )
      .eq('product_id', productId)
      .order('display_order')

    if (error) {
      console.error('Error fetching product options:', error)
      throw new Error('Failed to fetch product options')
    }

    return (
      data?.map((option) => ({
        ...option,
        values:
          (option.product_option_values as any[])
            ?.filter((value) => value.is_available)
            .sort((a, b) => a.display_order - b.display_order) || [],
      })) || []
    )
  },

  /**
   * 상품 추가 구성(애드온) 목록 조회
   */
  async findAddonsByProductId(productId: string): Promise<ProductAddon[]> {
    const { data, error } = await supabase
      .from('product_addons')
      .select('*')
      .eq('product_id', productId)
      .eq('is_available', true)
      .order('display_order')

    if (error) {
      console.error('Error fetching product addons:', error)
      throw new Error('Failed to fetch product addons')
    }

    return data || []
  },

  /**
   * 상품 옵션/애드온 구성 조회
   */
  async findConfigurationByProductId(productId: string): Promise<ProductConfiguration> {
    const [options, addons] = await Promise.all([
      this.findOptionsByProductId(productId),
      this.findAddonsByProductId(productId),
    ])

    return { options, addons }
  },
}
