/**
 * 배송비 계산 로직
 */

import { createClient } from '@/lib/supabaseClient';
import { getRegionInfo } from './zipcode-utils';

export interface ShippingFeeParams {
  orderAmount: number; // 주문 금액 (상품 금액 합계)
  zipcode: string; // 우편번호
}

export interface ShippingFeeResult {
  baseShippingFee: number; // 기본 배송비
  additionalFee: number; // 추가 배송비 (제주/도서산간)
  totalShippingFee: number; // 총 배송비
  isFreeShipping: boolean; // 무료배송 여부
  freeShippingThreshold: number; // 무료배송 기준 금액
  regionInfo: {
    isJeju: boolean;
    isMountain: boolean;
    regionName?: string;
  };
  message?: string; // 배송비 안내 메시지
}

/**
 * 배송비 계산 메인 함수
 */
export async function calculateShippingFee(
  params: ShippingFeeParams
): Promise<ShippingFeeResult> {
  const { orderAmount, zipcode } = params;

  const supabase = createClient();

  // 1. 배송비 설정 조회
  const { data: settings, error: settingsError } = await supabase
    .from('shipping_settings')
    .select('*')
    .eq('is_active', true)
    .single();

  if (settingsError || !settings) {
    throw new Error('배송비 설정을 불러올 수 없습니다.');
  }

  const {
    base_shipping_fee: baseShippingFee,
    free_shipping_threshold: freeShippingThreshold,
  } = settings;

  // 2. 지역 정보 조회
  const regionInfo = await getRegionInfo(zipcode);

  // 3. 무료배송 조건 확인
  const isFreeShipping = orderAmount >= freeShippingThreshold;

  // 4. 배송비 계산
  let totalShippingFee = 0;
  let additionalFee = 0;

  if (isFreeShipping) {
    // 무료배송이지만 제주/도서산간은 추가 배송비 발생
    totalShippingFee = regionInfo.additionalFee;
    additionalFee = regionInfo.additionalFee;
  } else {
    // 기본 배송비 + 추가 배송비
    totalShippingFee = baseShippingFee + regionInfo.additionalFee;
    additionalFee = regionInfo.additionalFee;
  }

  // 5. 메시지 생성
  let message = '';
  if (isFreeShipping && additionalFee === 0) {
    message = '무료배송';
  } else if (isFreeShipping && additionalFee > 0) {
    message = `무료배송 (${regionInfo.regionName} 추가 배송비 ${additionalFee.toLocaleString()}원)`;
  } else if (!isFreeShipping && additionalFee > 0) {
    const remaining = freeShippingThreshold - orderAmount;
    message = `${totalShippingFee.toLocaleString()}원 (${regionInfo.regionName} 추가 배송비 포함) - ${remaining.toLocaleString()}원 더 구매 시 기본 배송비 무료`;
  } else {
    const remaining = freeShippingThreshold - orderAmount;
    message = `${totalShippingFee.toLocaleString()}원 - ${remaining.toLocaleString()}원 더 구매 시 무료배송`;
  }

  return {
    baseShippingFee,
    additionalFee,
    totalShippingFee,
    isFreeShipping,
    freeShippingThreshold,
    regionInfo: {
      isJeju: regionInfo.isJeju,
      isMountain: regionInfo.isMountain,
      regionName: regionInfo.regionName,
    },
    message,
  };
}

/**
 * 서버 사이드에서 배송비 재계산 (결제 검증용)
 */
export async function recalculateShippingFeeForValidation(
  orderAmount: number,
  zipcode: string
): Promise<number> {
  const result = await calculateShippingFee({ orderAmount, zipcode });
  return result.totalShippingFee;
}

/**
 * 배송비 설정 조회
 */
export async function getShippingSettings() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('shipping_settings')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error) {
    throw new Error('배송비 설정을 불러올 수 없습니다.');
  }

  return data;
}
