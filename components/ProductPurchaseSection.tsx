"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Product,
  VisitType,
  SelectedOptionSetting,
  ProductOption,
  ProductAddon,
  SelectedAddon,
} from "@/models";
import { useOrderStore } from "@/store/orderStore";
import ProductNewOptionsSelector from "./ProductNewOptionsSelector";
import type { ProductOptionWithSettings } from "@/repositories/product-options.repository";

// 방문 타입 한글 변환
function getVisitTypeLabel(visitType: VisitType): string {
  switch (visitType) {
    case "first":
      return "초진";
    case "revisit_with_consult":
      return "재진(상담)";
    case "revisit_no_consult":
      return "재진(상담X)";
    default:
      return visitType;
  }
}

interface Props {
  product: Product;
  productOptions: ProductOptionWithSettings[];
  productAddons: ProductAddon[];
}

export default function ProductPurchaseSection({
  product,
  productOptions,
  productAddons,
}: Props) {
  const router = useRouter();

  // 현재 선택 중인 옵션 상태 (선택 UI용)
  const [selectedOption, setSelectedOption] =
    useState<ProductOptionWithSettings | null>(null);
  const [selectedVisitType, setSelectedVisitType] = useState<VisitType | null>(
    null
  );
  const [selectedSettings, setSelectedSettings] = useState<
    SelectedOptionSetting[]
  >([]);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [quantity, setQuantity] = useState(1);
  const hasOptions = productOptions.length > 0;
  const hasAddons = productAddons.length > 0;

  // 주문 스토어
  const setOrderItem = useOrderStore((state) => state.setOrderItem);
  const setOrderFromProduct = useOrderStore(
    (state) => state.setOrderFromProduct
  );

  const handleOptionSelectionChange = useCallback(
    (
      option: ProductOptionWithSettings | null,
      visitType: VisitType | null,
      settings: SelectedOptionSetting[]
    ) => {
      setSelectedOption(option);
      setSelectedVisitType(visitType);
      setSelectedSettings(settings);
    },
    []
  );

  // 추가 상품 선택/해제
  const handleAddonToggle = useCallback((addon: ProductAddon) => {
    setSelectedAddons((prev) => {
      const existing = prev.find((a) => a.addon_id === addon.id);
      if (existing) {
        return prev.filter((a) => a.addon_id !== addon.id);
      }
      return [
        ...prev,
        {
          addon_id: addon.id,
          name: addon.name,
          price: addon.price,
          quantity: 1,
        },
      ];
    });
  }, []);

  // 추가 상품 수량 변경
  const handleAddonQuantityChange = useCallback((addonId: string, delta: number) => {
    setSelectedAddons((prev) =>
      prev.map((addon) => {
        if (addon.addon_id === addonId) {
          const newQuantity = Math.max(1, addon.quantity + delta);
          return { ...addon, quantity: newQuantity };
        }
        return addon;
      })
    );
  }, []);

  // 설정이 필요한지 확인
  const shouldShowSettings = useCallback(() => {
    if (!selectedOption || !selectedVisitType) return false;

    switch (selectedVisitType) {
      case "first":
        return selectedOption.use_settings_on_first;
      case "revisit_with_consult":
        return selectedOption.use_settings_on_revisit_with_consult;
      case "revisit_no_consult":
        return selectedOption.use_settings_on_revisit_no_consult;
      default:
        return false;
    }
  }, [selectedOption, selectedVisitType]);

  // 선택된 옵션에 설정(개월수)이 있는지 확인
  const optionHasSettings = useCallback((option: ProductOptionWithSettings | null) => {
    return (option?.settings?.length ?? 0) > 0;
  }, []);

  // 선택이 완료되었는지 확인
  const isSelectionComplete = useCallback(() => {
    // 옵션이 없는 상품은 바로 구매 가능
    if (hasOptions === false) return true;

    if (!selectedOption || !selectedVisitType) return false;

    // 개월수 설정이 없는 옵션은 바로 구매 가능
    if (!optionHasSettings(selectedOption)) return true;

    const needsSettings = shouldShowSettings();
    if (!needsSettings) return true;

    // 설정이 필요한 경우, 모든 설정이 선택되었는지 확인
    const requiredSettingsCount = selectedOption.settings?.length || 0;
    return selectedSettings.length === requiredSettingsCount;
  }, [
    hasOptions,
    selectedOption,
    selectedVisitType,
    selectedSettings,
    shouldShowSettings,
    optionHasSettings,
  ]);

  // 옵션의 할인된 가격 계산
  const getOptionDiscountedPrice = (option: ProductOptionWithSettings) => {
    const discountRate = option.discount_rate || 0;
    if (discountRate === 0) {
      return option.price;
    }
    return Math.floor(option.price * (1 - discountRate / 100));
  };

  // 선택된 옵션의 할인된 가격
  const selectedOptionPrice = selectedOption
    ? getOptionDiscountedPrice(selectedOption)
    : 0;

  // 추가 상품 총 가격 계산
  const calculateAddonsPrice = () => {
    return selectedAddons.reduce((sum, addon) => sum + addon.price * addon.quantity, 0);
  };

  // 총 가격 계산 (옵션 할인가 × 수량 + 추가 상품)
  const calculateTotalPrice = () => {
    const addonsPrice = calculateAddonsPrice();
    if (!selectedOption) {
      // 옵션이 없는 경우 (모든 상품에 옵션 필수이므로 발생하지 않아야 함)
      return addonsPrice;
    }
    return selectedOptionPrice * quantity + addonsPrice;
  };

  // 선택된 아이템 제거
  const handleRemoveItem = () => {
    setSelectedOption(null);
    setSelectedVisitType(null);
    setSelectedSettings([]);
    setSelectedAddons([]);
    setQuantity(1);
  };

  // 바로 구매 (선택 완료 후)
  const handleBuyNow = () => {
    // 옵션이 없는 상품의 경우
    if (hasOptions === false) {
      setOrderFromProduct(product, quantity, selectedAddons);
      router.push("/checkout");
      return;
    }

    if (!selectedOption || !selectedVisitType) {
      alert("옵션을 선택해주세요.");
      return;
    }

    if (!isSelectionComplete()) {
      alert("모든 설정을 선택해주세요.");
      return;
    }

    // ProductOptionWithSettings를 ProductOption으로 변환
    const optionForOrder: ProductOption = {
      id: selectedOption.id,
      product_id: selectedOption.product_id,
      slug: selectedOption.slug,
      name: selectedOption.name,
      category: selectedOption.category,
      image_url: selectedOption.image_url,
      detail_images: selectedOption.detail_images,
      price: selectedOption.price,
      discount_rate: selectedOption.discount_rate || 0,
      is_representative: selectedOption.is_representative || false,
      use_settings_on_first: selectedOption.use_settings_on_first,
      use_settings_on_revisit_with_consult:
        selectedOption.use_settings_on_revisit_with_consult,
      use_settings_on_revisit_no_consult:
        selectedOption.use_settings_on_revisit_no_consult,
      is_new_badge: selectedOption.is_new_badge,
      is_sale_badge: selectedOption.is_sale_badge,
      display_order: selectedOption.display_order,
      created_at: selectedOption.created_at,
      updated_at: selectedOption.updated_at,
    };

    // 주문 스토어에 저장 (상품 정보 포함하여 할인율 반영)
    setOrderItem(optionForOrder, quantity, selectedVisitType, selectedSettings, product, selectedAddons);

    // 결제 페이지로 이동
    router.push("/checkout");
  };

  const totalPrice = calculateTotalPrice();
  const isOutOfStock = product.is_out_of_stock;
  const canBuy = isSelectionComplete() && !isOutOfStock;

  return (
    <div className="space-y-4">
      {/* 옵션 선택 드롭다운들 */}
      <ProductNewOptionsSelector
        options={productOptions}
        onSelectionChange={handleOptionSelectionChange}
      />

      {/* 추가 상품 선택 */}
      {hasAddons && (
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">추가 상품</p>
          <div className="space-y-2">
            {productAddons.map((addon) => {
              const selectedAddon = selectedAddons.find(
                (a) => a.addon_id === addon.id
              );
              const isSelected = !!selectedAddon;
              return (
                <div
                  key={addon.id}
                  className={`p-3 border rounded-lg transition ${
                    isSelected
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200"
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleAddonToggle(addon)}
                      className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                    />
                    {addon.image_url && (
                      <img
                        src={addon.image_url}
                        alt={addon.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {addon.name}
                      </p>
                      {addon.description && (
                        <p className="text-xs text-gray-500">{addon.description}</p>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      +{Number(addon.price).toLocaleString()}원
                    </span>
                  </label>
                  {/* 수량 조절 - 선택된 경우에만 표시 */}
                  {isSelected && selectedAddon && (
                    <div className="flex items-center justify-end mt-2 pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">수량</span>
                        <div className="flex items-center border border-gray-300 rounded">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddonQuantityChange(addon.id, -1);
                            }}
                            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                            disabled={selectedAddon.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {selectedAddon.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddonQuantityChange(addon.id, 1);
                            }}
                            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-medium text-gray-900 min-w-[80px] text-right">
                          +{(Number(addon.price) * selectedAddon.quantity).toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 선택된 상품 표시 - 옵션이 있는 경우 */}
      {canBuy && selectedOption && selectedVisitType && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <p className="text-sm text-gray-900">{product.name}</p>
              {selectedSettings.length > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedSettings.map((s) => s.type_name).join(", ")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* 수량 조절 */}
              <div className="flex items-center border border-gray-300 rounded-full">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 12H4"
                    />
                  </svg>
                </button>
                <span className="w-8 text-center text-sm font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </div>
              {/* 가격 */}
              <span className="text-sm font-medium text-gray-900 min-w-[80px] text-right">
                {(selectedOptionPrice * quantity).toLocaleString()}원
              </span>
              {/* 삭제 버튼 */}
              <button
                onClick={handleRemoveItem}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 옵션이 없는 상품의 수량/가격 표시 - 모든 상품에 옵션 필수이므로 표시되지 않음 */}
      {hasOptions === false && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <p className="text-sm text-gray-900">{product.name}</p>
              <p className="text-xs text-red-500 mt-1">옵션이 필요합니다</p>
            </div>
          </div>
        </div>
      )}

      {/* 총 상품금액 */}
      {canBuy && (
        <div className="flex justify-end items-center gap-2 py-4 border-t border-gray-200">
          <span className="text-sm text-gray-600">총 상품금액 (수량)</span>
          <span className="text-xl font-bold text-gray-900">
            {totalPrice.toLocaleString()}원
          </span>
          <span className="text-sm text-gray-500">({quantity}개)</span>
        </div>
      )}

      {/* 구매 버튼 */}
      <div className="pt-4">
        {isOutOfStock ? (
          <div className="w-full py-4 rounded text-sm font-medium bg-gray-300 text-gray-600 text-center cursor-not-allowed">
            품절
          </div>
        ) : (
          <button
            onClick={handleBuyNow}
            disabled={!canBuy}
            className={`w-full py-4 rounded text-sm font-medium transition ${
              canBuy
                ? "bg-black text-white "
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            구매하기
          </button>
        )}
      </div>
    </div>
  );
}
