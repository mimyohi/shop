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
  product?: Product; // 옵션 없는 상품의 경우 상품 정보 직접 저장
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
    selectedSettings?: SelectedOptionSetting[]
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
        selectedSettings = []
      ) => {
        set({
          item: {
            option,
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
        // 옵션이 있으면 옵션 가격, 없으면 상품 가격 사용
        const price = item.option?.price ?? item.product?.price ?? 0;
        return price * item.quantity;
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
