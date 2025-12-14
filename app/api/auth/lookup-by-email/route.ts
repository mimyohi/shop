import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseServiceServer";
import { createOTP } from "@/lib/phone/otp";
import { sendOTP } from "@/lib/kakao/alimtalk";
import {
  checkOTPSendRateLimit,
  checkIPRateLimit,
  getClientIP,
} from "@/lib/ratelimit";

/**
 * POST /api/auth/lookup-by-email
 * 이메일로 사용자 조회 후 전화번호로 OTP 발송
 *
 * Request Body:
 * {
 *   "email": "user@example.com"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "phone": "+821012345678",
 *   "expiresIn": 300
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "이메일을 입력해주세요." },
        { status: 400 }
      );
    }

    // 이메일로 사용자 조회
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("user_id, email, phone, phone_verified")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: "해당 이메일로 가입된 계정이 없습니다." },
        { status: 404 }
      );
    }

    if (!userProfile.phone) {
      return NextResponse.json(
        { success: false, error: "등록된 전화번호가 없습니다. 고객센터에 문의해주세요." },
        { status: 400 }
      );
    }

    const e164Phone = userProfile.phone;

    // Rate Limiting - 전화번호당
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

    // Rate Limiting - IP당
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

    // 기존 미검증 OTP 삭제 (동일 전화번호)
    await supabase
      .from("phone_otps")
      .delete()
      .eq("phone", e164Phone)
      .eq("verified", false);

    // OTP 생성
    const { otp, hash, expiresAt } = await createOTP();

    // 개발 환경에서만 OTP 출력 (테스트용)
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] OTP for ${e164Phone}: ${otp}`);
    }

    // OTP 저장 (해시만 저장!)
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

    // 카카오톡 알림톡 발송
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

    // 성공 응답 (전화번호 포함)
    return NextResponse.json({
      success: true,
      phone: e164Phone,
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
