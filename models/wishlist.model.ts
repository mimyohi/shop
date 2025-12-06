import type { Product } from './product.model'

/**
 * Wishlist 테이블 모델
 */
export interface WishlistItem {
  id: string
  user_email: string
  product_id: string
  created_at: string
  product?: Product
}
