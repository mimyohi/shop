import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseServiceServer";
import { checkRateLimit, RateLimitPresets, getClientIP } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  try {
    // Rate Limiting - IP당
    const clientIP = getClientIP(request.headers);
    const ipRateLimit = checkRateLimit(clientIP, RateLimitPresets.EMAIL_CHECK_PER_IP);
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

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "이메일을 입력해주세요." },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "올바른 이메일 형식이 아닙니다." },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();
    const normalizedEmail = email.toLowerCase();

    // user_profiles 테이블에서 먼저 확인
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (profileError) {
      console.error("Profile check error:", profileError);
    }

    if (profile) {
      return NextResponse.json({
        success: true,
        exists: true,
        message: "이미 가입된 이메일입니다.",
      });
    }

    // auth.users에서도 확인 (프로필 생성 전일 수 있음)
    // 성능 개선: 전체 사용자 조회 대신 특정 이메일만 직접 쿼리
    const { data: authUser, error: authError } = await supabase
      .rpc("check_email_exists", { email_to_check: normalizedEmail });

    if (authError) {
      // RPC가 없으면 직접 쿼리 시도
      const { data: directCheck, error: directError } = await supabase
        .from("user_profiles")
        .select("id")
        .ilike("email", normalizedEmail)
        .limit(1);

      if (directError) {
        console.error("Auth check error:", directError);
        return NextResponse.json(
          { success: false, error: "서버 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요." },
          { status: 500 }
        );
      }

      if (directCheck && directCheck.length > 0) {
        return NextResponse.json({
          success: true,
          exists: true,
          message: "이미 가입된 이메일입니다.",
        });
      }
    } else if (authUser === true) {
      return NextResponse.json({
        success: true,
        exists: true,
        message: "이미 가입된 이메일입니다.",
      });
    }

    return NextResponse.json({
      success: true,
      exists: false,
      message: "사용 가능한 이메일입니다.",
    });
  } catch (error) {
    console.error("Check email error:", error);
    return NextResponse.json(
      { success: false, error: "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요." },
      { status: 500 }
    );
  }
}
