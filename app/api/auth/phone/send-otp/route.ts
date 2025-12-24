import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseServiceServer";
import { validateAndFormatPhone } from "@/lib/phone/validation";
import { createOTP } from "@/lib/phone/otp";
import { sendOTP } from "@/lib/kakao/alimtalk";
import {
  checkOTPSendRateLimit,
  checkIPRateLimit,
  getClientIP,
} from "@/lib/ratelimit";

/**
 * POST /api/auth/phone/send-otp
 * OTP 발송 API
 *
 * Request Body:
 * {
 *   "phone": "010-1234-5678"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "expiresIn": 300 // 초 단위
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();

    // 1. Request Body 파싱
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "전화번호를 입력해주세요." },
        { status: 400 }
      );
    }

    // 2. 전화번호 형식 검증 및 변환
    const phoneValidation = validateAndFormatPhone(phone);
    if (!phoneValidation.valid || !phoneValidation.e164) {
      return NextResponse.json(
        {
          success: false,
          error: phoneValidation.error || "올바른 전화번호 형식이 아닙니다.",
        },
        { status: 400 }
      );
    }

    const e164Phone = phoneValidation.e164;

    // 3. Rate Limiting - 전화번호당
    const phoneRateLimit = checkOTPSendRateLimit(e164Phone);
    if (!phoneRateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: phoneRateLimit.error,
          resetAt: phoneRateLimit.resetAt,
        },
        { status: 429 }
      );
    }

    // 4. Rate Limiting - IP당
    const clientIP = getClientIP(request.headers);
    const ipRateLimit = checkIPRateLimit(clientIP);
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: ipRateLimit.error,
          resetAt: ipRateLimit.resetAt,
        },
        { status: 429 }
      );
    }

    // 5. 기존 미검증 OTP 삭제 (동일 전화번호)
    await supabase
      .from("phone_otps")
      .delete()
      .eq("phone", e164Phone)
      .eq("verified", false);

    // 6. OTP 생성
    const { otp, hash, expiresAt } = await createOTP();

    // 개발 환경에서만 OTP 출력 (테스트용)
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] OTP for ${e164Phone}: ${otp}`);
    }

    // 7. OTP 저장 (해시만 저장!)
    const { error: dbError } = await supabase.from("phone_otps").insert({
      phone: e164Phone,
      otp_hash: hash,
      attempts: 0,
      verified: false,
      expires_at: expiresAt.toISOString(),
    });

    if (dbError) {
      console.error("Failed to save OTP:", dbError);
      return NextResponse.json(
        { success: false, error: "OTP 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    // 8. 카카오톡 알림톡 발송
    const alimtalkResult = await sendOTP(e164Phone, otp);

    if (!alimtalkResult.success) {
      // 알림톡 발송 실패 시 DB에서 OTP 삭제
      await supabase
        .from("phone_otps")
        .delete()
        .eq("phone", e164Phone)
        .eq("verified", false);

      return NextResponse.json(
        {
          success: false,
          error: alimtalkResult.error || "알림톡 발송에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    // 9. 성공 응답 (OTP는 절대 포함하지 않음!)
    return NextResponse.json({
      success: true,
      expiresIn: 300, // 5분 = 300초
      message: "인증번호가 발송되었습니다.",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
