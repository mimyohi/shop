import { NextRequest, NextResponse } from "next/server";
import { PortOneClient, PortOneError } from "@portone/server-sdk";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { env } from "@/env";
import { recalculateShippingFeeForValidation } from "@/lib/shipping/calculate-shipping-fee";
import { calculateProductAmount } from "@/lib/utils/price-calculation";
import { sendOrderConfirmationAlimtalk } from "@/lib/kakao/alimtalk";

const portone = PortOneClient({
  secret: env.PORTONE_API_SECRET,
  storeId: env.NEXT_PUBLIC_PORTONE_STORE_ID,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: "결제 ID가 필요합니다." },
        { status: 400 }
      );
    }

    console.log("결제 확인 요청 - paymentId:", paymentId);

    // API Secret 확인
    if (!env.PORTONE_API_SECRET) {
      console.error("PORTONE_API_SECRET 환경 변수가 설정되지 않았습니다.");
      return NextResponse.json(
        { error: "포트원 API 설정이 올바르지 않습니다." },
        { status: 500 }
      );
    }

    // 포트원 SDK로 결제 정보 조회
    let paymentData;
    try {
      paymentData = await portone.payment.getPayment({ paymentId });
    } catch (e: unknown) {
      // 에러 객체 전체 출력
      console.error("포트원 결제 조회 실패:", JSON.stringify(e, null, 2));
      if (e && typeof e === "object" && "data" in e) {
        console.error("에러 data:", JSON.stringify(e.data, null, 2));
      }
      if (e instanceof PortOneError) {
        return NextResponse.json(
          { error: e.message || "결제 정보 조회에 실패했습니다." },
          { status: 400 }
        );
      }
      // 기타 에러도 로깅
      if (e instanceof Error) {
        return NextResponse.json(
          { error: e.message || "결제 정보 조회에 실패했습니다." },
          { status: 400 }
        );
      }
      throw e;
    }

    // 결제 상태 확인
    if (paymentData.status !== "PAID") {
      return NextResponse.json(
        {
          error: `결제가 완료되지 않았습니다. 상태: ${String(
            paymentData.status
          )}`,
        },
        { status: 400 }
      );
    }

    // 주문 정보 조회 (금액 검증을 위해)
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
      console.log("이미 완료된 주문입니다 - paymentId:", paymentId);
      return NextResponse.json({
        success: true,
        message: "이미 처리된 주문입니다.",
        alreadyProcessed: true,
      });
    }

    // order_items 조회하여 상품 금액 계산
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_id", orderData.id);

    if (itemsError || !orderItems) {
      console.error("주문 항목 조회 실패:", itemsError);
      return NextResponse.json(
        { error: "주문 항목을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 상품 금액 계산 (상품 가격 + 옵션 + 애드온)
    const productAmount = calculateProductAmount(orderItems);

    const zipcode = orderData.shipping_postal_code;

    if (!zipcode) {
      console.error("우편번호 정보가 없습니다.");
      return NextResponse.json(
        { error: "배송지 정보가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    // 서버에서 배송비 재계산
    const recalculatedShippingFee = await recalculateShippingFeeForValidation(
      productAmount,
      zipcode
    );

    // 쿠폰 할인 금액 (있다면)
    const couponDiscount = orderData.coupon_discount || 0;

    // 포인트 사용 금액 (있다면)
    const pointsUsed = orderData.points_used || 0;

    // 최종 금액 계산
    const expectedTotalAmount =
      productAmount + recalculatedShippingFee - couponDiscount - pointsUsed;

    // PG사에서 받은 결제 금액
    const paidAmount = paymentData.amount?.total || 0;

    // 금액 검증
    if (Math.abs(expectedTotalAmount - paidAmount) > 1) {
      // 1원 이하 오차 허용
      console.error("금액 불일치:", {
        expected: expectedTotalAmount,
        paid: paidAmount,
        productAmount,
        shippingFee: recalculatedShippingFee,
        couponDiscount,
        pointsUsed,
      });

      return NextResponse.json(
        {
          error: "결제 금액이 일치하지 않습니다. 다시 시도해주세요.",
          details: {
            expected: expectedTotalAmount,
            paid: paidAmount,
          },
        },
        { status: 400 }
      );
    }

    // 주문 상태 업데이트 (검증된 배송비 정보 포함)
    const { error: updateError, data } = await supabaseAdmin
      .from("orders")
      .update({
        status: "completed",
        payment_key: paymentData.id,
        shipping_fee: recalculatedShippingFee, // 검증된 배송비
        total_amount: paidAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", paymentId);

    if (updateError) {
      console.error("주문 상태 업데이트 실패:", updateError);
      return NextResponse.json(
        { error: "주문 상태 업데이트에 실패했습니다." },
        { status: 500 }
      );
    }

    // 주문 확인 알림톡 발송
    const phone = orderData.user_phone || orderData.shipping_phone;
    if (phone) {
      try {
        // 상품명 생성
        const firstProduct = orderItems[0].product_name;
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
      payment: paymentData,
      verification: {
        productAmount,
        shippingFee: recalculatedShippingFee,
        couponDiscount,
        pointsUsed,
        totalAmount: paidAmount,
      },
    });
  } catch (error) {
    console.error("결제 확인 처리 중 오류:", error);
    return NextResponse.json(
      { error: "결제 확인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
