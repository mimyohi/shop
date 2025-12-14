"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AddressSearch from "@/components/AddressSearch";
import { supabaseAuth } from "@/lib/supabaseAuth";
import {
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/queries/addresses.queries";
import { useUpdateUserProfile } from "@/queries/user-profiles.queries";
import {
  useUpsertUserHealthConsultation,
} from "@/queries/user-health-consultations.queries";
import { useRegisterCouponByCode } from "@/queries/coupons.queries";
import HealthConsultationForm from "@/components/HealthConsultationForm";
import type {
  Coupon,
  HealthConsultationDetails,
  PointHistory,
  ShippingAddress,
  UserProfile,
  UserPoints,
} from "@/models";
import type { OrderWithItems } from "@/queries/orders.queries";

type TabType =
  | "info"
  | "orders"
  | "points"
  | "coupons"
  | "addresses"
  | "health";

interface ProfileContentProps {
  user: {
    id: string;
    email: string;
  };
  initialTab: TabType;
  initialData: {
    profile: UserProfile | null;
    userPoints: UserPoints | null;
    orders: OrderWithItems[];
    addresses: ShippingAddress[];
    healthConsultation: HealthConsultationDetails | null;
    coupons: any[];
    pointsHistory: PointHistory[];
  };
}

const initialAddressForm = {
  name: "",
  recipient: "",
  phone: "",
  postal_code: "",
  address: "",
  address_detail: "",
  is_default: false,
};

export default function ProfileContent({
  user,
  initialTab,
  initialData,
}: ProfileContentProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [displayName, setDisplayName] = useState(initialData.profile?.display_name || "");
  const [addressForm, setAddressForm] = useState(initialAddressForm);

  // 쿠폰 관련 상태
  const [couponCode, setCouponCode] = useState("");

  // 포인트 히스토리 필터
  const [pointsFilter, setPointsFilter] = useState<"all" | "earn" | "use">("all");

  // 로컬 상태로 데이터 관리 (mutation 후 업데이트용)
  const [profile] = useState(initialData.profile);
  const [userPoints] = useState(initialData.userPoints);
  const [orders] = useState(initialData.orders);
  const [addresses, setAddresses] = useState(initialData.addresses);
  const [savedHealthConsultation, setSavedHealthConsultation] = useState<(HealthConsultationDetails & { updated_at?: string }) | null>(initialData.healthConsultation);
  const [myCoupons, setMyCoupons] = useState(initialData.coupons);
  const [pointsHistory] = useState(initialData.pointsHistory);

  const createAddressMutation = useCreateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const setDefaultAddressMutation = useSetDefaultAddress();
  const updateProfileMutation = useUpdateUserProfile();
  const upsertHealthMutation = useUpsertUserHealthConsultation();
  const registerCouponMutation = useRegisterCouponByCode();

  // 포인트 히스토리 필터링
  const filteredHistory = useMemo(() => {
    if (pointsFilter === "all") {
      return pointsHistory;
    }
    return pointsHistory.filter(
      (item: PointHistory) => item.type === pointsFilter
    );
  }, [pointsHistory, pointsFilter]);

  const handleAddAddress = async () => {
    if (!user) return;

    if (
      !addressForm.name ||
      !addressForm.recipient ||
      !addressForm.phone ||
      !addressForm.address
    ) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    try {
      const newAddress = await createAddressMutation.mutateAsync({
        user_id: user.id,
        ...addressForm,
      });
      alert("배송지가 추가되었습니다.");
      setShowAddressForm(false);
      setAddressForm(initialAddressForm);
      // 로컬 상태 업데이트
      if (newAddress) {
        setAddresses((prev) => [...prev, newAddress]);
      }
      router.refresh();
    } catch (error) {
      console.error("배송지 추가 오류:", error);
      alert("배송지 추가 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user) return;
    if (!confirm("이 배송지를 삭제하시겠습니까?")) return;

    try {
      await deleteAddressMutation.mutateAsync({
        id: addressId,
        userId: user.id,
      });
      alert("배송지가 삭제되었습니다.");
      setAddresses((prev) => prev.filter((a) => a.id !== addressId));
      router.refresh();
    } catch (error) {
      console.error("배송지 삭제 오류:", error);
      alert("배송지 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!user) return;

    try {
      await setDefaultAddressMutation.mutateAsync({
        id: addressId,
        userId: user.id,
      });
      alert("기본 배송지가 변경되었습니다.");
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.id === addressId,
        }))
      );
      router.refresh();
    } catch (error) {
      console.error("기본 배송지 설정 오류:", error);
      alert("기본 배송지 설정 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      await updateProfileMutation.mutateAsync({
        userId: user.id,
        data: {
          display_name: displayName,
        },
      });
      alert("프로필이 업데이트되었습니다.");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("프로필 업데이트 오류:", error);
      alert("프로필 업데이트 중 오류가 발생했습니다.");
    }
  };

  const handleLogout = async () => {
    await supabaseAuth.auth.signOut();
    router.push("/");
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // 쿠폰 등록 핸들러
  const registerCouponByCode = async () => {
    if (!couponCode.trim()) {
      alert("쿠폰 코드를 입력해주세요.");
      return;
    }

    try {
      const newCoupon = await registerCouponMutation.mutateAsync(couponCode.trim());
      alert("쿠폰이 등록되었습니다!");
      setCouponCode("");
      if (newCoupon) {
        setMyCoupons((prev) => [...prev, newCoupon]);
      }
      router.refresh();
    } catch (error: any) {
      alert(error.message || "쿠폰 등록에 실패했습니다.");
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === "percentage") {
      return `${coupon.discount_value}%`;
    }
    return `${coupon.discount_value.toLocaleString()}원`;
  };

  const formatCouponDate = (dateString?: string) => {
    if (!dateString) return "상시";
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  const formatPointDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSaveHealthConsultation = async (
    data: Partial<HealthConsultationDetails>
  ) => {
    if (!user) {
      alert("유저 정보가 없습니다");
      return;
    }

    // 필수 필드 검증
    const requiredFields: (keyof HealthConsultationDetails)[] = [
      "name",
      "resident_number",
      "phone",
      "current_height",
      "current_weight",
      "min_weight_since_20s",
      "max_weight_since_20s",
      "target_weight",
      "target_weight_loss_period",
      "previous_western_medicine",
      "previous_herbal_medicine",
      "previous_other_medicine",
      "occupation",
      "work_hours",
      "has_shift_work",
      "wake_up_time",
      "bedtime",
      "has_daytime_sleepiness",
      "meal_pattern",
      "alcohol_frequency",
      "water_intake",
      "diet_approach",
      "preferred_stage",
      "medical_history",
    ];

    const missingFields = requiredFields.filter(
      (field) => data[field] === undefined || data[field] === ""
    );
    if (missingFields.length > 0) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }

    try {
      await upsertHealthMutation.mutateAsync({
        user_id: user.id,
        ...(data as HealthConsultationDetails),
      });
      alert("문진 정보가 저장되었습니다.");
      setSavedHealthConsultation(data as HealthConsultationDetails);
      router.refresh();
    } catch (error) {
      console.error("문진 정보 저장 오류:", error);
      alert("문진 정보를 저장하지 못했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* 히어로 배너 */}
      <div className="relative h-40 md:h-52 bg-gray-800 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1920&q=80)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/70 to-gray-900/30" />
        <div className="relative h-full flex flex-col items-center justify-center text-white">
          <h1 className="text-2xl md:text-3xl font-medium tracking-wide mb-2">
            My Page
          </h1>
          <p className="text-sm text-gray-300 text-center px-4">
            나만의 건강한 변화를 관리하세요
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* 좌측 사이드바 */}
          <aside className="md:w-56 shrink-0">
            <nav className="space-y-1">
              {[
                { key: "info", label: "내 정보" },
                { key: "orders", label: "주문 내역" },
                { key: "points", label: "포인트" },
                { key: "coupons", label: "쿠폰" },
                { key: "addresses", label: "배송지 관리" },
                { key: "health", label: "문진 관리" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key as TabType)}
                  className={`w-full text-left px-4 py-3 text-sm font-medium transition ${
                    activeTab === tab.key
                      ? "bg-gray-100 text-gray-900 border-l-2 border-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-gray-500 hover:text-red-600 transition"
              >
                로그아웃
              </button>
            </div>
          </aside>

          {/* 우측 콘텐츠 */}
          <div className="flex-1 min-w-0">
            {activeTab === "info" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-medium text-gray-900">내 정보</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-sm text-gray-600 hover:text-gray-900 border-b border-gray-400 pb-0.5 transition"
                  >
                    {isEditing ? "취소" : "정보 수정"}
                  </button>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">이메일</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">이름</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {profile?.display_name || "미설정"}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">전화번호</p>
                      <p className="text-gray-900">
                        {profile?.phone || "미등록"}
                      </p>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={handleUpdateProfile}
                        disabled={updateProfileMutation.isPending}
                        className="px-6 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {updateProfileMutation.isPending
                          ? "저장 중..."
                          : "저장"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-medium text-gray-900">
                    주문 내역
                  </h2>
                  <p className="text-sm text-gray-500">총 {orders.length}건</p>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  {orders.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-gray-500 mb-2">
                        주문 내역이 없습니다.
                      </p>
                      <a
                        href="/products"
                        className="text-sm text-gray-600 hover:text-gray-900 border-b border-gray-400 pb-0.5"
                      >
                        상품 보러가기
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order: OrderWithItems) => {
                        const getConsultationStatusInfo = (
                          status: string | null
                        ) => {
                          if (!status) return null;
                          switch (status) {
                            case "chatting_required":
                              return { label: "상담 필요" };
                            case "consultation_required":
                              return { label: "상담 필요" };
                            case "on_hold":
                              return { label: "상담 필요" };
                            case "consultation_completed":
                              return { label: "상담 완료" };
                            case "shipping_on_hold":
                              return { label: "배송 보류" };
                            case "shipped":
                              return { label: "배송됨" };
                            case "cancelled":
                              return { label: "취소됨" };
                            default:
                              return { label: status };
                          }
                        };

                        const consultationStatusInfo =
                          getConsultationStatusInfo(order.consultation_status);

                        return (
                          <a
                            key={order.id}
                            href={`/orders/${order.order_id}`}
                            className="block border border-gray-200 rounded p-4 hover:border-gray-400 transition"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-xs text-gray-400 mb-1">
                                  {new Date(
                                    order.created_at
                                  ).toLocaleDateString("ko-KR")}
                                </p>
                                <p className="text-sm font-medium text-gray-900">
                                  {order.order_id}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {consultationStatusInfo && (
                                  <span className={`text-sm`}>
                                    {consultationStatusInfo.label}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="border-t border-gray-100 pt-3">
                              {order.order_items.slice(0, 2).map((item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between text-sm text-gray-600 mb-1"
                                >
                                  <span className="truncate mr-4">
                                    {item.product_name}
                                    {item.option_name &&
                                      ` - ${item.option_name}`}{" "}
                                    × {item.quantity}
                                  </span>
                                  <span className="shrink-0">
                                    {(
                                      item.product_price * item.quantity
                                    ).toLocaleString()}
                                    원
                                  </span>
                                </div>
                              ))}
                              {order.order_items.length > 2 && (
                                <p className="text-xs text-gray-400">
                                  외 {order.order_items.length - 2}개 상품
                                </p>
                              )}
                              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                                <span className="text-sm font-medium text-gray-900">
                                  총 {order.total_amount.toLocaleString()}원
                                </span>
                                <span className="text-xs text-gray-500">
                                  상세 보기 →
                                </span>
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "points" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-medium text-gray-900">포인트</h2>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  {/* 포인트 요약 */}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-medium text-gray-900">
                      {userPoints?.points?.toLocaleString() ?? 0}
                    </span>
                    <span className="text-lg text-gray-600">P</span>
                  </div>
                  <div className="flex gap-8 text-sm mb-6">
                    <div>
                      <p className="text-gray-500 mb-1">누적 적립</p>
                      <p className="text-gray-900 font-medium">
                        {userPoints?.total_earned?.toLocaleString() ?? 0}P
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">사용 내역</p>
                      <p className="text-gray-900 font-medium">
                        {userPoints?.total_used?.toLocaleString() ?? 0}P
                      </p>
                    </div>
                  </div>

                  {/* 필터 */}
                  <div className="flex gap-2 mb-4">
                    {(["all", "earn", "use"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setPointsFilter(f)}
                        className={`px-3 py-1.5 text-sm rounded transition ${
                          pointsFilter === f
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {f === "all" ? "전체" : f === "earn" ? "적립" : "사용"}
                      </button>
                    ))}
                  </div>

                  {/* 히스토리 목록 */}
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">포인트 내역이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredHistory.map((history: PointHistory) => (
                        <div
                          key={history.id}
                          className="flex justify-between items-center py-3 border-b border-gray-100"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded ${
                                  history.type === "earn"
                                    ? "bg-blue-50 text-blue-600"
                                    : "bg-red-50 text-red-600"
                                }`}
                              >
                                {history.type === "earn" ? "적립" : "사용"}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatPointDate(history.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900">
                              {history.reason}
                            </p>
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              history.type === "earn"
                                ? "text-blue-600"
                                : "text-red-600"
                            }`}
                          >
                            {history.type === "earn" ? "+" : "-"}
                            {Math.abs(history.points).toLocaleString()}P
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="mt-6 text-xs text-gray-400">
                    포인트는 주문 완료 시 적립되며, 결제 과정에서 사용
                    가능합니다.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "coupons" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-medium text-gray-900">
                    쿠폰 ({myCoupons.length})
                  </h2>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  {/* 쿠폰 코드 입력 */}
                  <div className="mb-6 p-4 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600 mb-3">쿠폰 코드 등록</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            registerCouponByCode();
                          }
                        }}
                        placeholder="쿠폰 코드 입력"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
                        disabled={registerCouponMutation.isPending}
                      />
                      <button
                        onClick={registerCouponByCode}
                        disabled={
                          registerCouponMutation.isPending || !couponCode.trim()
                        }
                        className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {registerCouponMutation.isPending
                          ? "등록 중..."
                          : "등록"}
                      </button>
                    </div>
                  </div>

                  {/* 쿠폰 목록 */}
                  {myCoupons.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">보유한 쿠폰이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myCoupons.map((userCoupon: any) => {
                        const coupon = userCoupon.coupon as Coupon;
                        const isUsed = userCoupon.is_used;
                        const expiresAt = coupon.valid_until
                          ? new Date(coupon.valid_until)
                          : null;
                        const isExpired = expiresAt
                          ? expiresAt < new Date()
                          : false;

                        return (
                          <div
                            key={userCoupon.id}
                            className={`border border-gray-200 rounded p-4 ${
                              isUsed || isExpired ? "opacity-50" : ""
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="text-sm font-medium text-gray-900">
                                  {coupon.name}
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {coupon.code}
                                </p>
                              </div>
                              <span className="text-sm font-medium text-red-500">
                                {formatDiscount(coupon)}
                              </span>
                            </div>
                            {coupon.description && (
                              <p className="text-xs text-gray-500 mb-2">
                                {coupon.description}
                              </p>
                            )}
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>
                                최소 주문 {coupon.min_purchase.toLocaleString()}
                                원
                              </span>
                              <span>
                                {isUsed
                                  ? "사용완료"
                                  : isExpired
                                  ? "기간만료"
                                  : `~${formatCouponDate(coupon.valid_until)}`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "addresses" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-medium text-gray-900">
                    배송지 관리
                  </h2>
                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="text-sm text-gray-600 hover:text-gray-900 border-b border-gray-400 pb-0.5 transition"
                  >
                    {showAddressForm ? "취소" : "새 배송지 추가"}
                  </button>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  {showAddressForm && (
                    <div className="mb-8 border border-gray-200 rounded p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="배송지 이름"
                          value={addressForm.name}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              name: e.target.value,
                            })
                          }
                          className="px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="받는 사람"
                          value={addressForm.recipient}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              recipient: e.target.value,
                            })
                          }
                          className="px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                        />
                        <input
                          type="tel"
                          placeholder="연락처"
                          value={addressForm.phone}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              phone: e.target.value,
                            })
                          }
                          className="px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="우편번호"
                            value={addressForm.postal_code}
                            readOnly
                            className="flex-1 px-4 py-2 border border-gray-200 rounded bg-gray-50"
                          />
                          <AddressSearch
                            onComplete={(data) =>
                              setAddressForm({
                                ...addressForm,
                                postal_code: data.postal_code,
                                address: data.address,
                              })
                            }
                            buttonLabel="주소검색"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="주소 검색 버튼을 클릭하세요"
                          value={addressForm.address}
                          readOnly
                          className="px-4 py-2 border border-gray-200 rounded md:col-span-2 bg-gray-50"
                        />
                        <input
                          type="text"
                          placeholder="상세 주소"
                          value={addressForm.address_detail}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              address_detail: e.target.value,
                            })
                          }
                          className="px-4 py-2 border border-gray-200 rounded md:col-span-2 focus:outline-none focus:border-gray-400"
                        />
                      </div>
                      <div className="flex items-center mt-4">
                        <input
                          id="is_default_address"
                          type="checkbox"
                          checked={addressForm.is_default}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              is_default: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="is_default_address"
                          className="ml-2 text-sm text-gray-600"
                        >
                          기본 배송지로 설정
                        </label>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={handleAddAddress}
                          disabled={createAddressMutation.isPending}
                          className="px-6 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {createAddressMutation.isPending
                            ? "등록 중..."
                            : "배송지 추가"}
                        </button>
                      </div>
                    </div>
                  )}

                  {addresses.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-gray-500">등록된 배송지가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((address: ShippingAddress) => (
                        <div
                          key={address.id}
                          className="border border-gray-200 rounded p-4"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-gray-900">
                                {address.name}
                              </h3>
                              {address.is_default && (
                                <span className="px-2 py-0.5 text-xs bg-gray-900 text-white rounded">
                                  기본
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {!address.is_default && (
                                <button
                                  onClick={() =>
                                    handleSetDefaultAddress(address.id)
                                  }
                                  disabled={setDefaultAddressMutation.isPending}
                                  className="text-xs text-gray-500 hover:text-gray-900 disabled:cursor-not-allowed"
                                >
                                  기본 설정
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteAddress(address.id)}
                                disabled={deleteAddressMutation.isPending}
                                className="text-xs text-red-500 hover:text-red-700 disabled:cursor-not-allowed"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            {address.address} {address.address_detail}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {address.recipient} · {address.phone}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "health" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-medium text-gray-900">
                    문진 관리
                  </h2>
                  {savedHealthConsultation?.updated_at && (
                    <p className="text-sm text-gray-500">
                      마지막 수정{" "}
                      {new Date(
                        savedHealthConsultation.updated_at
                      ).toLocaleDateString("ko-KR")}
                    </p>
                  )}
                </div>
                <div className="border-t border-gray-200 pt-6">
                  {/* 안내 문구 */}
                  <div className="mb-6 p-4 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">
                      한 번 저장해두면 주문/결제 시 문진 정보가 자동으로
                      채워집니다.
                    </p>
                  </div>

                  <HealthConsultationForm
                    initialData={savedHealthConsultation || undefined}
                    onSubmit={handleSaveHealthConsultation}
                    submitLabel={
                      savedHealthConsultation
                        ? "문진 정보 업데이트"
                        : "문진 정보 저장"
                    }
                    isSubmitting={upsertHealthMutation.isPending}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
