import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as PortOne from "@portone/server-sdk";
import {
  sendOrderConfirmationAlimtalk,
  sendPaymentCancellationAlimtalk,
} from "@/lib/kakao/alimtalk";
import { env } from "@/env";

const portoneApiSecret = env.PORTONE_API_SECRET;
const portoneWebhookSecret = env.PORTONE_WEBHOOK_SECRET;

type PaymentWebhook = Extract<
  PortOne.Webhook.Webhook,
  { data: { paymentId: string } }
>;

const hasPaymentId = (
  webhook: PortOne.Webhook.Webhook
): webhook is PaymentWebhook => {
  if (
    !("data" in webhook) ||
    typeof webhook.data !== "object" ||
    webhook.data === null
  ) {
    return false;
  }

  const data = webhook.data as Record<string, unknown>;
  return typeof data.paymentId === "string";
};

// Next.js에서 raw body를 읽기 위한 설정
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // 웹훅 시크릿 확인
    if (!portoneWebhookSecret) {
      console.error("PORTONE_WEBHOOK_SECRET 환경 변수가 설정되지 않았습니다.");
      return NextResponse.json(
        { error: "웹훅 설정이 올바르지 않습니다." },
        { status: 500 }
      );
    }

    // raw body 읽기
    const body = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // 웹훅 시그니처 검증
    let webhook: PortOne.Webhook.Webhook;
    try {
      webhook = await PortOne.Webhook.verify(
        portoneWebhookSecret,
        body,
        headers
      );
    } catch (error) {
      console.error("웹훅 시그니처 검증 실패:", error);
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // paymentId가 있는 경우에만 처리
    if (!hasPaymentId(webhook)) {
      return NextResponse.json({ received: true });
    }

    const paymentId = webhook.data.paymentId;

    // 포트원 API로 결제 정보 조회 (웹훅 메시지를 신뢰하지 않고 재확인)
    const paymentResponse = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `PortOne ${portoneApiSecret}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json();
      console.error("결제 정보 조회 실패:", errorData);
      return NextResponse.json(
        { error: "결제 정보 조회 실패" },
        { status: 500 }
      );
    }

    const paymentData = await paymentResponse.json();

    // 주문 조회
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", paymentId)
      .single();

    if (orderError || !order) {
      console.error("주문 조회 실패:", orderError);
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이미 처리된 주문인지 확인
    if (order.status === "completed") {
      return NextResponse.json({
        received: true,
        message: "Already processed",
      });
    }

    // 금액 검증 (위변조 방지)
    if (paymentData.amount?.total !== order.total_amount) {
      console.error(
        "금액 불일치:",
        `결제 금액: ${paymentData.amount?.total}, 주문 금액: ${order.total_amount}`
      );
      return NextResponse.json({ error: "금액 불일치" }, { status: 400 });
    }

    // 웹훅 타입에 따른 처리
    if (webhook.type === "Transaction.Paid") {
      // 결제 완료 처리
      await handlePaymentSuccess(order, paymentData);
    } else if (
      webhook.type === "Transaction.Cancelled" ||
      webhook.type === "Transaction.PartialCancelled"
    ) {
      // 결제 취소 처리
      await handlePaymentCancelled(order, paymentData);
    } else if (webhook.type === "Transaction.Failed") {
      // 결제 실패 처리
      await handlePaymentFailed(order, paymentData);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("웹훅 처리 중 오류:", error);
    return NextResponse.json(
      { error: "웹훅 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 결제 완료 처리
async function handlePaymentSuccess(order: any, paymentData: any) {
  // 주문 상태 업데이트
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "completed",
      payment_key: paymentData.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updateError) {
    console.error("주문 상태 업데이트 실패:", updateError);
    throw updateError;
  }

  // 포인트 사용 처리
  if (order.used_points > 0 && order.user_id) {
    await processPointsUsage(order);
  }

  // 쿠폰 사용 처리
  if (order.user_coupon_id) {
    await processCouponUsage(order);
  }

  // 포인트 적립 (결제 금액의 5%)
  if (order.user_id) {
    await earnPoints(order);
  }

  // 주문 확인 알림톡 발송
  if (order.user_phone || order.shipping_phone) {
    await sendOrderConfirmationAlimtalkNotification(order);
  }
}

// 포인트 사용 처리
async function processPointsUsage(order: any) {
  // 포인트 차감
  const { error: pointsError } = await supabase.rpc("use_points", {
    p_user_id: order.user_id,
    p_points: order.used_points,
  });

  if (pointsError) {
    // RPC 함수가 없으면 수동으로 처리

    // user_points 업데이트
    const { data: userPoints } = await supabase
      .from("user_points")
      .select("points, total_used")
      .eq("user_id", order.user_id)
      .single();

    if (userPoints) {
      await supabase
        .from("user_points")
        .update({
          points: userPoints.points - order.used_points,
          total_used: userPoints.total_used + order.used_points,
        })
        .eq("user_id", order.user_id);
    }
  }

  // 포인트 사용 내역 기록
  await supabase.from("point_history").insert({
    user_id: order.user_id,
    points: -order.used_points,
    type: "use",
    reason: `주문 결제 (${order.order_id})`,
    order_id: order.order_id,
  });
}

// 쿠폰 사용 처리
async function processCouponUsage(order: any) {
  const { error: couponError } = await supabase
    .from("user_coupons")
    .update({
      is_used: true,
      used_at: new Date().toISOString(),
      order_id: order.order_id,
    })
    .eq("id", order.user_coupon_id);

  if (couponError) {
    console.error("쿠폰 사용 처리 실패:", couponError);
    throw couponError;
  }
}

// 포인트 적립
async function earnPoints(order: any) {
  const earnRate = 0.05; // 5% 적립
  const earnedPoints = Math.floor(order.total_amount * earnRate);

  if (earnedPoints <= 0) {
    return;
  }

  // user_points 조회 또는 생성
  const { data: userPoints } = await supabase
    .from("user_points")
    .select("*")
    .eq("user_id", order.user_id)
    .single();

  if (userPoints) {
    // 포인트 업데이트
    await supabase
      .from("user_points")
      .update({
        points: userPoints.points + earnedPoints,
        total_earned: userPoints.total_earned + earnedPoints,
      })
      .eq("user_id", order.user_id);
  } else {
    // 포인트 레코드 생성
    await supabase.from("user_points").insert({
      user_id: order.user_id,
      points: earnedPoints,
      total_earned: earnedPoints,
      total_used: 0,
    });
  }

  // 포인트 적립 내역 기록
  await supabase.from("point_history").insert({
    user_id: order.user_id,
    points: earnedPoints,
    type: "earn",
    reason: `주문 결제 적립 (${order.order_id})`,
    order_id: order.order_id,
  });
}

// 결제 취소 처리
async function handlePaymentCancelled(order: any, paymentData: any) {
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updateError) {
    console.error("주문 상태 업데이트 실패:", updateError);
    throw updateError;
  }

  // 포인트 환불 처리 (사용한 포인트 + 적립한 포인트)
  if (order.user_id) {
    await refundPoints(order);
  }

  // 쿠폰 복구
  if (order.user_coupon_id) {
    await restoreCoupon(order);
  }

  // 주문 취소 알림톡 발송
  if (order.user_phone || order.shipping_phone) {
    await sendPaymentCancellationAlimtalkNotification(order);
  }
}

// 포인트 환불
async function refundPoints(order: any) {
  // 사용한 포인트 환불
  if (order.used_points > 0) {
    const { data: userPoints } = await supabase
      .from("user_points")
      .select("*")
      .eq("user_id", order.user_id)
      .single();

    if (userPoints) {
      await supabase
        .from("user_points")
        .update({
          points: userPoints.points + order.used_points,
          total_used: Math.max(0, userPoints.total_used - order.used_points),
        })
        .eq("user_id", order.user_id);

      // 포인트 환불 내역 기록
      await supabase.from("point_history").insert({
        user_id: order.user_id,
        points: order.used_points,
        type: "earn",
        reason: `주문 취소 환불 (${order.order_id})`,
        order_id: order.order_id,
      });
    }
  }

  // 적립한 포인트 회수
  const earnRate = 0.05;
  const earnedPoints = Math.floor(order.total_amount * earnRate);

  if (earnedPoints > 0) {
    const { data: userPoints } = await supabase
      .from("user_points")
      .select("*")
      .eq("user_id", order.user_id)
      .single();

    if (userPoints) {
      await supabase
        .from("user_points")
        .update({
          points: Math.max(0, userPoints.points - earnedPoints),
          total_earned: Math.max(0, userPoints.total_earned - earnedPoints),
        })
        .eq("user_id", order.user_id);

      // 포인트 회수 내역 기록
      await supabase.from("point_history").insert({
        user_id: order.user_id,
        points: -earnedPoints,
        type: "use",
        reason: `주문 취소 회수 (${order.order_id})`,
        order_id: order.order_id,
      });
    }
  }
}

// 쿠폰 복구
async function restoreCoupon(order: any) {
  const { error: couponError } = await supabase
    .from("user_coupons")
    .update({
      is_used: false,
      used_at: null,
      order_id: null,
    })
    .eq("id", order.user_coupon_id);

  if (couponError) {
    console.error("쿠폰 복구 실패:", couponError);
  }
}

// 결제 실패 처리
async function handlePaymentFailed(order: any, paymentData: any) {
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updateError) {
    console.error("주문 상태 업데이트 실패:", updateError);
    throw updateError;
  }
}

// 주문 확인 알림톡 발송
async function sendOrderConfirmationAlimtalkNotification(order: any) {
  try {
    // 주문 상품 조회
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    if (!orderItems || orderItems.length === 0) {
      return;
    }

    // 상품명 생성 (예: "상품A 외 2건")
    const firstProduct = orderItems[0].product_name;
    const productNames =
      orderItems.length > 1
        ? `${firstProduct} 외 ${orderItems.length - 1}건`
        : firstProduct;

    const phone = order.user_phone || order.shipping_phone;

    const result = await sendOrderConfirmationAlimtalk(phone, {
      orderId: order.order_id,
      customerName: order.user_name || order.shipping_name,
      totalAmount: order.total_amount,
      productNames: productNames,
    });

    if (result.success) {
    } else {
      console.error("주문 확인 알림톡 발송 실패:", result.error);
    }
  } catch (error) {
    console.error("주문 확인 알림톡 발송 중 오류:", error);
  }
}

// 주문 취소 알림톡 발송
async function sendPaymentCancellationAlimtalkNotification(order: any) {
  try {
    const phone = order.user_phone || order.shipping_phone;

    const result = await sendPaymentCancellationAlimtalk(phone, {
      orderId: order.order_id,
      customerName: order.user_name || order.shipping_name,
      totalAmount: order.total_amount,
      cancelReason: "관리자 요청",
    });

    if (result.success) {
    } else {
      console.error("주문 취소 알림톡 발송 실패:", result.error);
    }
  } catch (error) {
    console.error("주문 취소 알림톡 발송 중 오류:", error);
  }
}
