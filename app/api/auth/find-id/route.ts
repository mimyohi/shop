import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabaseServiceServer';
import { validateAndFormatPhone } from '@/lib/phone/validation';

/**
 * POST /api/auth/find-id
 * 전화번호로 가입된 아이디(이메일) 찾기 API
 *
 * Request Body:
 * {
 *   "phone": "010-1234-5678",
 *   "verificationId": "uuid" // OTP 검증 후 받은 ID
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "email": "abc***@example.com",
 *   "createdAt": "2024-01-01T00:00:00Z"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const body = await request.json();
    const { phone, verificationId } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: '전화번호를 입력해주세요.' },
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

    // OTP 검증 확인 (verificationId가 있는 경우)
    if (verificationId) {
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
    }

    // 전화번호로 사용자 조회 (여러 계정이 있을 수 있음)
    const { data: userProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, email, phone_verified, created_at')
      .eq('phone', e164Phone)
      .eq('phone_verified', true)
      .order('created_at', { ascending: false });

    if (profileError || !userProfiles || userProfiles.length === 0) {
      return NextResponse.json({
        success: true,
        email: null,
        message: '해당 전화번호로 가입된 계정이 없습니다.',
      });
    }

    // 여러 계정이 있는 경우 모두 반환
    if (userProfiles.length > 1) {
      return NextResponse.json({
        success: true,
        accounts: userProfiles.map((profile) => ({
          email: profile.email,
          createdAt: profile.created_at,
        })),
        message: `${userProfiles.length}개의 계정이 발견되었습니다.`,
      });
    }

    // 단일 계정인 경우
    return NextResponse.json({
      success: true,
      email: userProfiles[0].email,
      createdAt: userProfiles[0].created_at,
    });
  } catch (error) {
    console.error('Find ID error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
