import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

/**
 * 한국 전화번호 형식 검증 및 변환 유틸리티
 */

// 한국 전화번호 정규식 (010-XXXX-XXXX, 010XXXXXXXX, 01XXXXXXXXX)
const KOREAN_PHONE_REGEX = /^(01[0-9])-?([0-9]{3,4})-?([0-9]{4})$/;

/**
 * 한국 전화번호 형식 검증
 * @param phone 전화번호 (010-1234-5678, 01012345678 등)
 * @returns boolean
 */
export function isValidKoreanPhone(phone: string): boolean {
  if (!phone) return false;

  // 공백 제거
  const cleanPhone = phone.trim().replace(/\s/g, '');

  // 정규식 검증
  return KOREAN_PHONE_REGEX.test(cleanPhone);
}

/**
 * 전화번호를 E.164 형식으로 변환 (+821012345678)
 * @param phone 전화번호 (010-1234-5678, 01012345678 등)
 * @param countryCode 국가 코드 (기본값: KR)
 * @returns E.164 형식 전화번호 또는 null
 */
export function toE164(phone: string, countryCode: CountryCode = 'KR'): string | null {
  try {
    // 공백 및 하이픈 제거
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');

    // 이미 +로 시작하는 경우 (국제 번호)
    if (cleanPhone.startsWith('+')) {
      const parsed = parsePhoneNumber(cleanPhone);
      return parsed?.number || null;
    }

    // 한국 번호 형식 검증
    if (!isValidKoreanPhone(cleanPhone)) {
      return null;
    }

    // 0으로 시작하는 경우 제거 (010 -> 10)
    const numberWithoutLeadingZero = cleanPhone.startsWith('0')
      ? cleanPhone.substring(1)
      : cleanPhone;

    // +82 추가
    const e164 = `+82${numberWithoutLeadingZero}`;

    // libphonenumber-js로 최종 검증
    if (isValidPhoneNumber(e164, countryCode)) {
      return e164;
    }

    return null;
  } catch (error) {
    console.error('Error converting to E.164:', error);
    return null;
  }
}

/**
 * E.164 형식을 한국 형식으로 변환 (+821012345678 -> 010-1234-5678)
 * @param e164 E.164 형식 전화번호
 * @returns 한국 형식 전화번호 (010-1234-5678)
 */
export function toKoreanFormat(e164: string): string | null {
  try {
    const parsed = parsePhoneNumber(e164);
    if (!parsed) return null;

    // 한국 번호가 아니면 원본 반환
    if (parsed.country !== 'KR') {
      return parsed.formatInternational();
    }

    // +821012345678 -> 01012345678
    const nationalNumber = parsed.nationalNumber;

    // 010-1234-5678 형식으로 변환
    if (nationalNumber.length === 10) {
      return `${nationalNumber.slice(0, 3)}-${nationalNumber.slice(3, 7)}-${nationalNumber.slice(7)}`;
    } else if (nationalNumber.length === 11) {
      return `${nationalNumber.slice(0, 3)}-${nationalNumber.slice(3, 7)}-${nationalNumber.slice(7)}`;
    }

    return nationalNumber;
  } catch (error) {
    console.error('Error converting to Korean format:', error);
    return null;
  }
}

/**
 * 전화번호 형식화 (자동으로 하이픈 추가)
 * @param phone 입력 중인 전화번호
 * @returns 형식화된 전화번호
 */
export function formatPhoneInput(phone: string): string {
  // 숫자만 추출
  const numbers = phone.replace(/\D/g, '');

  // 최대 11자리까지만
  const truncated = numbers.slice(0, 11);

  // 형식 적용
  if (truncated.length <= 3) {
    return truncated;
  } else if (truncated.length <= 7) {
    return `${truncated.slice(0, 3)}-${truncated.slice(3)}`;
  } else {
    return `${truncated.slice(0, 3)}-${truncated.slice(3, 7)}-${truncated.slice(7)}`;
  }
}

/**
 * 전화번호 마스킹 (개인정보 보호)
 * @param phone 전화번호
 * @returns 마스킹된 전화번호 (010-****-5678)
 */
export function maskPhone(phone: string): string {
  try {
    const e164 = toE164(phone);
    if (!e164) return phone;

    const korean = toKoreanFormat(e164);
    if (!korean) return phone;

    // 010-1234-5678 -> 010-****-5678
    const parts = korean.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-****-${parts[2]}`;
    }

    return phone;
  } catch (error) {
    return phone;
  }
}

/**
 * 전화번호 검증 및 변환 (통합 함수)
 * @param phone 전화번호
 * @returns { valid: boolean, e164: string | null, korean: string | null, error?: string }
 */
export function validateAndFormatPhone(phone: string): {
  valid: boolean;
  e164: string | null;
  korean: string | null;
  error?: string;
} {
  if (!phone || phone.trim().length === 0) {
    return {
      valid: false,
      e164: null,
      korean: null,
      error: '전화번호를 입력해주세요.',
    };
  }

  const e164 = toE164(phone);

  if (!e164) {
    return {
      valid: false,
      e164: null,
      korean: null,
      error: '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)',
    };
  }

  const korean = toKoreanFormat(e164);

  return {
    valid: true,
    e164,
    korean,
  };
}
