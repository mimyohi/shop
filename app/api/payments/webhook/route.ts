import { NextRequest, NextResponse } from "next/server";
import { PortOneClient, Webhook } from "@portone/server-sdk";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { env } from "@/env";
import { sendOrderConfirmationAlimtalk } from "@/lib/kakao/alimtalk";

const portone = PortOneClient({
  secret: env.PORTONE_API_SECRET,
  storeId: env.NEXT_PUBLIC_PORTONE_STORE_ID,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const webhookSecret = env.PORTONE_WEBHOOK_SECRET;

    // 웹훅 시크릿 필수 검증
    if (!webhookSecret) {
      console.error("PORTONE_WEBHOOK_SECRET 환경 변수가 설정되지 않았습니다.");
      return NextResponse.json(
        { error: "서버 설정 오류입니다." },
        { status: 500 }
      );
    }

    const signatureHeader = request.headers.get("webhook-signature") || "";
    const timestampHeader = request.headers.get("webhook-timestamp") || "";
    const idHeader = request.headers.get("webhook-id") || "";

    try {
      Webhook.verify(webhookSecret, body, {
        "webhook-signature": signatureHeader,
        "webhook-timestamp": timestampHeader,
        "webhook-id": idHeader,
      });
    } catch (e) {
      console.error("웹훅 검증 실패:", e);
      return NextResponse.json(
        { error: "웹훅 검증에 실패했습니다." },
        { status: 401 }
      );
    }

    const webhookData = JSON.parse(body);
    console.log("웹훅 데이터 수신:", webhookData);

    // 결제 완료 이벤트 처리 (가상계좌 입금 완료)
    if (webhookData.type === "Transaction.Paid") {
      const paymentId = webhookData.data?.paymentId;

      if (!paymentId) {
        console.error("paymentId가 없습니다.");
        return NextResponse.json(
          { error: "paymentId가 필요합니다." },
          { status: 400 }
        );
      }

      // 포트원에서 결제 정보 조회
      const paymentData = await portone.payment.getPayment({ paymentId });

      if (paymentData.status !== "PAID") {
        console.log("결제 상태가 PAID가 아닙니다:", paymentData.status);
        return NextResponse.json({
          success: true,
          message: "결제 상태가 PAID가 아닙니다.",
        });
      }

      // 주문 정보 조회
      const { data: orderData, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("order_id", paymentId)
        .single();

      if (orderError || !orderData) {
        console.error("주문 정보 조회 실패:", orderError);
        return NextResponse.json(
          { error: "주문 정보를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      // 이미 완료된 주문인 경우 중복 처리 방지
      if (orderData.status === "completed") {
        console.log("이미 완료된 주문입니다:", paymentId);
        return NextResponse.json({
          success: true,
          message: "이미 처리된 주문입니다.",
        });
      }

      // 금액 검증 추가
      const paidAmountFromPG = (paymentData as any).amount?.total || 0;
      const expectedAmount = orderData.total_amount || 0;

      if (Math.abs(paidAmountFromPG - expectedAmount) > 1) {
        console.error("금액 불일치:", {
          expected: expectedAmount,
          paid: paidAmountFromPG,
          orderId: paymentId,
        });
        return NextResponse.json(
          { error: "결제 금액이 일치하지 않습니다." },
          { status: 400 }
        );
      }

      // 동시성 제어: payment_pending 상태인 주문만 업데이트 (중복 처리 방지)
      const { error: updateError, data: updatedRows } = await supabaseAdmin
        .from("orders")
        .update({
          status: "completed",
          virtual_account_deposited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", paymentId)
        .in("status", ["pending", "payment_pending"])
        .select("id");

      if (updateError) {
        console.error("주문 상태 업데이트 실패:", updateError);
        return NextResponse.json(
          { error: "주문 상태 업데이트에 실패했습니다." },
          { status: 500 }
        );
      }

      // 업데이트된 행이 없으면 이미 다른 요청에서 처리됨
      if (!updatedRows || updatedRows.length === 0) {
        console.log("이미 처리된 주문 (동시성 제어) - paymentId:", paymentId);
        return NextResponse.json({
          success: true,
          message: "이미 처리된 주문입니다.",
        });
      }

      console.log("가상계좌 입금 완료 처리 성공:", paymentId);

      // 포인트 차감 (가상계좌 입금 완료 시)
      const pointsUsed = orderData.used_points || 0;
      if (pointsUsed > 0 && orderData.user_id) {
        try {
          // 1. 포인트 히스토리 추가
          const { error: historyError } = await supabaseAdmin
            .from("point_history")
            .insert({
              user_id: orderData.user_id,
              points: -pointsUsed,
              type: "use",
              reason: `주문 사용 (${orderData.order_id})`,
              order_id: orderData.id,
            });

          if (historyError) {
            console.error("포인트 히스토리 저장 실패:", historyError);
          }

          // 2. 사용자 포인트 차감
          const { data: currentPoints } = await supabaseAdmin
            .from("user_points")
            .select("points, total_used")
            .eq("user_id", orderData.user_id)
            .single();

          if (currentPoints) {
            const { error: pointsError } = await supabaseAdmin
              .from("user_points")
              .update({
                points: currentPoints.points - pointsUsed,
                total_used: (currentPoints.total_used || 0) + pointsUsed,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", orderData.user_id);

            if (pointsError) {
              console.error("포인트 차감 실패:", pointsError);
            } else {
              console.log("포인트 차감 완료 (가상계좌):", {
                userId: orderData.user_id,
                used: pointsUsed,
                remaining: currentPoints.points - pointsUsed,
              });
            }
          }
        } catch (pointsError) {
          console.error("포인트 처리 중 오류:", pointsError);
        }
      }

      // 쿠폰 사용 처리 (가상계좌 입금 완료 시)
      if (orderData.user_coupon_id) {
        try {
          const { error: couponError } = await supabaseAdmin
            .from("user_coupons")
            .update({
              is_used: true,
              used_at: new Date().toISOString(),
              order_id: orderData.id,
            })
            .eq("id", orderData.user_coupon_id);

          if (couponError) {
            console.error("쿠폰 사용 처리 실패:", couponError);
          } else {
            console.log("쿠폰 사용 처리 완료 (가상계좌):", orderData.user_coupon_id);
          }
        } catch (couponError) {
          console.error("쿠폰 처리 중 오류:", couponError);
        }
      }

      // order_items 조회
      const { data: orderItems } = await supabaseAdmin
        .from("order_items")
        .select("*")
        .eq("order_id", orderData.id);

      const paidAmount = paymentData.amount?.total || 0;

      // 주문 확인 알림톡 발송
      const phone = orderData.user_phone || orderData.shipping_phone;
      if (phone && orderItems) {
        try {
          const firstProduct = orderItems[0]?.product_name || "상품";
          const productNames =
            orderItems.length > 1
              ? `${firstProduct} 외 ${orderItems.length - 1}건`
              : firstProduct;

          const alimtalkResult = await sendOrderConfirmationAlimtalk(phone, {
            orderId: orderData.order_id,
            customerName: orderData.user_name || orderData.shipping_name,
            totalAmount: paidAmount,
            productNames,
          });

          if (!alimtalkResult.success) {
            console.error("주문 확인 알림톡 발송 실패:", alimtalkResult.error);
          }
        } catch (alimtalkError) {
          console.error("주문 확인 알림톡 발송 중 오류:", alimtalkError);
        }
      }

      return NextResponse.json({
        success: true,
        message: "가상계좌 입금이 확인되었습니다.",
      });
    }

    // 가상계좌 발급 취소/만료 이벤트 처리
    if (webhookData.type === "Transaction.VirtualAccountIssued") {
      // 이미 verify에서 처리하므로 여기서는 로깅만
      console.log("가상계좌 발급 이벤트:", webhookData.data?.paymentId);
      return NextResponse.json({
        success: true,
        message: "가상계좌 발급 이벤트 처리됨.",
      });
    }

    // 결제 취소/환불 이벤트 처리
    if (webhookData.type === "Transaction.Cancelled" || webhookData.type === "Transaction.PartialCancelled") {
      const paymentId = webhookData.data?.paymentId;
      console.log("결제 취소/환불 이벤트:", paymentId);

      if (paymentId) {
        await supabaseAdmin
          .from("orders")
          .update({
            status: "cancelled",
            consultation_status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", paymentId);
      }

      return NextResponse.json({
        success: true,
        message: "결제 취소/환불 이벤트 처리됨.",
      });
    }

    // 가상계좌 입금 기한 만료 이벤트 처리 (결제 실패)
    if (webhookData.type === "Transaction.PaymentFailed") {
      const paymentId = webhookData.data?.paymentId;
      console.log("결제 실패 이벤트 (가상계좌 만료 포함):", paymentId);

      if (paymentId) {
        // 해당 주문이 가상계좌 결제인지 확인
        const { data: orderData } = await supabaseAdmin
          .from("orders")
          .select("*")
          .eq("order_id", paymentId)
          .single();

        if (orderData && orderData.payment_method === "VIRTUAL_ACCOUNT" && orderData.status === "pending") {
          // 가상계좌 입금 기한 만료로 인한 취소 처리
          await supabaseAdmin
            .from("orders")
            .update({
              status: "cancelled",
              consultation_status: "cancelled",
              cancel_reason: "가상계좌 입금 기한 만료",
              updated_at: new Date().toISOString(),
            })
            .eq("order_id", paymentId);

          console.log("가상계좌 입금 기한 만료로 주문 취소:", paymentId);
        }
      }

      return NextResponse.json({
        success: true,
        message: "결제 실패 이벤트 처리됨.",
      });
    }

    // 기타 이벤트
    console.log("처리되지 않은 웹훅 타입:", webhookData.type);
    return NextResponse.json({
      success: true,
      message: "이벤트가 처리되지 않았습니다.",
    });
  } catch (error) {
    console.error("웹훅 처리 중 오류:", error);
    return NextResponse.json(
      { error: "웹훅 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
