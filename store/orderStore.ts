import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ProductOption,
  SelectedOptionSetting,
  VisitType,
} from '@/models';

// 단일 주문 아이템 타입
export interface OrderItem {
  option: ProductOption;
  quantity: number;
  visit_type: VisitType;
  selected_settings?: SelectedOptionSetting[];
}

interface OrderStore {
  // 현재 주문 아이템 (단일)
  item: OrderItem | null;

  // 주문 아이템 설정
  setOrderItem: (
    option: ProductOption,
    quantity: number,
    visitType: VisitType,
    selectedSettings?: SelectedOptionSetting[]
  ) => void;

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
        return item.option.price * item.quantity;
      },
    }),
    {
      name: 'order-storage',
    }
  )
);
