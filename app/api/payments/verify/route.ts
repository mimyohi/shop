import { NextRequest, NextResponse } from "next/server";
import { PortOneClient, PortOneError } from "@portone/server-sdk";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabaseServer";
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

    // 사용자 인증 확인 (로그인한 경우 권한 검사)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    console.log("결제 확인 요청 - paymentId:", paymentId, "user:", user?.id);

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

    // 결제 상태 확인 (카드: PAID, 가상계좌: VIRTUAL_ACCOUNT_ISSUED)
    const isCardPaid = paymentData.status === "PAID";
    const isVirtualAccountIssued = paymentData.status === "VIRTUAL_ACCOUNT_ISSUED";

    if (!isCardPaid && !isVirtualAccountIssued) {
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

    // 권한 검사: 로그인한 사용자의 경우 본인 주문인지 확인
    if (user && orderData.user_id && orderData.user_id !== user.id) {
      console.error("권한 없음: 다른 사용자의 주문", {
        userId: user.id,
        orderUserId: orderData.user_id,
      });
      return NextResponse.json(
        { error: "이 주문에 대한 권한이 없습니다." },
        { status: 403 }
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

    // 쿠폰 할인 금액 서버 검증
    let couponDiscount = 0;
    if (orderData.user_coupon_id) {
      const { data: userCoupon } = await supabaseAdmin
        .from("user_coupons")
        .select("*, coupon:coupons(*)")
        .eq("id", orderData.user_coupon_id)
        .single();

      if (userCoupon && !userCoupon.is_used) {
        const coupon = userCoupon.coupon;
        // 쿠폰 유효성 검사
        const now = new Date();
        const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

        if (coupon.is_active &&
            (!validFrom || now >= validFrom) &&
            (!validUntil || now <= validUntil) &&
            productAmount >= (coupon.min_purchase || 0)) {
          if (coupon.discount_type === "percentage") {
            couponDiscount = Math.floor(productAmount * (coupon.discount_value / 100));
            if (coupon.max_discount) {
              couponDiscount = Math.min(couponDiscount, coupon.max_discount);
            }
          } else {
            couponDiscount = coupon.discount_value;
          }
        }
      }

      // DB에 저장된 할인 금액과 서버 계산 금액 비교
      if (Math.abs(couponDiscount - (orderData.coupon_discount || 0)) > 1) {
        console.error("쿠폰 할인 금액 불일치:", {
          serverCalculated: couponDiscount,
          stored: orderData.coupon_discount,
        });
        return NextResponse.json(
          { error: "쿠폰 할인 금액이 올바르지 않습니다." },
          { status: 400 }
        );
      }
    }

    // 포인트 사용 금액 서버 검증
    let pointsUsed = orderData.used_points || 0;
    if (pointsUsed > 0 && orderData.user_id) {
      const { data: userPoints } = await supabaseAdmin
        .from("user_points")
        .select("points")
        .eq("user_id", orderData.user_id)
        .single();

      if (!userPoints || userPoints.points < pointsUsed) {
        console.error("포인트 사용 불가:", {
          requested: pointsUsed,
          available: userPoints?.points || 0,
        });
        return NextResponse.json(
          { error: "사용 가능한 포인트가 부족합니다." },
          { status: 400 }
        );
      }
    }

    // 최종 금액 계산
    const expectedTotalAmount =
      productAmount + recalculatedShippingFee - couponDiscount - pointsUsed;

    // PG사에서 받은 결제 금액
    const paidAmount = (paymentData as any).amount?.total || 0;

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
    // 가상계좌인 경우 가상계좌 정보 저장
    let updateData: Record<string, unknown> = {
      payment_key: (paymentData as any).id,
      shipping_fee: recalculatedShippingFee, // 검증된 배송비
      total_amount: paidAmount,
      updated_at: new Date().toISOString(),
    };

    if (isVirtualAccountIssued) {
      // 가상계좌 발급 상태 - 입금 대기
      // PortOne V2: 가상계좌 정보는 method 객체에 직접 있음
      const method = (paymentData as any).method;
      console.log("PortOne method 데이터:", JSON.stringify(method, null, 2));

      // 은행 코드를 한글 이름으로 변환
      const bankCodeToName: Record<string, string> = {
        "NONGHYUP": "NH농협은행",
        "KOOKMIN": "KB국민은행",
        "SHINHAN": "신한은행",
        "WOORI": "우리은행",
        "HANA": "하나은행",
        "IBK": "IBK기업은행",
        "SC": "SC제일은행",
        "CITI": "한국씨티은행",
        "KAKAOBANK": "카카오뱅크",
        "KBANK": "케이뱅크",
        "TOSSBANK": "토스뱅크",
        "BUSAN": "부산은행",
        "DAEGU": "대구은행",
        "GWANGJU": "광주은행",
        "JEONBUK": "전북은행",
        "JEJU": "제주은행",
        "KYONGNAM": "경남은행",
        "SUHYUP": "수협은행",
        "SAEMAUL": "새마을금고",
        "SHINHYUP": "신협",
        "POST": "우체국",
        "KDB": "KDB산업은행",
      };

      const bankName = bankCodeToName[method?.bank] || method?.bank || null;

      updateData = {
        ...updateData,
        status: "payment_pending",
        payment_method: "VIRTUAL_ACCOUNT",
        virtual_account_bank: bankName,
        virtual_account_number: method?.accountNumber || null,
        virtual_account_holder: method?.remitterName || null,
        virtual_account_due_date: method?.expiredAt || null,
      };

      console.log("가상계좌 DB 저장 데이터:", {
        bank: updateData.virtual_account_bank,
        number: updateData.virtual_account_number,
        holder: updateData.virtual_account_holder,
        dueDate: updateData.virtual_account_due_date,
      });
    } else {
      // 카드 또는 실시간 계좌이체 결제 완료
      const method = (paymentData as any).method;
      const methodType = method?.type;

      // PortOne에서 결제 수단 타입 확인
      // Transfer: 실시간 계좌이체
      // Card: 카드 결제
      const isTransfer = methodType === "PaymentMethodTransfer" ||
                         methodType === "Transfer" ||
                         orderData.payment_method === "TRANSFER";

      updateData = {
        ...updateData,
        status: "completed",
        payment_method: isTransfer ? "TRANSFER" : "CARD",
      };

      console.log("결제 완료 - method type:", methodType, "payment_method:", updateData.payment_method);
    }

    // 동시성 제어: 아직 처리되지 않은 주문만 업데이트 (중복 결제 방지)
    const allowedStatuses = isVirtualAccountIssued
      ? ["pending"] // 가상계좌: pending -> payment_pending
      : ["pending", "payment_pending"]; // 카드/계좌이체: pending 또는 payment_pending -> completed

    const { error: updateError, data: updatedRows } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("order_id", paymentId)
      .in("status", allowedStatuses)
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
        alreadyProcessed: true,
      });
    }

    // 포인트 차감 (결제 완료 시에만, 가상계좌는 입금 완료 웹훅에서 처리)
    console.log("포인트 차감 조건 확인:", {
      isCardPaid,
      pointsUsed,
      userId: orderData.user_id,
      shouldDeduct: isCardPaid && pointsUsed > 0 && orderData.user_id,
    });

    if (isCardPaid && pointsUsed > 0 && orderData.user_id) {
      try {
        // 1. 포인트 히스토리 추가
        console.log("포인트 히스토리 추가 시도:", {
          user_id: orderData.user_id,
          points: -pointsUsed,
          order_id: orderData.id,
        });
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
            console.log("포인트 차감 완료:", {
              userId: orderData.user_id,
              used: pointsUsed,
              remaining: currentPoints.points - pointsUsed,
            });
          }
        }
      } catch (pointsError) {
        // 포인트 차감 실패해도 결제는 성공으로 처리 (관리자가 수동 처리 필요)
        console.error("포인트 처리 중 오류:", pointsError);
      }
    }

    // 쿠폰 사용 처리 (결제 완료 시에만, 가상계좌는 입금 완료 웹훅에서 처리)
    console.log("쿠폰 사용 처리 조건 확인:", {
      isCardPaid,
      userCouponId: orderData.user_coupon_id,
      shouldProcess: isCardPaid && orderData.user_coupon_id,
    });

    if (isCardPaid && orderData.user_coupon_id) {
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
          console.log("쿠폰 사용 처리 완료:", orderData.user_coupon_id);
        }
      } catch (couponError) {
        console.error("쿠폰 처리 중 오류:", couponError);
      }
    }

    // 현금영수증 발급 (신청한 경우) - 카드 결제 완료 시에만 발급
    // 가상계좌의 경우 입금 완료 웹훅에서 발급
    if (isCardPaid && orderData.cash_receipt_type && orderData.cash_receipt_number) {
      try {
        console.log("현금영수증 발급 요청:", {
          type: orderData.cash_receipt_type,
          number: orderData.cash_receipt_number,
        });

        // 상품명 생성 (현금영수증용)
        const firstProductName = orderItems[0].product_name;
        const cashReceiptOrderName =
          orderItems.length > 1
            ? `${firstProductName} 외 ${orderItems.length - 1}건`
            : firstProductName;

        const cashReceiptResult = await portone.payment.cashReceipt.issueCashReceipt({
          paymentId,
          channelKey: env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY,
          type: orderData.cash_receipt_type as "PERSONAL" | "CORPORATE",
          orderName: cashReceiptOrderName,
          currency: "KRW",
          amount: {
            total: paidAmount,
          },
          customer: {
            identityNumber: orderData.cash_receipt_number,
            name: orderData.user_name || orderData.shipping_name,
            phoneNumber: orderData.user_phone || orderData.shipping_phone,
            email: orderData.user_email,
          },
        });

        console.log("현금영수증 발급 성공:", cashReceiptResult);

        // 현금영수증 발급 정보 업데이트
        await supabaseAdmin
          .from("orders")
          .update({
            cash_receipt_issued: true,
            cash_receipt_issue_number: cashReceiptResult.cashReceipt?.issueNumber || null,
            cash_receipt_issued_at: new Date().toISOString(),
          })
          .eq("order_id", paymentId);
      } catch (cashReceiptError) {
        // 현금영수증 발급 실패해도 결제는 성공으로 처리
        console.error("현금영수증 발급 실패:", cashReceiptError);
        // 실패 사유 기록 (관리자 확인용)
        await supabaseAdmin
          .from("orders")
          .update({
            cash_receipt_issued: false,
            admin_memo: `현금영수증 발급 실패: ${cashReceiptError instanceof Error ? cashReceiptError.message : "알 수 없는 오류"}`,
          })
          .eq("order_id", paymentId);
      }
    }

    // 주문 확인 알림톡 발송 - 카드 결제 완료 시에만 발송
    // 가상계좌의 경우 입금 완료 웹훅에서 발송
    const phone = orderData.user_phone || orderData.shipping_phone;
    if (isCardPaid && phone) {
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

    // 가상계좌 정보 추가
    let virtualAccountInfo = null;
    if (isVirtualAccountIssued) {
      const method = (paymentData as any).method;

      // 은행 코드를 한글 이름으로 변환
      const bankCodeToName: Record<string, string> = {
        "NONGHYUP": "NH농협은행",
        "KOOKMIN": "KB국민은행",
        "SHINHAN": "신한은행",
        "WOORI": "우리은행",
        "HANA": "하나은행",
        "IBK": "IBK기업은행",
        "SC": "SC제일은행",
        "CITI": "한국씨티은행",
        "KAKAOBANK": "카카오뱅크",
        "KBANK": "케이뱅크",
        "TOSSBANK": "토스뱅크",
        "BUSAN": "부산은행",
        "DAEGU": "대구은행",
        "GWANGJU": "광주은행",
        "JEONBUK": "전북은행",
        "JEJU": "제주은행",
        "KYONGNAM": "경남은행",
        "SUHYUP": "수협은행",
        "SAEMAUL": "새마을금고",
        "SHINHYUP": "신협",
        "POST": "우체국",
        "KDB": "KDB산업은행",
      };

      virtualAccountInfo = {
        bank: bankCodeToName[method?.bank] || method?.bank || "",
        accountNumber: method?.accountNumber || "",
        holder: method?.remitterName || "",
        dueDate: method?.expiredAt || "",
      };

      console.log("가상계좌 응답 데이터:", virtualAccountInfo);
    }

    // 결제 방법 결정
    let responsePaymentMethod = "CARD";
    if (isVirtualAccountIssued) {
      responsePaymentMethod = "VIRTUAL_ACCOUNT";
    } else {
      const method = (paymentData as any).method;
      const methodType = method?.type;
      if (methodType === "PaymentMethodTransfer" ||
          methodType === "Transfer" ||
          orderData.payment_method === "TRANSFER") {
        responsePaymentMethod = "TRANSFER";
      }
    }

    return NextResponse.json({
      success: true,
      payment: paymentData,
      paymentMethod: responsePaymentMethod,
      virtualAccount: virtualAccountInfo,
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
