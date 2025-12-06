/**
 * 우편번호 기반 지역 판별 유틸리티
 */

import { createClient } from '@/lib/supabaseClient';

export interface RegionInfo {
  isJeju: boolean;
  isMountain: boolean;
  regionName?: string;
  additionalFee: number;
}

/**
 * 제주 지역 판별 (우편번호 기준)
 * 제주 우편번호: 63000-63644
 */
export function isJejuByZipcode(zipcode: string): boolean {
  if (!zipcode || zipcode.length !== 5) return false;

  const code = parseInt(zipcode);
  return code >= 63000 && code <= 63644;
}

/**
 * 도서산간 지역 여부 및 추가 배송비 조회 (DB 기반)
 */
export async function getRegionInfo(zipcode: string): Promise<RegionInfo> {
  if (!zipcode || zipcode.length !== 5) {
    return {
      isJeju: false,
      isMountain: false,
      additionalFee: 0,
    };
  }

  const supabase = createClient();

  // DB에서 우편번호 조회
  const { data: mountainData } = await supabase
    .from('mountain_zipcodes')
    .select('region_name, region_type, additional_fee')
    .eq('zipcode', zipcode)
    .single();

  if (mountainData) {
    return {
      isJeju: mountainData.region_type === 'jeju',
      isMountain: mountainData.region_type === 'mountain',
      regionName: mountainData.region_name,
      additionalFee: mountainData.additional_fee,
    };
  }

  // DB에 없으면 우편번호 범위로 제주 체크
  const isJeju = isJejuByZipcode(zipcode);

  if (isJeju) {
    // 기본 제주 추가 배송비 조회
    const { data: settings } = await supabase
      .from('shipping_settings')
      .select('jeju_additional_fee')
      .eq('is_active', true)
      .single();

    return {
      isJeju: true,
      isMountain: false,
      regionName: '제주',
      additionalFee: settings?.jeju_additional_fee || 3000,
    };
  }

  return {
    isJeju: false,
    isMountain: false,
    additionalFee: 0,
  };
}

/**
 * 클라이언트 사이드용 간단한 제주 체크 (서버 호출 없이)
 */
export function isJejuQuickCheck(zipcode: string): boolean {
  return isJejuByZipcode(zipcode);
}

/**
 * 우편번호 유효성 검사
 */
export function isValidZipcode(zipcode: string): boolean {
  if (!zipcode) return false;

  // 5자리 숫자만 허용
  const zipcodeRegex = /^\d{5}$/;
  return zipcodeRegex.test(zipcode);
}

/**
 * 우편번호 포맷팅 (xxxxx -> xxxxx 또는 xxx-xxx 형식 지원)
 */
export function formatZipcode(zipcode: string): string {
  // 숫자만 추출
  const numbers = zipcode.replace(/\D/g, '');

  // 5자리로 제한
  return numbers.slice(0, 5);
}
