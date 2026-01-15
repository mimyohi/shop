import Link from "next/link";
import { redirect } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabaseServer";
import { fetchOrderByOrderIdServer } from "@/lib/server-data";
import BackButton from "./BackButton";

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

// 결제 상태 라벨
function getPaymentStatusLabel(status: string | null): {
  label: string;
  color: string;
} {
  if (!status) return { label: "-", color: "text-gray-500" };
  switch (status) {
    case "payment_pending":
      return { label: "입금 대기", color: "text-orange-600" };
    case "completed":
      return { label: "결제 완료", color: "text-green-600" };
    case "cancelled":
      return { label: "결제 취소", color: "text-red-600" };
    case "refunded":
      return { label: "환불 완료", color: "text-gray-600" };
    default:
      return { label: status, color: "text-gray-500" };
  }
}

// 결제 방법 라벨
function getPaymentMethodLabel(
  method: string | null | undefined,
  totalAmount?: number | null
): string {
  if (totalAmount === 0) return "무료 결제";
  if (!method) return "-";
  switch (method) {
    case "VIRTUAL_ACCOUNT":
      return "가상계좌 (무통장입금)";
    case "CARD":
      return "신용/체크카드";
    case "TRANSFER":
      return "실시간 계좌이체";
    default:
      return method;
  }
}

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;

  // 서버에서 인증 상태 확인
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!user) {
    redirect(`/auth/login?next=/orders/${orderId}`);
  }

  // 주문 데이터 가져오기
  const order = await fetchOrderByOrderIdServer(orderId);

  if (!order) {
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
            <BackButton />
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
                  {new Date(order.created_at).toLocaleString("ko-KR", {
                    timeZone: "Asia/Seoul",
                  })}
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
                <span className="text-gray-500">결제 방법</span>
                <p className="font-semibold text-gray-900">
                  {getPaymentMethodLabel(order.payment_method, order.total_amount)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">결제 상태</span>
                <p
                  className={`font-semibold ${
                    getPaymentStatusLabel(order.status).color
                  }`}
                >
                  {getPaymentStatusLabel(order.status).label}
                </p>
              </div>
              {/* 입금 대기 상태가 아닐 때만 주문 상태 표시 */}
              {order.status !== "payment_pending" && (
                <div>
                  <span className="text-gray-500">주문 상태</span>
                  <p className="font-semibold text-gray-900">
                    {consultationStatusInfo.label}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 가상계좌 정보 (입금 대기 중인 경우) */}
          {order.payment_method === "VIRTUAL_ACCOUNT" &&
            order.virtual_account_number && (
              <div
                className={`border rounded p-6 ${
                  order.status === "payment_pending"
                    ? "border-black-300 bg-black-50"
                    : "border-gray-200"
                }`}
              >
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  {order.status === "payment_pending" ? (
                    <>입금 대기 중</>
                  ) : (
                    "가상계좌 정보"
                  )}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">은행</span>
                    <p className="font-semibold text-gray-900">
                      {order.virtual_account_bank}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">계좌번호</span>
                    <p className="font-semibold text-gray-900 font-mono">
                      {order.virtual_account_number}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">예금주</span>
                    <p className="font-semibold text-gray-900">
                      {order.virtual_account_holder}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">입금액</span>
                    <p className="font-semibold text-black-600">
                      {order.total_amount.toLocaleString()}원
                    </p>
                  </div>
                  {order.status === "payment_pending" &&
                    order.virtual_account_due_date && (
                      <div className="md:col-span-2">
                        <span className="text-gray-500">입금 기한</span>
                        <p className="font-semibold text-red-600">
                          {new Date(
                            order.virtual_account_due_date
                          ).toLocaleString("ko-KR", {
                            timeZone: "Asia/Seoul",
                          })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          * 입금 기한 내 미입금 시 주문이 자동 취소됩니다.
                        </p>
                      </div>
                    )}
                  {order.status === "completed" &&
                    order.virtual_account_deposited_at && (
                      <div className="md:col-span-2">
                        <span className="text-gray-500">입금 완료</span>
                        <p className="font-semibold text-green-600">
                          {new Date(
                            order.virtual_account_deposited_at
                          ).toLocaleString("ko-KR", {
                            timeZone: "Asia/Seoul",
                          })}
                        </p>
                      </div>
                    )}
                </div>
              </div>
            )}

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
                      {item.product_id ? (
                        <Link
                          href={`/products/${item.product_id}`}
                          className="font-semibold text-gray-900 hover:text-gray-600 hover:underline transition"
                        >
                          {item.product_name}
                        </Link>
                      ) : (
                        <p className="font-semibold text-gray-900">
                          {item.product_name}
                        </p>
                      )}

                      {/* 옵션 섹션 */}
                      {(item.option_name ||
                        (item.selected_option_settings &&
                          Array.isArray(item.selected_option_settings) &&
                          item.selected_option_settings.length > 0)) && (
                        <div className="mt-2 pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              {item.option_name && (
                                <p className="text-sm text-gray-600">
                                  옵션: {item.option_name}
                                  {item.visit_type && (
                                    <span className="ml-2 inline-block px-2 py-0.5 bg-black-100 text-black-700 rounded text-xs">
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
                                          {setting.setting_name}:{" "}
                                          {setting.type_name}
                                        </span>
                                      )
                                    )}
                                  </div>
                                )}
                              {/* 수량 - 옵션 바로 아래 */}
                              <p className="text-sm text-gray-500 mt-2">
                                수량: {item.quantity}개
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-semibold text-gray-900">
                                {(
                                  item.product_price * item.quantity
                                ).toLocaleString()}
                                원
                              </p>
                              {item.option_price && item.option_price > 0 && (
                                <p className="text-xs text-gray-500">
                                  (옵션가 {item.option_price.toLocaleString()}
                                  원)
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 옵션이 없을 때 수량 표시 */}
                      {!(
                        item.option_name ||
                        (item.selected_option_settings &&
                          Array.isArray(item.selected_option_settings) &&
                          item.selected_option_settings.length > 0)
                      ) && (
                        <p className="text-sm text-gray-500 mt-2">
                          수량: {item.quantity}개
                        </p>
                      )}

                      {/* 추가 상품 섹션 */}
                      {item.selected_addons &&
                        Array.isArray(item.selected_addons) &&
                        item.selected_addons.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-2">
                              추가 상품
                            </p>
                            <div className="space-y-1">
                              {item.selected_addons.map(
                                (addon: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-700">
                                        {addon.name}
                                      </span>
                                      {(addon.quantity || 1) > 1 && (
                                        <span className="text-xs text-gray-500">
                                          x{addon.quantity}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-gray-600">
                                      +
                                      {(
                                        Number(addon.price) *
                                        (addon.quantity || 1)
                                      ).toLocaleString()}
                                      원
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                    {/* 옵션이 없을 때만 오른쪽에 가격 표시 */}
                    {!(
                      item.option_name ||
                      (item.selected_option_settings &&
                        Array.isArray(item.selected_option_settings) &&
                        item.selected_option_settings.length > 0)
                    ) && (
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {(
                            item.product_price * item.quantity
                          ).toLocaleString()}
                          원
                        </p>
                        {item.option_price && item.option_price > 0 && (
                          <p className="text-xs text-gray-500">
                            (옵션가 {item.option_price.toLocaleString()}원)
                          </p>
                        )}
                      </div>
                    )}
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

              {/* 추가 상품 금액 */}
              {order.order_items.some(
                (item) =>
                  item.selected_addons &&
                  Array.isArray(item.selected_addons) &&
                  item.selected_addons.length > 0
              ) && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">추가 상품</span>
                  <span className="text-gray-700">
                    {order.order_items
                      .reduce((sum, item) => {
                        if (
                          !item.selected_addons ||
                          !Array.isArray(item.selected_addons)
                        )
                          return sum;
                        return (
                          sum +
                          item.selected_addons.reduce(
                            (addonSum: number, addon: any) =>
                              addonSum +
                              Number(addon.price) * (addon.quantity || 1),
                            0
                          )
                        );
                      }, 0)
                      .toLocaleString()}
                    원
                  </span>
                </div>
              )}

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
                    <p className="font-semibold text-black-600">
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
