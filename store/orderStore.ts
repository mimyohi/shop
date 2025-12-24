import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Product,
  ProductOption,
  SelectedOptionSetting,
  SelectedAddon,
  VisitType,
} from '@/models';

// 단일 주문 아이템 타입
export interface OrderItem {
  option: ProductOption | null; // 옵션이 없는 경우 null
  product?: Product; // 상품 정보 (기본가격, 할인율 포함)
  quantity: number;
  visit_type: VisitType | null; // 옵션이 없으면 null
  selected_settings?: SelectedOptionSetting[];
  selected_addons?: SelectedAddon[]; // 추가 상품
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
    product?: Product,
    selectedAddons?: SelectedAddon[]
  ) => void;

  // 주문 아이템 설정 (옵션 없는 상품)
  setOrderFromProduct: (product: Product, quantity: number, selectedAddons?: SelectedAddon[]) => void;

  // 수량 변경
  updateQuantity: (quantity: number) => void;

  // 추가 상품 수량 변경
  updateAddonQuantity: (addonId: string, quantity: number) => void;

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
        product?: Product,
        selectedAddons = []
      ) => {
        set({
          item: {
            option,
            product,
            quantity,
            visit_type: visitType,
            selected_settings: selectedSettings.length > 0 ? selectedSettings : undefined,
            selected_addons: selectedAddons.length > 0 ? selectedAddons : undefined,
          },
        });
      },

      setOrderFromProduct: (product: Product, quantity: number, selectedAddons = []) => {
        set({
          item: {
            option: null,
            product,
            quantity,
            visit_type: null,
            selected_addons: selectedAddons.length > 0 ? selectedAddons : undefined,
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

      updateAddonQuantity: (addonId: string, quantity: number) => {
        const currentItem = get().item;
        if (!currentItem || !currentItem.selected_addons) return;

        const newQuantity = Math.max(1, quantity);
        set({
          item: {
            ...currentItem,
            selected_addons: currentItem.selected_addons.map((addon) =>
              addon.addon_id === addonId
                ? { ...addon, quantity: newQuantity }
                : addon
            ),
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

        // 추가 상품 가격 계산
        const addonsPrice = item.selected_addons?.reduce(
          (sum, addon) => sum + addon.price * addon.quantity,
          0
        ) ?? 0;

        return totalUnitPrice * item.quantity + addonsPrice;
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
