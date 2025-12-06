/**
 * 배송비 계산 API
 * POST /api/shipping/calculate
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateShippingFee } from '@/lib/shipping/calculate-shipping-fee';
import { isValidZipcode } from '@/lib/shipping/zipcode-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderAmount, zipcode } = body;

    // 입력값 검증
    if (typeof orderAmount !== 'number' || orderAmount < 0) {
      return NextResponse.json(
        { error: '올바른 주문 금액을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!zipcode || !isValidZipcode(zipcode)) {
      return NextResponse.json(
        { error: '올바른 우편번호를 입력해주세요. (5자리 숫자)' },
        { status: 400 }
      );
    }

    // 배송비 계산
    const result = await calculateShippingFee({
      orderAmount,
      zipcode,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('배송비 계산 오류:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '배송비 계산 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// GET 요청으로 배송비 설정 조회
export async function GET() {
  try {
    const { getShippingSettings } = await import('@/lib/shipping/calculate-shipping-fee');
    const settings = await getShippingSettings();

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('배송비 설정 조회 오류:', error);

    return NextResponse.json(
      {
        error: '배송비 설정을 불러올 수 없습니다.',
      },
      { status: 500 }
    );
  }
}
