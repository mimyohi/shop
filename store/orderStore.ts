import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Product,
  ProductOption,
  SelectedOptionSetting,
  VisitType,
} from '@/models';

// 단일 주문 아이템 타입
export interface OrderItem {
  option: ProductOption | null; // 옵션이 없는 경우 null
  product?: Product; // 상품 정보 (기본가격, 할인율 포함)
  quantity: number;
  visit_type: VisitType | null; // 옵션이 없으면 null
  selected_settings?: SelectedOptionSetting[];
}

interface OrderStore {
  // 현재 주문 아이템 (단일)
  item: OrderItem | null;

  // Hydration 상태
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // 주문 아이템 설정 (옵션 있는 상품)
  setOrderItem: (
    option: ProductOption,
    quantity: number,
    visitType: VisitType,
    selectedSettings?: SelectedOptionSetting[],
    product?: Product
  ) => void;

  // 주문 아이템 설정 (옵션 없는 상품)
  setOrderFromProduct: (product: Product, quantity: number) => void;

  // 수량 변경
  updateQuantity: (quantity: number) => void;

  // 주문 초기화
  clearOrder: () => void;

  // 총 가격 계산
  getTotalPrice: () => number;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      item: null,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      setOrderItem: (
        option: ProductOption,
        quantity: number,
        visitType: VisitType,
        selectedSettings = [],
        product?: Product
      ) => {
        set({
          item: {
            option,
            product,
            quantity,
            visit_type: visitType,
            selected_settings: selectedSettings.length > 0 ? selectedSettings : undefined,
          },
        });
      },

      setOrderFromProduct: (product: Product, quantity: number) => {
        set({
          item: {
            option: null,
            product,
            quantity,
            visit_type: null,
          },
        });
      },

      updateQuantity: (quantity: number) => {
        const currentItem = get().item;
        if (!currentItem || quantity <= 0) return;

        set({
          item: {
            ...currentItem,
            quantity,
          },
        });
      },

      clearOrder: () => {
        set({ item: null });
      },

      getTotalPrice: () => {
        const item = get().item;
        if (!item) return 0;

        // 할인된 기본 가격 계산 (기본가격에만 할인 적용)
        const basePrice = item.product?.price ?? 0;
        const discountRate = item.product?.discount_rate ?? 0;
        const discountedBasePrice = discountRate > 0
          ? Math.floor(basePrice * (1 - discountRate / 100))
          : basePrice;

        // 옵션이 있으면 옵션 추가 가격을 더함
        const optionPrice = item.option?.price ?? 0;
        const totalUnitPrice = discountedBasePrice + optionPrice;

        return totalUnitPrice * item.quantity;
      },
    }),
    {
      name: 'order-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
