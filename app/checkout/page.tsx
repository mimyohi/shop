"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/store/orderStore";
import * as PortOne from "@portone/browser-sdk/v2";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import type { Coupon, HealthConsultationDetails, Product } from "@/models";
import { productsQueries } from "@/queries/products.queries";
import HealthConsultationForm from "@/components/HealthConsultationForm";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AddressSearch from "@/components/AddressSearch";
import { useCreateOrder } from "@/queries/orders.queries";
import {
  deleteOrderByOrderIdAction,
  updateOrderStatusAction,
  processTestPaymentBenefitsAction,
} from "@/lib/actions/orders.actions";
import { couponsQueries } from "@/queries/coupons.queries";
import { pointsQueries } from "@/queries/points.queries";
import {
  addressesQueries,
  useCreateAddress,
} from "@/queries/addresses.queries";
import { userProfilesQueries } from "@/queries/user-profiles.queries";
import { userHealthConsultationsQueries } from "@/queries/user-health-consultations.queries";
import { useShippingFee } from "@/hooks/useShippingFee";
import {
  NEXT_PUBLIC_PORTONE_STORE_ID,
  NEXT_PUBLIC_PORTONE_CHANNEL_KEY,
  NODE_ENV,
} from "@/env";

// 방문 타입 한글 변환
function getVisitTypeLabel(visitType: string): string {
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

const storeId = NEXT_PUBLIC_PORTONE_STORE_ID;

export default function CheckoutPage() {
  const router = useRouter();
  const { item, getTotalPrice, updateQuantity, clearOrder, _hasHydrated } =
    useOrderStore();
  const createOrderMutation = useCreateOrder();
  const createAddressMutation = useCreateAddress();

  // 공통 인증 훅 사용 (카카오 프로필 미완성 시 자동 리다이렉트)
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 배송지 정보
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "",
    recipient: "",
    phone: "",
    postal_code: "",
    address: "",
    address_detail: "",
  });

  // 포인트 & 쿠폰
  const [usePoints, setUsePoints] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState<string>("");
  const [showCouponModal, setShowCouponModal] = useState(false);

  // React Query로 데이터 조회
  const { data: userPoints = null } = useQuery({
    ...pointsQueries.byUserId(user?.id || ""),
    enabled: !!user?.id,
  });

  const { data: availableCoupons = [] } = useQuery({
    ...couponsQueries.userCoupons(user?.id || ""),
    enabled: !!user?.id,
  });

  const { data: addresses = [] } = useQuery({
    ...addressesQueries.byUserId(user?.id || ""),
    enabled: !!user?.id,
  });

  const { data: savedHealthConsultation = null } = useQuery({
    ...userHealthConsultationsQueries.byUserId(user?.id || ""),
    enabled: !!user?.id,
  });

  // 건강 상담 정보
  const [healthConsultation, setHealthConsultation] =
    useState<Partial<HealthConsultationDetails> | null>(null);
  const [showHealthForm, setShowHealthForm] = useState(true);

  // 상품 정보 조회 (옵션의 product_id가 있는 경우)
  const productId = item?.option?.product_id || item?.product?.id;
  const { data: latestProducts } = useQuery({
    ...productsQueries.byIds(productId ? [productId] : []),
    enabled: !!productId,
  });

  // 상품 정보 (옵션 없는 경우 item.product 사용)
  const product = useMemo(() => {
    // 옵션이 없는 상품인 경우 item.product 사용
    if (item?.product) return item.product;
    if (!productId || !latestProducts) return null;
    return latestProducts.find((p) => p.id === productId) || null;
  }, [productId, latestProducts, item?.product]);

  // 우편번호 추출 (배송비 계산용)
  const currentZipcode = useMemo(() => {
    if (selectedAddressId) {
      const selectedAddress = addresses.find(
        (addr) => addr.id === selectedAddressId
      );
      return selectedAddress?.postal_code || "";
    }
    return "";
  }, [selectedAddressId, addresses]);

  // 배송비 실시간 계산
  const { shippingFee, isLoading: isCalculatingShipping } = useShippingFee({
    orderAmount: getTotalPrice(),
    zipcode: currentZipcode,
    enabled: !!currentZipcode && currentZipcode.length === 5,
  });

  // 리다이렉트 여부를 추적하는 ref (한 번만 실행되도록)
  const hasRedirected = useRef(false);

  // 주문 정보가 없으면 리다이렉트 (hydration 완료 후 최초 1회만 체크)
  useEffect(() => {
    // 이미 리다이렉트했거나, hydration이 완료되지 않았으면 무시
    if (hasRedirected.current || !_hasHydrated) return;

    // store에서 직접 최신 item 값을 가져와서 체크
    const currentItem = useOrderStore.getState().item;
    if (!currentItem) {
      hasRedirected.current = true;
      alert("주문 정보가 없습니다.");
      router.push("/products");
    }
  }, [_hasHydrated, router]);

  // 사용자 이메일 설정
  useEffect(() => {
    if (user?.email) {
      setCustomerEmail(user.email);
    }
  }, [user?.email]);

  // 기본 배송지 자동 선택
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((addr) => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }
    }
  }, [addresses, selectedAddressId]);

  const { data: profile } = useQuery({
    ...userProfilesQueries.byUserId(user?.id || ""),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profile) {
      setCustomerName(profile.display_name || "");
      setCustomerPhone(profile.phone || "");
    }
  }, [profile]);

  useEffect(() => {
    if (savedHealthConsultation && !healthConsultation) {
      setHealthConsultation({ ...savedHealthConsultation });
      setShowHealthForm(false);
    }
  }, [savedHealthConsultation, healthConsultation]);

  const calculateDiscount = () => {
    let discount = 0;

    if (selectedCoupon) {
      const userCoupon = availableCoupons.find(
        (uc) => uc.id === selectedCoupon
      );
      if (userCoupon) {
        const coupon = userCoupon.coupon as Coupon;
        if (getTotalPrice() >= coupon.min_purchase) {
          if (coupon.discount_type === "percentage") {
            discount = Math.floor(
              (getTotalPrice() * coupon.discount_value) / 100
            );
            if (coupon.max_discount) {
              discount = Math.min(discount, coupon.max_discount);
            }
          } else {
            discount = coupon.discount_value;
          }
        }
      }
    }

    return discount;
  };

  const calculateFinalPrice = () => {
    const total = getTotalPrice();
    const couponDiscount = calculateDiscount();
    const pointDiscount = usePoints;
    const shipping = shippingFee?.totalShippingFee || 0;

    return Math.max(0, total + shipping - couponDiscount - pointDiscount);
  };

  const handlePointsChange = (value: number) => {
    const maxUsablePoints = Math.min(
      userPoints?.points || 0,
      getTotalPrice() - calculateDiscount()
    );

    if (value > maxUsablePoints) {
      setUsePoints(maxUsablePoints);
    } else if (value < 0) {
      setUsePoints(0);
    } else {
      setUsePoints(Math.floor(value));
    }
  };

  // 새 배송지 저장 핸들러
  const handleSaveNewAddress = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (
      !newAddress.name ||
      !newAddress.recipient ||
      !newAddress.phone ||
      !newAddress.postal_code ||
      !newAddress.address
    ) {
      alert("필수 정보를 모두 입력해주세요.");
      return;
    }

    try {
      const savedAddress = await createAddressMutation.mutateAsync({
        user_id: user.id,
        name: newAddress.name,
        recipient: newAddress.recipient,
        phone: newAddress.phone,
        postal_code: newAddress.postal_code,
        address: newAddress.address,
        address_detail: newAddress.address_detail || "",
        is_default: addresses.length === 0, // 첫 배송지면 기본으로 설정
      });

      // 새로 저장된 배송지 자동 선택
      if (savedAddress?.id) {
        setSelectedAddressId(savedAddress.id);
      }

      // 모달 닫기 및 입력 초기화
      setShowAddAddressModal(false);
      setNewAddress({
        name: "",
        recipient: "",
        phone: "",
        postal_code: "",
        address: "",
        address_detail: "",
      });
    } catch (error: any) {
      console.error("배송지 저장 실패:", error);
      alert(error?.message || "배송지 저장에 실패했습니다.");
    }
  };

  const handlePayment = async () => {
    if (!item) {
      alert("주문 정보가 없습니다.");
      return;
    }

    // 상품 상태 확인 (삭제 또는 품절)
    if (!product) {
      alert(
        "상품 정보를 찾을 수 없습니다. 삭제되었거나 일시적으로 판매 중지된 상품입니다."
      );
      router.push("/products");
      return;
    }

    if (product.is_out_of_stock) {
      alert("품절된 상품입니다. 다른 상품을 선택해주세요.");
      router.push("/products");
      return;
    }

    // 배송지 정보 체크
    if (!selectedAddressId) {
      alert("배송지를 선택해주세요.");
      return;
    }

    // 문진 정보 체크
    if (!healthConsultation) {
      const confirmProceed = confirm(
        "문진 정보를 입력하지 않으셨습니다. 그대로 진행하시겠습니까?"
      );
      if (!confirmProceed) {
        setShowHealthForm(true);
        return;
      }
    }

    const orderId = `ORDER_${Date.now()}`;
    const orderName = item.option?.name || product?.name || "상품";

    setIsLoading(true);

    try {
      // 배송지 정보 준비
      let shippingInfo;
      if (user && selectedAddressId) {
        const selectedAddress = addresses.find(
          (addr) => addr.id === selectedAddressId
        );
        if (selectedAddress) {
          shippingInfo = {
            shipping_address_id: selectedAddress.id,
            shipping_name: selectedAddress.recipient,
            shipping_phone: selectedAddress.phone,
            shipping_postal_code: selectedAddress.postal_code,
            shipping_address: selectedAddress.address,
            shipping_address_detail: selectedAddress.address_detail,
          };
        }
      }

      // 선택한 쿠폰의 user_coupon_id 찾기
      const selectedUserCouponForPayment = selectedCoupon
        ? availableCoupons.find((uc: any) => uc.id === selectedCoupon)
        : null;

      // 주문 정보 저장
      const order = await createOrderMutation.mutateAsync({
        user_email: customerEmail,
        user_name: customerName,
        user_phone: customerPhone,
        total_amount: calculateFinalPrice(),
        order_id: orderId,
        ...(shippingInfo && {
          shipping_address_id: shippingInfo.shipping_address_id,
          shipping_name: shippingInfo.shipping_name,
          shipping_phone: shippingInfo.shipping_phone,
          shipping_postal_code: shippingInfo.shipping_postal_code,
          shipping_address: shippingInfo.shipping_address,
          shipping_address_detail: shippingInfo.shipping_address_detail,
          zipcode: currentZipcode,
        }),
        // 포인트/쿠폰 정보
        used_points: usePoints,
        user_coupon_id: selectedUserCouponForPayment?.id || undefined,
        coupon_discount: calculateDiscount(),
        // 배송비
        shipping_fee: shippingFee?.totalShippingFee || 0,
        items: [
          {
            product_id:
              item.option?.product_id || item.product?.id || undefined,
            product_name: product?.name || item.option?.name || "상품",
            product_price: item.option?.price ?? item.product?.price ?? 0,
            quantity: item.quantity,
            option_id: item.option?.id,
            option_name: item.option?.name,
            option_price: item.option?.price,
            visit_type: item.visit_type ?? undefined,
            selected_option_settings: item.selected_settings,
          },
        ],
        health_consultation: healthConsultation
          ? {
              user_id: user?.id,
              ...healthConsultation,
            }
          : undefined,
      });

      // 포트원 결제 요청
      const response = await PortOne.requestPayment({
        storeId,
        paymentId: orderId,
        orderName,
        totalAmount: calculateFinalPrice(),
        currency: "CURRENCY_KRW",
        channelKey: NEXT_PUBLIC_PORTONE_CHANNEL_KEY,
        payMethod: "CARD",
        customer: {
          fullName: customerName,
          phoneNumber: customerPhone,
          email: customerEmail,
        },
        redirectUrl: `${window.location.origin}/checkout/success`,
      });

      if (response?.code != null) {
        // 결제 실패 시 생성된 주문 삭제

        await deleteOrderByOrderIdAction(orderId);
        alert(`결제 실패: ${response.message}`);
        router.push("/checkout/fail");
        return;
      }

      // 결제 성공
      clearOrder();
      router.push(`/checkout/success?paymentId=${orderId}`);
    } catch (error: any) {
      console.error("결제 요청 실패:", error);
      // 주문이 생성된 후 에러 발생 시 주문 삭제 시도
      if (orderId) {
        await deleteOrderByOrderIdAction(orderId);
      }
      alert(error?.message || "결제 요청에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 테스트 결제 핸들러
  const handleTestPayment = async () => {
    // store에서 최신 item 값을 직접 가져옴
    const currentItem = useOrderStore.getState().item;
    if (!currentItem) {
      alert("주문 정보가 없습니다.");
      return;
    }

    // 상품 상태 확인 (삭제 또는 품절)
    if (!product) {
      alert(
        "상품 정보를 찾을 수 없습니다. 삭제되었거나 일시적으로 판매 중지된 상품입니다."
      );
      router.push("/products");
      return;
    }

    if (product.is_out_of_stock) {
      alert("품절된 상품입니다. 다른 상품을 선택해주세요.");
      router.push("/products");
      return;
    }

    // 배송지 검증
    if (!selectedAddressId) {
      alert("배송지를 선택해주세요.");
      return;
    }

    const orderId = `TEST_ORDER_${Date.now()}`;

    setIsLoading(true);

    try {
      // 배송지 정보 준비
      let shippingInfo;
      if (user && selectedAddressId) {
        const selectedAddress = addresses.find(
          (addr) => addr.id === selectedAddressId
        );
        if (selectedAddress) {
          shippingInfo = {
            shipping_address_id: selectedAddress.id,
            shipping_name: selectedAddress.recipient,
            shipping_phone: selectedAddress.phone,
            shipping_postal_code: selectedAddress.postal_code,
            shipping_address: selectedAddress.address,
            shipping_address_detail: selectedAddress.address_detail,
          };
        }
      }

      // 선택한 쿠폰의 user_coupon_id 찾기
      const selectedUserCoupon = selectedCoupon
        ? availableCoupons.find((uc: any) => uc.id === selectedCoupon)
        : null;

      // 주문 정보 저장
      const order = await createOrderMutation.mutateAsync({
        user_email: customerEmail,
        user_name: customerName,
        user_phone: customerPhone,
        total_amount: calculateFinalPrice(),
        order_id: orderId,
        ...(shippingInfo && {
          shipping_address_id: shippingInfo.shipping_address_id,
          shipping_name: shippingInfo.shipping_name,
          shipping_phone: shippingInfo.shipping_phone,
          shipping_postal_code: shippingInfo.shipping_postal_code,
          shipping_address: shippingInfo.shipping_address,
          shipping_address_detail: shippingInfo.shipping_address_detail,
          zipcode: currentZipcode,
        }),
        // 포인트/쿠폰 정보
        used_points: usePoints,
        user_coupon_id: selectedUserCoupon?.id || undefined,
        coupon_discount: calculateDiscount(),
        // 배송비
        shipping_fee: shippingFee?.totalShippingFee || 0,
        items: [
          {
            product_id:
              currentItem.option?.product_id ||
              currentItem.product?.id ||
              undefined,
            product_name: product?.name || currentItem.option?.name || "상품",
            product_price:
              currentItem.option?.price ?? currentItem.product?.price ?? 0,
            quantity: currentItem.quantity,
            option_id: currentItem.option?.id,
            option_name: currentItem.option?.name,
            option_price: currentItem.option?.price,
            visit_type: currentItem.visit_type ?? undefined,
            selected_option_settings: currentItem.selected_settings,
          },
        ],
        health_consultation: healthConsultation
          ? {
              user_id: user?.id,
              ...healthConsultation,
            }
          : undefined,
      });

      // 테스트 결제 완료 - 주문 상태를 paid로 업데이트
      await updateOrderStatusAction(
        orderId,
        "paid",
        `TEST_PAYMENT_${Date.now()}`
      );

      // 포인트/쿠폰 사용 처리
      await processTestPaymentBenefitsAction(orderId);

      useOrderStore.getState().clearOrder();
      router.push(`/checkout/test-success?orderId=${orderId}`);
    } catch (error: any) {
      console.error("테스트 주문 생성 실패:", error);
      // 주문 생성 중 에러 발생 시 롤백은 createOrderAction 내부에서 처리됨
      // 추가로 주문이 생성되었다면 삭제 시도
      if (orderId) {
        await deleteOrderByOrderIdAction(orderId);
      }
      alert(error?.message || "테스트 주문 생성에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Hydration 완료 전이거나 item이 없으면 로딩 또는 빈 화면 표시
  if (!_hasHydrated || !item) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500">로딩 중...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* 히어로 배너 */}
      <div className="relative h-32 md:h-40 bg-gray-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-900/40" />
        <div className="relative h-full flex flex-col items-center justify-center text-white">
          <h1 className="text-xl md:text-2xl font-medium tracking-wide">
            주문/결제
          </h1>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 주문 상품 */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              주문 상품
            </h2>
            <div className="border border-gray-200 rounded p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">
                    {product?.name || item.option?.name || "상품"}
                  </p>
                  {item.option && (
                    <p className="text-sm text-gray-500 mt-1">
                      옵션: {item.option.name}
                    </p>
                  )}
                  {item.visit_type && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {getVisitTypeLabel(item.visit_type)}
                      </span>
                    </div>
                  )}

                  {/* 선택된 설정들 표시 */}
                  {item.selected_settings &&
                    item.selected_settings.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.selected_settings.map((setting, idx) => (
                          <span
                            key={idx}
                            className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100"
                          >
                            {setting.setting_name}: {setting.type_name}
                          </span>
                        ))}
                      </div>
                    )}

                  {/* 수량 조절 */}
                  <div className="flex items-center gap-3 mt-4">
                    <span className="text-sm text-gray-500">수량:</span>
                    <div className="flex items-center border border-gray-200 rounded">
                      <button
                        onClick={() => updateQuantity(item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="px-3 py-1 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 border-x border-gray-200 text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.quantity + 1)}
                        className="px-3 py-1 text-gray-500 hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-medium text-gray-900">
                    {getTotalPrice().toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            {/* 금액 요약 */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">상품 금액</span>
                <span className="text-gray-900">
                  {getTotalPrice().toLocaleString()}원
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">배송비</span>
                <span className="text-gray-900">
                  {isCalculatingShipping ? (
                    <span className="text-gray-400">계산 중...</span>
                  ) : shippingFee ? (
                    shippingFee.totalShippingFee === 0 ? (
                      <span className="text-grey-400">무료</span>
                    ) : (
                      `+${shippingFee.totalShippingFee.toLocaleString()}원`
                    )
                  ) : currentZipcode ? (
                    <span className="text-gray-400">계산 중...</span>
                  ) : (
                    <span className="text-gray-400">배송지 입력 시 계산</span>
                  )}
                </span>
              </div>

              {shippingFee?.message && (
                <p className="text-xs text-gray-400 pl-2">
                  {shippingFee.message}
                </p>
              )}

              {calculateDiscount() > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>쿠폰 할인</span>
                  <span>-{calculateDiscount().toLocaleString()}원</span>
                </div>
              )}
              {usePoints > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>포인트 사용</span>
                  <span>-{usePoints.toLocaleString()}P</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-100 text-base font-medium">
                <span className="text-gray-900">최종 결제 금액</span>
                <span className="text-gray-900">
                  {calculateFinalPrice().toLocaleString()}원
                </span>
              </div>
            </div>
          </section>

          {/* 포인트 & 쿠폰 */}
          {user && (
            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                할인 혜택
              </h2>
              <div className="border border-gray-200 rounded p-4 space-y-4">
                {/* 포인트 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-700">포인트 사용</span>
                    <span className="text-xs text-gray-400">
                      보유: {userPoints?.points.toLocaleString() || 0}P
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={usePoints}
                      onChange={(e) =>
                        handlePointsChange(parseInt(e.target.value) || 0)
                      }
                      className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
                      placeholder="0"
                      min="0"
                      max={userPoints?.points || 0}
                    />
                    <button
                      onClick={() =>
                        handlePointsChange(
                          Math.min(
                            userPoints?.points || 0,
                            getTotalPrice() - calculateDiscount()
                          )
                        )
                      }
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition"
                    >
                      전액사용
                    </button>
                  </div>
                  {userPoints && userPoints.points < 1000 && (
                    <p className="text-xs text-gray-400 mt-1">
                      * 1,000P 이상부터 사용 가능합니다.
                    </p>
                  )}
                </div>

                {/* 쿠폰 */}
                <div>
                  <span className="text-sm text-gray-700 mb-2 block">
                    쿠폰 선택
                  </span>
                  <button
                    onClick={() => setShowCouponModal(true)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded hover:bg-gray-50 transition text-left flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-700">
                      {selectedCoupon
                        ? availableCoupons.find(
                            (uc) => uc.id === selectedCoupon
                          )?.coupon?.name
                        : "쿠폰을 선택하세요"}
                    </span>
                    <span className="text-gray-400">▼</span>
                  </button>
                  {availableCoupons.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      사용 가능한 쿠폰이 없습니다.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* 쿠폰 선택 모달 */}
          {showCouponModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded max-w-lg w-full max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium">쿠폰 선택</h3>
                  <button
                    onClick={() => setShowCouponModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ×
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  <button
                    onClick={() => {
                      setSelectedCoupon("");
                      setShowCouponModal(false);
                    }}
                    className={`w-full p-3 border rounded text-left text-sm transition ${
                      !selectedCoupon
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    쿠폰 사용 안 함
                  </button>

                  {availableCoupons.map((userCoupon) => {
                    const coupon = userCoupon.coupon as Coupon;
                    const isAvailable = getTotalPrice() >= coupon.min_purchase;

                    return (
                      <button
                        key={userCoupon.id}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedCoupon(userCoupon.id);
                            setShowCouponModal(false);
                          }
                        }}
                        disabled={!isAvailable}
                        className={`w-full p-3 border rounded text-left transition ${
                          selectedCoupon === userCoupon.id
                            ? "border-gray-900 bg-gray-50"
                            : isAvailable
                            ? "border-gray-200 hover:bg-gray-50"
                            : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm">
                            {coupon.name}
                          </span>
                          <span className="text-sm font-medium text-red-500">
                            {coupon.discount_type === "percentage"
                              ? `${coupon.discount_value}%`
                              : `${coupon.discount_value.toLocaleString()}원`}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {coupon.min_purchase.toLocaleString()}원 이상 구매 시
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 배송지 정보 */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">배송지 정보</h2>
              <div className="flex items-center gap-3">
                {user && (
                  <a
                    href="/profile?tab=addresses"
                    className="text-xs text-gray-500 hover:text-gray-900 border-b border-gray-300 pb-0.5"
                  >
                    배송지 관리
                  </a>
                )}
              </div>
            </div>

            <div className="border border-gray-200 rounded p-4">
              {/* 로그인 사용자: 저장된 배송지 목록 표시 */}
              {user && addresses.length > 0 && (
                <div className="space-y-2 mb-4">
                  {addresses.map((address) => (
                    <button
                      key={address.id}
                      onClick={() => setSelectedAddressId(address.id)}
                      className={`w-full text-left p-3 border rounded transition ${
                        selectedAddressId === address.id
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {address.name}
                        </span>
                        {address.is_default && (
                          <span className="px-1.5 py-0.5 text-xs bg-gray-900 text-white rounded">
                            기본
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {address.recipient} · {address.phone}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {address.postal_code && `[${address.postal_code}] `}
                        {address.address}
                        {address.address_detail &&
                          `, ${address.address_detail}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* 새 배송지 추가 버튼 */}
              {user && (
                <button
                  onClick={() => setShowAddAddressModal(true)}
                  className="w-full px-3 py-2.5 border border-dashed border-gray-300 rounded text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition text-sm flex items-center justify-center gap-2"
                >
                  <span className="text-lg">+</span>새 배송지 추가
                </button>
              )}

              {/* 저장된 배송지 없을 때 안내 */}
              {user && addresses.length === 0 && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  등록된 배송지가 없습니다. 새 배송지를 추가해주세요.
                </p>
              )}

              {/* 비로그인 사용자 안내 */}
              {!user && (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm mb-2">
                    배송지를 등록하려면 로그인이 필요합니다.
                  </p>
                  <a
                    href="/auth/login"
                    className="text-sm text-gray-900 hover:underline"
                  >
                    로그인하기
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* 새 배송지 추가 모달 */}
          {showAddAddressModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium">새 배송지 추가</h3>
                  <button
                    onClick={() => {
                      setShowAddAddressModal(false);
                      setNewAddress({
                        name: "",
                        recipient: "",
                        phone: "",
                        postal_code: "",
                        address: "",
                        address_detail: "",
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ×
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      배송지명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newAddress.name}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, name: e.target.value })
                      }
                      placeholder="예: 집, 회사"
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      받는 분 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newAddress.recipient}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          recipient: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      연락처 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={newAddress.phone}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, phone: e.target.value })
                      }
                      placeholder="010-1234-5678"
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      우편번호 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newAddress.postal_code}
                        readOnly
                        placeholder="우편번호"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm bg-gray-50"
                      />
                      <AddressSearch
                        onComplete={(data) =>
                          setNewAddress({
                            ...newAddress,
                            postal_code: data.postal_code,
                            address: data.address,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      주소 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newAddress.address}
                      readOnly
                      placeholder="주소 검색 버튼을 클릭하세요"
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      상세 주소
                    </label>
                    <input
                      type="text"
                      value={newAddress.address_detail}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          address_detail: e.target.value,
                        })
                      }
                      placeholder="상세 주소 입력"
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={() => {
                      setShowAddAddressModal(false);
                      setNewAddress({
                        name: "",
                        recipient: "",
                        phone: "",
                        postal_code: "",
                        address: "",
                        address_detail: "",
                      });
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition text-sm"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveNewAddress}
                    disabled={createAddressMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded hover:bg-gray-800 transition text-sm disabled:bg-gray-300"
                  >
                    {createAddressMutation.isPending ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 문진 정보 (필수) */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                문진 정보
              </h2>
              {healthConsultation && (
                <button
                  onClick={() => setShowHealthForm(!showHealthForm)}
                  className="text-xs text-gray-500 hover:text-gray-900 border-b border-gray-300 pb-0.5"
                >
                  {showHealthForm ? "숨기기" : "수정하기"}
                </button>
              )}
            </div>

            <div className="border border-gray-200 rounded p-4">
              {!healthConsultation && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                  <p className="text-sm text-yellow-800 font-medium">
                    문진 정보를 작성해주세요
                  </p>
                  <p className="text-xs text-yellow-700 mt-0.5">
                    정확한 상담을 위해 문진 정보 입력이 필수입니다.
                  </p>
                </div>
              )}

              {!showHealthForm && healthConsultation && (
                <>
                  <p className="text-sm text-gray-900 font-medium flex items-center gap-1">
                    <span>✓</span> 문진 정보가 작성되었습니다
                  </p>
                  {healthConsultation.name && (
                    <p className="text-xs text-gray-800 mt-1">
                      이름: {healthConsultation.name}
                    </p>
                  )}
                  {healthConsultation.current_height != null &&
                    healthConsultation.current_weight != null && (
                      <p className="text-xs text-gray-800">
                        신체정보: {healthConsultation.current_height}cm /{" "}
                        {healthConsultation.current_weight}kg
                      </p>
                    )}
                </>
              )}

              {showHealthForm && (
                <div className="mt-4">
                  <HealthConsultationForm
                    onSubmit={(data) => {
                      setHealthConsultation(data);
                      setShowHealthForm(false);
                    }}
                    initialData={healthConsultation || undefined}
                  />
                </div>
              )}
            </div>
          </section>

          {/* 결제 버튼 */}
          <div className="pt-4 space-y-3">
            <button
              onClick={handlePayment}
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-4 rounded font-medium hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "결제 진행 중..."
                : `${calculateFinalPrice().toLocaleString()}원 결제하기`}
            </button>

            {/* 테스트 결제 버튼 (개발환경에서만 표시) */}
            {NODE_ENV === "development" && (
              <button
                onClick={handleTestPayment}
                disabled={isLoading}
                className="w-full bg-orange-500 text-white py-4 rounded font-medium hover:bg-orange-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? "테스트 결제 진행 중..."
                  : `테스트 결제 (실제 결제 없이 완료)`}
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
