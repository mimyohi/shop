/**
 * 가격 계산 유틸리티 함수
 *
 * order_items, 옵션, 애드온 등의 가격을 정확하게 계산합니다.
 */

export interface OrderItemForCalculation {
  product_price: number;
  quantity: number;
  selected_options?: any;
  selected_addons?: any;
}

/**
 * 단일 주문 항목의 총 가격을 계산합니다
 * (상품 가격 + 옵션 추가 비용 + 애드온 가격) * 수량
 */
export function calculateOrderItemPrice(item: OrderItemForCalculation): number {
  let itemTotal = item.product_price * item.quantity;

  // 옵션 가격 추가
  if (item.selected_options) {
    const options = Array.isArray(item.selected_options)
      ? item.selected_options
      : [];
    options.forEach((option: any) => {
      if (option.price_adjustment) {
        itemTotal += option.price_adjustment * item.quantity;
      }
    });
  }

  // 애드온 가격 추가
  if (item.selected_addons) {
    const addons = Array.isArray(item.selected_addons)
      ? item.selected_addons
      : [];
    addons.forEach((addon: any) => {
      if (addon.price) {
        itemTotal += addon.price * item.quantity;
      }
    });
  }

  return itemTotal;
}

/**
 * 여러 주문 항목의 총 상품 금액을 계산합니다
 */
export function calculateProductAmount(items: OrderItemForCalculation[]): number {
  return items.reduce((total, item) => {
    return total + calculateOrderItemPrice(item);
  }, 0);
}

/**
 * 최종 결제 금액을 계산합니다
 * 상품 금액 + 배송비 - 쿠폰 할인 - 포인트 사용
 */
export function calculateFinalAmount(
  productAmount: number,
  shippingFee: number,
  couponDiscount: number,
  pointsUsed: number
): number {
  return productAmount + shippingFee - couponDiscount - pointsUsed;
}

/**
 * 주문 항목들로부터 최종 결제 금액을 계산합니다
 */
export function calculateFinalAmountFromItems(
  items: OrderItemForCalculation[],
  shippingFee: number,
  couponDiscount: number,
  pointsUsed: number
): number {
  const productAmount = calculateProductAmount(items);
  return calculateFinalAmount(productAmount, shippingFee, couponDiscount, pointsUsed);
}
