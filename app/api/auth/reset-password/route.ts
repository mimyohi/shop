import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabaseServiceServer';
import { validateAndFormatPhone } from '@/lib/phone/validation';

/**
 * POST /api/auth/reset-password
 * 이메일 + 전화번호 인증 후 비밀번호 재설정 API
 *
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "phone": "+821012345678",
 *   "verificationId": "uuid",
 *   "newPassword": "newPassword123"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "비밀번호가 성공적으로 변경되었습니다."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const body = await request.json();
    const { email, phone, verificationId, newPassword } = body;

    // 입력 검증
    if (!email || !phone || !verificationId || !newPassword) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 정책 검증 (최소 8자, 영문+숫자 조합)
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: '비밀번호는 최소 8자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 영문자 포함 검증
    if (!/[a-zA-Z]/.test(newPassword)) {
      return NextResponse.json(
        { success: false, error: '비밀번호에 영문자가 포함되어야 합니다.' },
        { status: 400 }
      );
    }

    // 숫자 포함 검증
    if (!/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { success: false, error: '비밀번호에 숫자가 포함되어야 합니다.' },
        { status: 400 }
      );
    }

    // 전화번호 형식 검증 및 변환
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

    // OTP 검증 확인 (service client 사용)
    const { data: otpRecord, error: otpError } = await supabase
      .from('phone_otps')
      .select('*')
      .eq('id', verificationId)
      .eq('phone', e164Phone)
      .eq('verified', true)
      .single();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { success: false, error: '전화번호 인증이 필요합니다.' },
        { status: 400 }
      );
    }

    // 만료 시간 확인 (인증 후 10분 이내만 유효)
    const expiresAt = new Date(otpRecord.expires_at);
    const tenMinutesAfterExpiry = new Date(expiresAt.getTime() + 10 * 60 * 1000);
    if (new Date() > tenMinutesAfterExpiry) {
      return NextResponse.json(
        { success: false, error: '인증이 만료되었습니다. 다시 시도해주세요.' },
        { status: 400 }
      );
    }

    // 이메일로 사용자 조회 (service client 사용으로 RLS 우회)
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, email, phone')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: '해당 이메일로 가입된 계정이 없습니다.' },
        { status: 400 }
      );
    }

    // 이메일에 등록된 전화번호와 인증된 전화번호 일치 확인
    if (userProfile.phone !== e164Phone) {
      return NextResponse.json(
        { success: false, error: '인증된 전화번호와 계정의 전화번호가 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // Service role 클라이언트로 비밀번호 업데이트
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userProfile.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json(
        { success: false, error: '비밀번호 변경에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 사용된 OTP 레코드 삭제 (보안)
    await supabase
      .from('phone_otps')
      .delete()
      .eq('id', verificationId);

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
