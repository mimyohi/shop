"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/store/orderStore";
import * as PortOne from "@portone/browser-sdk/v2";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import type {
  Coupon,
  HealthConsultationDetails,
  Product,
  UserPoints,
  UserCoupon,
  ShippingAddress,
  UserProfile,
  UserHealthConsultation,
  PaymentMethod,
} from "@/models";
import { productsQueries } from "@/queries/products.queries";
import HealthConsultationForm from "@/components/HealthConsultationForm";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AddressSearch from "@/components/AddressSearch";
import PhoneInput from "@/components/PhoneInput";
import { useCreateOrder } from "@/queries/orders.queries";
import { deleteOrderByOrderIdAction } from "@/lib/actions/orders.actions";
import { useCreateAddress } from "@/queries/addresses.queries";
import { useShippingFee } from "@/hooks/useShippingFee";
import {
  NEXT_PUBLIC_PORTONE_STORE_ID,
  NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD,
  NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TRANSFER,
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

// 방문 타입에 관계없이 모든 주문은 접수 필요 상태로 시작
function getConsultationStatusByVisitType(
  visitType: string | null | undefined
): "chatting_required" | "consultation_required" | "consultation_completed" {
  // 모든 경우에 접수 필요 상태로 통일
  return "chatting_required";
}

const storeId = NEXT_PUBLIC_PORTONE_STORE_ID;

interface CheckoutContentProps {
  user: User;
  initialUserPoints: UserPoints | null;
  initialAvailableCoupons: UserCoupon[];
  initialAddresses: ShippingAddress[];
  initialProfile: UserProfile | null;
  initialHealthConsultation: UserHealthConsultation | null;
}

export default function CheckoutContent({
  user,
  initialUserPoints,
  initialAvailableCoupons,
  initialAddresses,
  initialProfile,
  initialHealthConsultation,
}: CheckoutContentProps) {
  const router = useRouter();
  const {
    item,
    getTotalPrice,
    updateQuantity,
    updateAddonQuantity,
    clearOrder,
    _hasHydrated,
  } = useOrderStore();
  const createOrderMutation = useCreateOrder();
  const createAddressMutation = useCreateAddress();

  // 서버에서 전달받은 데이터 사용
  const userPoints = initialUserPoints;
  const availableCoupons = initialAvailableCoupons;
  const addresses = initialAddresses;
  const profile = initialProfile;
  const savedHealthConsultation = initialHealthConsultation;

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

  // 건강 상담 정보
  const [healthConsultation, setHealthConsultation] =
    useState<Partial<HealthConsultationDetails> | null>(null);
  const [showHealthForm, setShowHealthForm] = useState(true);

  // 결제 방법 선택
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");

  // 상품 정보 조회 (옵션의 product_id가 있는 경우)
  const productId = item?.option?.product_id || item?.product?.id;
  const { data: latestProducts } = useQuery({
    ...productsQueries.byIds(productId ? [productId] : []),
    enabled: !!productId,
  });

  // 상품 정보 (옵션 없는 경우 item.product 사용)
  const product = useMemo(() => {
    if (item?.product) return item.product;
    if (!productId || !latestProducts) return null;
    return latestProducts.find((p) => p.id === productId) || null;
  }, [productId, latestProducts, item?.product]);

  // 옵션의 할인된 가격 계산
  const discountedOptionPrice = useMemo(() => {
    const optionPrice = item?.option?.price ?? 0;
    const discountRate = item?.option?.discount_rate ?? 0;
    if (discountRate > 0) {
      return Math.floor(optionPrice * (1 - discountRate / 100));
    }
    return optionPrice;
  }, [item?.option?.price, item?.option?.discount_rate]);

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

  const productTotal = getTotalPrice();
  const shippingTotal = shippingFee?.totalShippingFee || 0;
  const discountableAmount = productTotal + shippingTotal;

  // 리다이렉트 여부를 추적하는 ref
  const hasRedirected = useRef(false);

  // 주문 정보가 없으면 리다이렉트
  useEffect(() => {
    if (hasRedirected.current || !_hasHydrated) return;

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

  // 쿠폰 변경 시 포인트 자동 재조정
  useEffect(() => {
    if (usePoints > 0) {
      const couponDiscount = calculateDiscount();
      const maxUsablePoints = Math.min(
        userPoints?.points || 0,
        Math.max(0, discountableAmount - couponDiscount)
      );

      // 현재 사용 중인 포인트가 최대 사용 가능 포인트를 초과하면 자동 조정
      if (usePoints > maxUsablePoints) {
        setUsePoints(maxUsablePoints);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCoupon, discountableAmount]); // selectedCoupon/배송비 변경 시 재조정

  const calculateDiscount = () => {
    let discount = 0;

    if (selectedCoupon) {
      const userCoupon = availableCoupons.find(
        (uc) => uc.id === selectedCoupon
      );
      if (userCoupon) {
        const coupon = userCoupon.coupon as Coupon;
        if (productTotal >= coupon.min_purchase) {
          if (coupon.discount_type === "percentage") {
            discount = Math.floor(
              (discountableAmount * coupon.discount_value) / 100
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
    const couponDiscount = calculateDiscount();
    const pointDiscount = usePoints;

    return Math.max(
      0,
      discountableAmount - couponDiscount - pointDiscount
    );
  };

  const handlePointsChange = (value: number) => {
    const maxUsablePoints = Math.min(
      userPoints?.points || 0,
      Math.max(0, discountableAmount - calculateDiscount())
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
        is_default: addresses.length === 0,
      });

      if (savedAddress?.id) {
        setSelectedAddressId(savedAddress.id);
      }

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

    if (!selectedAddressId) {
      alert("배송지를 선택해주세요.");
      return;
    }

    // 배송비 계산 완료 여부 확인
    if (isCalculatingShipping) {
      alert("배송비를 계산 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (!shippingFee) {
      alert("배송비 정보를 불러오지 못했습니다. 배송지를 다시 선택해주세요.");
      return;
    }

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
    const finalAmount = calculateFinalPrice();

    setIsLoading(true);

    try {
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

      const selectedUserCouponForPayment = selectedCoupon
        ? availableCoupons.find((uc: any) => uc.id === selectedCoupon)
        : null;

      await createOrderMutation.mutateAsync({
        user_email: customerEmail,
        user_name: customerName,
        user_phone: customerPhone,
        total_amount: finalAmount,
        order_id: orderId,
        consultation_status: getConsultationStatusByVisitType(item.visit_type),
        ...(shippingInfo && {
          shipping_address_id: shippingInfo.shipping_address_id,
          shipping_name: shippingInfo.shipping_name,
          shipping_phone: shippingInfo.shipping_phone,
          shipping_postal_code: shippingInfo.shipping_postal_code,
          shipping_address: shippingInfo.shipping_address,
          shipping_address_detail: shippingInfo.shipping_address_detail,
          zipcode: currentZipcode,
        }),
        used_points: usePoints,
        user_coupon_id: selectedUserCouponForPayment?.id || undefined,
        coupon_discount: calculateDiscount(),
        shipping_fee: shippingFee?.totalShippingFee || 0,
        // 결제 방법
        payment_method: paymentMethod,
        items: [
          {
            product_id:
              item.option?.product_id || item.product?.id || undefined,
            product_name: product?.name || item.option?.name || "상품",
            // 옵션 할인 적용 가격
            product_price: discountedOptionPrice,
            quantity: item.quantity,
            option_id: item.option?.id,
            option_name: item.option?.name,
            option_price: item.option?.price,
            visit_type: item.visit_type ?? undefined,
            selected_option_settings: item.selected_settings,
            selected_addons: item.selected_addons,
          },
        ],
        health_consultation: healthConsultation
          ? {
              user_id: user?.id,
              ...healthConsultation,
            }
          : undefined,
      });

      // 결제 방법에 따라 payMethod 설정
      const getPayMethod = () => {
        switch (paymentMethod) {
          case "VIRTUAL_ACCOUNT":
            return "VIRTUAL_ACCOUNT";
          case "TRANSFER":
            return "TRANSFER";
          default:
            return "CARD";
        }
      };

      // 결제 방법에 따라 채널 키 선택
      const getChannelKey = () => {
        switch (paymentMethod) {
          case "TRANSFER":
            return NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TRANSFER;
          case "CARD":
          case "VIRTUAL_ACCOUNT":
          default:
            return NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD;
        }
      };

      if (finalAmount === 0) {
        router.push(`/checkout/success?paymentId=${orderId}`);
        return;
      }

      const paymentRequest: Parameters<typeof PortOne.requestPayment>[0] = {
        storeId,
        paymentId: orderId,
        orderName,
        totalAmount: finalAmount,
        currency: "CURRENCY_KRW",
        channelKey: getChannelKey(),
        payMethod: getPayMethod(),
        customer: {
          fullName: customerName,
          phoneNumber: customerPhone,
          email: customerEmail,
        },
        // 모바일에서는 리다이렉션 방식이 사용되므로 redirectUrl 필수
        redirectUrl: `${window.location.origin}/checkout/success?paymentId=${orderId}&paymentMethod=${paymentMethod}`,
      };

      // 가상계좌인 경우 가상계좌 설정 추가
      if (paymentMethod === "VIRTUAL_ACCOUNT") {
        // 입금 기한: 7일 후
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        (paymentRequest as any).virtualAccount = {
          accountExpiry: {
            validHours: 168, // 7일 = 168시간
          },
        };
      }

      const response = await PortOne.requestPayment(paymentRequest);

      if (response?.code != null) {
        await deleteOrderByOrderIdAction(orderId);

        // 사용자 친화적인 에러 메시지로 변환
        let userFriendlyMessage = "결제를 완료하지 못했습니다.";
        if (
          response.code === "PAY_PROCESS_CANCELED" ||
          response.message?.includes("취소")
        ) {
          userFriendlyMessage = "결제가 취소되었습니다.";
        } else if (response.code === "PAY_PROCESS_ABORTED") {
          userFriendlyMessage = "결제가 중단되었습니다.";
        } else if (
          response.message?.includes("카드") ||
          response.message?.includes("CARD")
        ) {
          userFriendlyMessage =
            "카드 결제에 실패했습니다. 다른 결제 수단을 이용해주세요.";
        } else if (
          response.message?.includes("잔액") ||
          response.message?.includes("한도")
        ) {
          userFriendlyMessage =
            "잔액 부족 또는 한도 초과입니다. 다른 결제 수단을 이용해주세요.";
        }

        alert(userFriendlyMessage);
        router.push(
          `/checkout/fail?message=${encodeURIComponent(userFriendlyMessage)}`
        );
        return;
      }

      clearOrder();

      // 결제 방법에 따라 추가 파라미터 전달
      if (paymentMethod === "VIRTUAL_ACCOUNT") {
        router.push(
          `/checkout/success?paymentId=${orderId}&paymentMethod=VIRTUAL_ACCOUNT`
        );
      } else if (paymentMethod === "TRANSFER") {
        router.push(
          `/checkout/success?paymentId=${orderId}&paymentMethod=TRANSFER`
        );
      } else {
        router.push(`/checkout/success?paymentId=${orderId}`);
      }
    } catch (error: any) {
      console.error("결제 요청 실패:", error);
      if (orderId) {
        await deleteOrderByOrderIdAction(orderId);
      }
      alert(error?.message || "결제 요청에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="relative border border-gray-200 rounded p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">
                    {product?.name || item.option?.name || "상품"}
                  </p>
                  {item.option && (
                    <div className="mt-2 text-sm">
                      <p className="text-gray-600">옵션: {item.option.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {(item.option.discount_rate ?? 0) > 0 ? (
                          <>
                            <span className="text-gray-900 font-medium">
                              {discountedOptionPrice.toLocaleString()}원
                            </span>
                            <span className="text-gray-400 line-through text-xs">
                              {item.option.price.toLocaleString()}원
                            </span>
                            <span className="text-red-500 text-xs">
                              {item.option.discount_rate}% 할인
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-900 font-medium">
                            {item.option.price.toLocaleString()}원
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {item.visit_type && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {getVisitTypeLabel(item.visit_type)}
                      </span>
                    </div>
                  )}

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

                  {/* 수량 조절 - 옵션/설정 바로 아래 */}
                  <div className="flex items-center gap-3 mt-3">
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

                  {/* 추가 상품 */}
                  {item.selected_addons && item.selected_addons.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-3">추가 상품</p>
                      <div className="space-y-3">
                        {item.selected_addons.map((addon) => (
                          <div
                            key={addon.addon_id}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm text-gray-700">
                              {addon.name}
                            </span>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center border border-gray-200 rounded">
                                <button
                                  onClick={() =>
                                    updateAddonQuantity(
                                      addon.addon_id,
                                      addon.quantity - 1
                                    )
                                  }
                                  disabled={addon.quantity <= 1}
                                  className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center text-sm border-x border-gray-200">
                                  {addon.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateAddonQuantity(
                                      addon.addon_id,
                                      addon.quantity + 1
                                    )
                                  }
                                  className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-sm text-gray-600 min-w-[80px] text-right">
                                +
                                {(
                                  addon.price * addon.quantity
                                ).toLocaleString()}
                                원
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="absolute top-4 right-4">
                  <span className="font-medium text-gray-900">
                    {getTotalPrice().toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            {/* 금액 요약 */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
              {/* 옵션 금액 */}
              {item.option && (
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    옵션 금액 ({discountedOptionPrice.toLocaleString()}원 ×{" "}
                    {item.quantity}개)
                  </span>
                  <span className="text-gray-900">
                    {(discountedOptionPrice * item.quantity).toLocaleString()}원
                  </span>
                </div>
              )}

              {/* 추가 상품 금액 */}
              {item.selected_addons && item.selected_addons.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">추가 상품</span>
                  <span className="text-gray-900">
                    +
                    {item.selected_addons
                      .reduce(
                        (sum, addon) => sum + addon.price * addon.quantity,
                        0
                      )
                      .toLocaleString()}
                    원
                  </span>
                </div>
              )}

              {/* 상품 금액 소계 */}
              <div className="flex justify-between pt-1">
                <span className="text-gray-700 font-medium">
                  상품 금액 소계
                </span>
                <span className="text-gray-900 font-medium">
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
                            Math.max(0, discountableAmount - calculateDiscount())
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

              {user && (
                <button
                  onClick={() => setShowAddAddressModal(true)}
                  className="w-full px-3 py-2.5 border border-dashed border-gray-300 rounded text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition text-sm flex items-center justify-center gap-2"
                >
                  <span className="text-lg">+</span>새 배송지 추가
                </button>
              )}

              {user && addresses.length === 0 && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  등록된 배송지가 없습니다. 새 배송지를 추가해주세요.
                </p>
              )}

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
                    <PhoneInput
                      value={newAddress.phone}
                      onChange={(value) =>
                        setNewAddress({ ...newAddress, phone: value })
                      }
                      className="!py-2 text-sm"
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

          {/* 결제 방법 */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              결제 방법
            </h2>
            <div className="border border-gray-200 rounded p-4">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CARD")}
                  className={`flex items-center justify-center gap-2 p-4 border rounded transition ${
                    paymentMethod === "CARD"
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-sm font-medium">카드/간편 결제</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("TRANSFER")}
                  className={`flex items-center justify-center gap-2 p-4 border rounded transition ${
                    paymentMethod === "TRANSFER"
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-sm font-medium">계좌이체</span>
                </button>
                {/* <button
                  type="button"
                  onClick={() => setPaymentMethod("VIRTUAL_ACCOUNT")}
                  className={`flex items-center justify-center gap-2 p-4 border rounded transition ${
                    paymentMethod === "VIRTUAL_ACCOUNT"
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-sm font-medium">가상계좌</span>
                </button> */}
              </div>

              {paymentMethod === "TRANSFER" && (
                <div className="mt-4 p-3 bg-black-50 border border-black-200 rounded">
                  <p className="text-sm text-black-800">
                    계좌이체 결제 시 등록된 계좌에서 즉시 출금됩니다.
                  </p>
                </div>
              )}

              {paymentMethod === "VIRTUAL_ACCOUNT" && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-sm text-gray-800">
                    가상계좌 결제 시 발급된 계좌로 입금해 주세요.
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    * 입금 기한 내 미입금 시 주문이 자동 취소됩니다.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* 문진 정보 */}
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
              disabled={
                isLoading ||
                isCalculatingShipping ||
                (!shippingFee && !!selectedAddressId)
              }
              className="w-full bg-gray-900 text-white py-4 rounded font-medium hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "결제 진행 중..."
                : isCalculatingShipping
                ? "배송비 계산 중..."
                : paymentMethod === "VIRTUAL_ACCOUNT"
                ? `${calculateFinalPrice().toLocaleString()}원 가상계좌 발급받기`
                : paymentMethod === "TRANSFER"
                ? `${calculateFinalPrice().toLocaleString()}원 계좌이체 결제하기`
                : `${calculateFinalPrice().toLocaleString()}원 결제하기`}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
