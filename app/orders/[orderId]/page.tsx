"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { ordersQueries } from "@/queries/orders.queries";

// 방문 타입 한글 변환
function getVisitTypeLabel(visitType: string | null): string {
  if (!visitType) return "";
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

// 상담 상태 라벨
function getConsultationStatusLabel(status: string | null): {
  label: string;
} {
  if (!status) return { label: "-" };
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
}

// 식사 패턴 라벨
function getMealPatternLabel(pattern: string | null): string {
  if (!pattern) return "-";
  switch (pattern) {
    case "1meals":
      return "1끼";
    case "2meals":
      return "2끼";
    case "3meals":
      return "3끼";
    case "irregular":
      return "불규칙";
    default:
      return pattern;
  }
}

// 음주 빈도 라벨
function getAlcoholFrequencyLabel(frequency: string | null): string {
  if (!frequency) return "-";
  switch (frequency) {
    case "weekly_1_or_less":
      return "주 1회 이하";
    case "weekly_2_or_more":
      return "주 2회 이상";
    default:
      return frequency;
  }
}

// 수분 섭취량 라벨
function getWaterIntakeLabel(intake: string | null): string {
  if (!intake) return "-";
  switch (intake) {
    case "1L_or_less":
      return "1L 이하";
    case "over_1L":
      return "1L 이상";
    default:
      return intake;
  }
}

// 다이어트 접근법 라벨
function getDietApproachLabel(approach: string | null): string {
  if (!approach) return "-";
  switch (approach) {
    case "sustainable":
      return "지속 가능한 (천천히)";
    case "fast":
      return "빠른 감량";
    default:
      return approach;
  }
}

// 선호 단계 라벨
function getPreferredStageLabel(stage: string | null): string {
  if (!stage) return "-";
  switch (stage) {
    case "stage1":
      return "1단계";
    case "stage2":
      return "2단계";
    case "stage3":
      return "3단계";
    default:
      return stage;
  }
}

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { orderId } = use(params);
  const router = useRouter();

  // 공통 인증 훅 사용 (카카오 프로필 미완성 시 자동 리다이렉트)
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  const {
    data: order,
    isLoading: orderLoading,
    error,
  } = useQuery({
    ...ordersQueries.byOrderId(orderId),
    enabled: isAuthenticated, // 인증된 사용자만 주문 조회
  });

  const isLoading = authLoading || orderLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="relative h-32 md:h-40 bg-gray-800 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-900/40" />
          <div className="relative h-full flex flex-col items-center justify-center text-white">
            <h1 className="text-xl md:text-2xl font-medium tracking-wide">
              주문 상세
            </h1>
          </div>
        </div>
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="border border-gray-200 rounded p-6">
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="relative h-32 md:h-40 bg-gray-800 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-900/40" />
          <div className="relative h-full flex flex-col items-center justify-center text-white">
            <h1 className="text-xl md:text-2xl font-medium tracking-wide">
              주문 상세
            </h1>
          </div>
        </div>
        <main className="max-w-md mx-auto px-4 py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-gray-400">?</span>
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-3">
              주문을 찾을 수 없습니다
            </h2>
            <p className="text-sm text-gray-500 mb-8">
              요청하신 주문 정보가 존재하지 않거나 접근 권한이 없습니다.
            </p>
            <Link
              href="/profile?tab=orders"
              className="inline-block bg-gray-900 text-white px-6 py-3 rounded hover:bg-gray-800 transition text-sm"
            >
              주문 내역으로 돌아가기
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const consultationStatusInfo = getConsultationStatusLabel(
    order.consultation_status
  );
  const consultation = order.order_health_consultation;

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* 히어로 배너 */}
      <div className="relative h-32 md:h-40 bg-gray-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-900/40" />
        <div className="relative h-full flex flex-col items-center justify-center text-white">
          <h1 className="text-xl md:text-2xl font-medium tracking-wide">
            주문 상세
          </h1>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-500 hover:text-gray-900 mb-2 flex items-center gap-1"
            >
              <span>←</span> 뒤로가기
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* 주문 정보 */}
          <div className="border border-gray-200 rounded p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              주문 정보
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">주문번호</span>
                <p className="font-semibold text-gray-900">{order.order_id}</p>
              </div>
              <div>
                <span className="text-gray-500">주문일시</span>
                <p className="font-semibold text-gray-900">
                  {new Date(order.created_at).toLocaleString("ko-KR")}
                </p>
              </div>
              <div>
                <span className="text-gray-500">주문자</span>
                <p className="font-semibold text-gray-900">{order.user_name}</p>
              </div>
              <div>
                <span className="text-gray-500">연락처</span>
                <p className="font-semibold text-gray-900">
                  {order.user_phone || "-"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">이메일</span>
                <p className="font-semibold text-gray-900">
                  {order.user_email}
                </p>
              </div>
              <div>
                <span className="text-gray-500">주문 상태</span>
                <p className={`font-semibold`}>
                  {consultationStatusInfo.label}
                </p>
              </div>
            </div>
          </div>

          {/* 배송 정보 */}
          {(order.shipping_address || order.shipping_name) && (
            <div className="border border-gray-200 rounded p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                배송 정보
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">수령인</span>
                  <p className="font-semibold text-gray-900">
                    {order.shipping_name}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">연락처</span>
                  <p className="font-semibold text-gray-900">
                    {order.shipping_phone}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-500">배송지</span>
                  <p className="font-semibold text-gray-900">
                    {order.shipping_postal_code &&
                      `[${order.shipping_postal_code}] `}
                    {order.shipping_address}
                    {order.shipping_address_detail &&
                      ` ${order.shipping_address_detail}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 주문 상품 */}
          <div className="border border-gray-200 rounded p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              주문 상품
            </h2>
            <div className="divide-y divide-gray-100">
              {order.order_items.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {item.product_name}
                      </p>
                      {item.option_name && (
                        <p className="text-sm text-gray-600 mt-1">
                          옵션: {item.option_name}
                          {item.visit_type && (
                            <span className="ml-2 inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                              {getVisitTypeLabel(item.visit_type)}
                            </span>
                          )}
                        </p>
                      )}
                      {item.selected_option_settings &&
                        Array.isArray(item.selected_option_settings) &&
                        item.selected_option_settings.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.selected_option_settings.map(
                              (setting: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                                >
                                  {setting.setting_name}: {setting.type_name}
                                </span>
                              )
                            )}
                          </div>
                        )}
                      <p className="text-sm text-gray-500 mt-1">
                        수량: {item.quantity}개
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {(item.product_price * item.quantity).toLocaleString()}
                        원
                      </p>
                      {item.option_price && item.option_price > 0 && (
                        <p className="text-xs text-gray-500">
                          (옵션가 {item.option_price.toLocaleString()}원)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 결제 금액 상세 */}
            <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
              {/* 상품 금액 */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">상품 금액</span>
                <span className="text-gray-700">
                  {order.order_items
                    .reduce(
                      (sum, item) => sum + item.product_price * item.quantity,
                      0
                    )
                    .toLocaleString()}
                  원
                </span>
              </div>

              {/* 쿠폰 할인 */}
              {order.coupon_discount != null && order.coupon_discount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">쿠폰 할인</span>
                  <span className="text-red-500">
                    -{order.coupon_discount.toLocaleString()}원
                  </span>
                </div>
              )}

              {/* 포인트 사용 */}
              {order.used_points != null && order.used_points > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">포인트 사용</span>
                  <span className="text-red-500">
                    -{order.used_points.toLocaleString()}원
                  </span>
                </div>
              )}

              {/* 배송비 */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">배송비</span>
                <span className="text-gray-700">
                  {order.shipping_fee != null && order.shipping_fee > 0
                    ? `${order.shipping_fee.toLocaleString()}원`
                    : "무료"}
                </span>
              </div>

              {/* 총 결제 금액 */}
              <div className="flex justify-between items-center text-base font-medium pt-2 border-t border-gray-100">
                <span className="text-gray-900">총 결제 금액</span>
                <span className="text-gray-900">
                  {order.total_amount.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>

          {/* 문진 정보 */}
          {consultation && (
            <div className="border border-gray-200 rounded p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                문진 정보
              </h2>

              {/* 기본 정보 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                  기본 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">이름</span>
                    <p className="font-semibold">{consultation.name || "-"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">주민등록번호</span>
                    <p className="font-semibold">
                      {consultation.resident_number || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">연락처</span>
                    <p className="font-semibold">{consultation.phone || "-"}</p>
                  </div>
                </div>
              </div>

              {/* 신체 정보 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                  신체 정보
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">현재 신장</span>
                    <p className="font-semibold">
                      {consultation.current_height
                        ? `${consultation.current_height}cm`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">현재 체중</span>
                    <p className="font-semibold">
                      {consultation.current_weight
                        ? `${consultation.current_weight}kg`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">목표 체중</span>
                    <p className="font-semibold text-blue-600">
                      {consultation.target_weight
                        ? `${consultation.target_weight}kg`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">목표 기간</span>
                    <p className="font-semibold">
                      {consultation.target_weight_loss_period || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">20대 이후 최저 체중</span>
                    <p className="font-semibold">
                      {consultation.min_weight_since_20s
                        ? `${consultation.min_weight_since_20s}kg`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">20대 이후 최고 체중</span>
                    <p className="font-semibold">
                      {consultation.max_weight_since_20s
                        ? `${consultation.max_weight_since_20s}kg`
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 이전 치료 경험 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                  이전 치료/복용 경험
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">양약 복용 경험</span>
                    <p className="font-semibold">
                      {consultation.previous_western_medicine || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">한약 복용 경험</span>
                    <p className="font-semibold">
                      {consultation.previous_herbal_medicine || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">기타 치료 경험</span>
                    <p className="font-semibold">
                      {consultation.previous_other_medicine || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 직업/생활 정보 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                  직업/생활 정보
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">직업</span>
                    <p className="font-semibold">
                      {consultation.occupation || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">근무 시간</span>
                    <p className="font-semibold">
                      {consultation.work_hours || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">교대 근무</span>
                    <p className="font-semibold">
                      {consultation.has_shift_work ? "예" : "아니오"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">주간 졸림</span>
                    <p className="font-semibold">
                      {consultation.has_daytime_sleepiness ? "있음" : "없음"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">기상 시간</span>
                    <p className="font-semibold">
                      {consultation.wake_up_time || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">취침 시간</span>
                    <p className="font-semibold">
                      {consultation.bedtime || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 식습관/생활습관 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                  식습관/생활습관
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">식사 패턴</span>
                    <p className="font-semibold">
                      {getMealPatternLabel(consultation.meal_pattern)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">음주 빈도</span>
                    <p className="font-semibold">
                      {getAlcoholFrequencyLabel(consultation.alcohol_frequency)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">수분 섭취량</span>
                    <p className="font-semibold">
                      {getWaterIntakeLabel(consultation.water_intake)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 다이어트 선호 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                  다이어트 선호
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">다이어트 접근법</span>
                    <p className="font-semibold">
                      {getDietApproachLabel(consultation.diet_approach)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">선호 단계</span>
                    <p className="font-semibold">
                      {getPreferredStageLabel(consultation.preferred_stage)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 병력/복용약 */}
              {consultation.medical_history && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                    병력/현재 복용 중인 약
                  </h3>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {consultation.medical_history}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-4">
            <Link
              href="/profile?tab=orders"
              className="flex-1 text-center py-3 border border-gray-200 text-gray-700 rounded hover:bg-gray-50 transition text-sm"
            >
              주문 내역으로
            </Link>
            <Link
              href="/products"
              className="flex-1 text-center py-3 bg-gray-900 text-white rounded hover:bg-gray-800 transition text-sm"
            >
              쇼핑 계속하기
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
