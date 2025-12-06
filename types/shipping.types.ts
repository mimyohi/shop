/**
 * 배송 관련 TypeScript 타입 정의
 */

export interface ShippingSetting {
  id: string;
  base_shipping_fee: number; // 기본 배송비
  free_shipping_threshold: number; // 무료배송 기준 금액
  jeju_additional_fee: number; // 제주 추가 배송비
  mountain_additional_fee: number; // 도서산간 추가 배송비
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MountainZipcode {
  id: string;
  zipcode: string; // 5자리 우편번호
  region_name: string; // 지역명
  region_type: 'jeju' | 'mountain'; // 지역 타입
  additional_fee: number; // 추가 배송비
  created_at: string;
}

export interface RegionInfo {
  isJeju: boolean;
  isMountain: boolean;
  regionName?: string;
  additionalFee: number;
}

export interface ShippingFeeParams {
  orderAmount: number; // 주문 금액
  zipcode: string; // 우편번호
}

export interface ShippingFeeResult {
  baseShippingFee: number; // 기본 배송비
  additionalFee: number; // 추가 배송비
  totalShippingFee: number; // 총 배송비
  isFreeShipping: boolean; // 무료배송 여부
  freeShippingThreshold: number; // 무료배송 기준
  regionInfo: RegionInfo;
  message?: string; // 안내 메시지
}

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  zipcode: string;
  address: string;
  detailAddress: string;
}

// API 응답 타입
export interface ShippingFeeApiResponse {
  success: boolean;
  data?: ShippingFeeResult;
  error?: string;
}

export interface ShippingSettingsApiResponse {
  success: boolean;
  data?: ShippingSetting;
  error?: string;
}
