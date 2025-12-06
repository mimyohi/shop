import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabaseServiceServer';
import { validateAndFormatPhone } from '@/lib/phone/validation';

/**
 * POST /api/auth/reset-password
 * 전화번호 인증 후 비밀번호 재설정 API
 *
 * Request Body:
 * {
 *   "phone": "010-1234-5678",
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
    const body = await request.json();
    const { phone, verificationId, newPassword } = body;

    // 입력 검증
    if (!phone || !verificationId || !newPassword) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 길이 검증
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: '비밀번호는 최소 6자 이상이어야 합니다.' },
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

    // OTP 검증 확인
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

    // 전화번호로 사용자 조회
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, email')
      .eq('phone', e164Phone)
      .eq('phone_verified', true)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: '해당 전화번호로 가입된 계정이 없습니다.' },
        { status: 400 }
      );
    }

    // Service role 클라이언트로 비밀번호 업데이트
    const serviceClient = await createServiceClient();
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(
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
