import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAuth } from '@/lib/supabaseAuth';
import { validateAndFormatPhone } from '@/lib/phone/validation';
import { validateOTP } from '@/lib/phone/otp';
import { checkOTPVerifyRateLimit } from '@/lib/ratelimit';

/**
 * POST /api/auth/phone/verify-otp
 * OTP 검증 및 로그인/회원가입 API
 *
 * Request Body:
 * {
 *   "phone": "010-1234-5678",
 *   "otp": "123456"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "isNewUser": false,
 *   "user": { ... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Request Body 파싱
    const body = await request.json();
    const { phone, otp, flow: rawFlow } = body;
    const flow: 'login' | 'signup' | 'find-id' | 'reset-password' =
      rawFlow === 'signup' ? 'signup' :
      rawFlow === 'find-id' ? 'find-id' :
      rawFlow === 'reset-password' ? 'reset-password' : 'login';

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: '전화번호와 인증번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 2. 전화번호 형식 검증 및 변환
    const phoneValidation = validateAndFormatPhone(phone);
    if (!phoneValidation.valid || !phoneValidation.e164) {
      return NextResponse.json(
        {
          success: false,
          error: phoneValidation.error || '올바른 전화번호 형식이 아닙니다.',
        },
        { status: 400 }
      );
    }

    const e164Phone = phoneValidation.e164;

    // 3. Rate Limiting - 검증 시도 제한
    const verifyRateLimit = checkOTPVerifyRateLimit(e164Phone);
    if (!verifyRateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: verifyRateLimit.error,
        },
        { status: 429 }
      );
    }

    // 4. 최근 OTP 조회
    const { data: otpRecords, error: otpError } = await supabase
      .from('phone_otps')
      .select('*')
      .eq('phone', e164Phone)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (otpError || !otpRecords || otpRecords.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '유효한 인증번호가 없습니다. 새로운 인증번호를 요청해주세요.',
        },
        { status: 400 }
      );
    }

    const otpRecord = otpRecords[0];

    // 5. OTP 검증
    const validationResult = await validateOTP(
      otp,
      otpRecord.otp_hash,
      otpRecord.expires_at,
      otpRecord.attempts
    );

    // 6. 검증 실패 시 시도 횟수 증가
    if (!validationResult.success) {
      await supabase
        .from('phone_otps')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);

      return NextResponse.json(
        {
          success: false,
          error: validationResult.error,
          remainingAttempts: validationResult.remainingAttempts,
        },
        { status: 400 }
      );
    }

    // 7. OTP 검증 완료 표시
    await supabase
      .from('phone_otps')
      .update({ verified: true })
      .eq('id', otpRecord.id);

    // 8. 사용자 확인 (전화번호로 조회)
    const { data: existingProfiles } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('phone', e164Phone)
      .eq('phone_verified', true)
      .limit(1);

    // 8-1. 회원가입 플로우라면 사용자 생성 대신 검증 토큰 반환
    if (flow === 'signup') {
      if (existingProfiles && existingProfiles.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: '이미 가입된 전화번호입니다. 다른 번호를 사용하거나 로그인해주세요.',
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        flow,
        verificationId: otpRecord.id,
        phone: e164Phone,
        expiresAt: otpRecord.expires_at,
        message: '전화번호 인증이 완료되었습니다.',
      });
    }

    // 8-2. 아이디 찾기 또는 비밀번호 재설정 플로우
    if (flow === 'find-id' || flow === 'reset-password') {
      return NextResponse.json({
        success: true,
        flow,
        verificationId: otpRecord.id,
        phone: e164Phone,
        expiresAt: otpRecord.expires_at,
        message: '전화번호 인증이 완료되었습니다.',
      });
    }

    let userId: string;
    let isNewUser = false;

    if (existingProfiles && existingProfiles.length > 0) {
      // 기존 사용자 로그인
      userId = existingProfiles[0].user_id;
      isNewUser = false;

      // 전화번호 검증 시간 업데이트
      await supabase
        .from('user_profiles')
        .update({ phone_verified_at: new Date().toISOString() })
        .eq('user_id', userId);
    } else {
      // 신규 사용자 회원가입
      isNewUser = true;

      // Supabase Auth에 사용자 생성 (이메일 없이)
      // 임시 이메일: phone@phone.local (실제로는 이메일 확인 불필요)
      const tempEmail = `${e164Phone.replace(/\+/g, '')}@phone.local`;
      const tempPassword = Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16); // 랜덤 비밀번호

      const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
        email: tempEmail,
        password: tempPassword,
        options: {
          data: {
            phone: e164Phone,
            phone_verified: true,
          },
        },
      });

      if (authError || !authData.user) {
        console.error('Failed to create auth user:', authError);
        return NextResponse.json(
          { success: false, error: '회원가입에 실패했습니다.' },
          { status: 500 }
        );
      }

      userId = authData.user.id;

      // user_profiles에 레코드 생성 (트리거로 자동 생성될 수도 있음)
      const { error: profileError } = await supabase.from('user_profiles').upsert({
        user_id: userId,
        email: tempEmail,
        phone: e164Phone,
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error('Failed to create user profile:', profileError);
        // 프로필 생성 실패해도 계속 진행 (트리거로 생성되었을 수 있음)
      }

      // 포인트 계정 생성
      await supabase.from('user_points').upsert({
        user_id: userId,
        points: 0,
        total_earned: 0,
        total_used: 0,
      });
    }

    // 9. 세션 생성 (supabase-js의 세션 관리 사용)
    // 클라이언트에서 처리하도록 user 정보만 반환

    // 10. 사용자 정보 조회
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // 11. 성공 응답
    return NextResponse.json({
      success: true,
      flow,
      isNewUser,
      user: userProfile,
      message: isNewUser ? '회원가입이 완료되었습니다.' : '로그인되었습니다.',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
