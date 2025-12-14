"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Product,
  VisitType,
  SelectedOptionSetting,
  ProductOption,
} from "@/models";
import { useOrderStore } from "@/store/orderStore";
import ProductNewOptionsSelector from "./ProductNewOptionsSelector";
import { useOptionalAuth } from "@/hooks/useAuth";

// ProductNewOptionsSelector에서 반환하는 타입
interface ProductOptionWithSettings {
  id: string;
  product_id?: string | null;
  slug?: string;
  name: string;
  category?: string;
  image_url?: string;
  detail_images?: string[];
  price: number;
  use_settings_on_first: boolean;
  use_settings_on_revisit_with_consult: boolean;
  use_settings_on_revisit_no_consult: boolean;
  is_new_badge?: boolean;
  is_sale_badge?: boolean;
  display_order?: number;
  created_at: string;
  updated_at: string;
  settings?: any[];
}

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
}

export default function ProductPurchaseSection({ product }: Props) {
  const router = useRouter();

  // 공통 인증 훅 사용 (카카오 프로필 미완성 = 미인증 처리)
  const { isLoading: authLoading, isAuthenticated } = useOptionalAuth();

  // 현재 선택 중인 옵션 상태 (선택 UI용)
  const [selectedOption, setSelectedOption] =
    useState<ProductOptionWithSettings | null>(null);
  const [selectedVisitType, setSelectedVisitType] = useState<VisitType | null>(
    null
  );
  const [selectedSettings, setSelectedSettings] = useState<
    SelectedOptionSetting[]
  >([]);
  const [quantity, setQuantity] = useState(1);
  const [hasOptions, setHasOptions] = useState<boolean | null>(null); // null = 로딩 중

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

  const handleOptionsLoaded = useCallback((loaded: boolean) => {
    setHasOptions(loaded);
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

  // 선택이 완료되었는지 확인
  const isSelectionComplete = useCallback(() => {
    // 옵션이 없는 상품은 바로 구매 가능
    if (hasOptions === false) return true;

    if (!selectedOption || !selectedVisitType) return false;

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
  ]);

  // 총 가격 계산
  const calculateTotalPrice = () => {
    if (!selectedOption) {
      return product.price;
    }
    return selectedOption.price * quantity;
  };

  // 선택된 아이템 제거
  const handleRemoveItem = () => {
    setSelectedOption(null);
    setSelectedVisitType(null);
    setSelectedSettings([]);
    setQuantity(1);
  };

  // 바로 구매 (선택 완료 후)
  const handleBuyNow = () => {
    // 옵션이 없는 상품의 경우
    if (hasOptions === false) {
      setOrderFromProduct(product, quantity);
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

    // 주문 스토어에 저장
    setOrderItem(optionForOrder, quantity, selectedVisitType, selectedSettings);

    // 결제 페이지로 이동
    router.push("/checkout");
  };

  const totalPrice = calculateTotalPrice();
  const isOutOfStock = product.is_out_of_stock;
  const canBuy = isSelectionComplete() && !isOutOfStock;

  // 로그인 상태 확인 중
  if (authLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-gray-100 rounded animate-pulse" />
        <div className="h-12 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 옵션 선택 드롭다운들 */}
      <ProductNewOptionsSelector
        productId={product.id}
        onSelectionChange={handleOptionSelectionChange}
        onOptionsLoaded={handleOptionsLoaded}
      />

      {/* 선택된 상품 표시 - 옵션이 있는 경우 */}
      {canBuy && selectedOption && selectedVisitType && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <p className="text-sm text-gray-900">{product.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {getVisitTypeLabel(selectedVisitType)}
                {selectedSettings.length > 0 && (
                  <span>
                    {" "}
                    / {selectedSettings.map((s) => s.type_name).join(", ")}
                  </span>
                )}
              </p>
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
                {(selectedOption.price * quantity).toLocaleString()}원
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

      {/* 옵션이 없는 상품의 수량/가격 표시 */}
      {hasOptions === false && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <p className="text-sm text-gray-900">{product.name}</p>
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
                {(product.price * quantity).toLocaleString()}원
              </span>
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
                ? "bg-[#5a8a87] text-white hover:bg-[#4a7a77]"
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
