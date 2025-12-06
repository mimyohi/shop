import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * OTP (One-Time Password) 생성 및 검증 유틸리티
 * 보안: OWASP 권장사항 준수
 */

// 설정값
const OTP_LENGTH = 6; // 6자리 OTP (1,000,000 조합)
const OTP_EXPIRY_MINUTES = 5; // 5분 만료
const MAX_ATTEMPTS = 3; // 최대 3회 시도
const BCRYPT_SALT_ROUNDS = 10; // bcrypt salt rounds

/**
 * 암호학적으로 안전한 6자리 OTP 생성
 * @returns 6자리 숫자 문자열
 */
export function generateOTP(): string {
  // crypto.randomInt를 사용하여 안전한 난수 생성
  // 100000 ~ 999999 범위
  const otp = randomInt(100000, 1000000);
  return otp.toString();
}

/**
 * OTP를 bcrypt로 해싱
 * @param otp 평문 OTP
 * @returns 해시된 OTP
 */
export async function hashOTP(otp: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  const hash = await bcrypt.hash(otp, salt);
  return hash;
}

/**
 * OTP 검증
 * @param otp 사용자가 입력한 OTP
 * @param hash 저장된 해시
 * @returns 일치 여부
 */
export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(otp, hash);
  } catch (error) {
    console.error('OTP verification error:', error);
    return false;
  }
}

/**
 * OTP 만료 시간 계산
 * @param minutes 분 단위 (기본값: 5분)
 * @returns Date 객체
 */
export function getOTPExpiry(minutes: number = OTP_EXPIRY_MINUTES): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
}

/**
 * OTP 만료 여부 확인
 * @param expiryDate 만료 시간
 * @returns 만료 여부
 */
export function isOTPExpired(expiryDate: Date | string): boolean {
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  return new Date() > expiry;
}

/**
 * 남은 시간 계산 (초 단위)
 * @param expiryDate 만료 시간
 * @returns 남은 초 (0 이하면 만료)
 */
export function getRemainingSeconds(expiryDate: Date | string): number {
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}

/**
 * OTP 형식 검증 (6자리 숫자)
 * @param otp 입력된 OTP
 * @returns 유효 여부
 */
export function isValidOTPFormat(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

/**
 * 최대 시도 횟수 초과 여부
 * @param attempts 현재 시도 횟수
 * @returns 초과 여부
 */
export function isMaxAttemptsExceeded(attempts: number): boolean {
  return attempts >= MAX_ATTEMPTS;
}

/**
 * OTP 생성 결과
 */
export interface OTPGenerationResult {
  otp: string; // 평문 OTP (SMS 발송용, 절대 저장 금지!)
  hash: string; // 해시된 OTP (DB 저장용)
  expiresAt: Date; // 만료 시간
}

/**
 * OTP 생성 및 해싱 (통합 함수)
 * @returns OTP 생성 결과
 */
export async function createOTP(): Promise<OTPGenerationResult> {
  const otp = generateOTP();
  const hash = await hashOTP(otp);
  const expiresAt = getOTPExpiry();

  return {
    otp, // 평문 OTP - SMS로 전송 후 즉시 삭제!
    hash, // 해시 - DB에 저장
    expiresAt, // 만료 시간
  };
}

/**
 * OTP 검증 결과
 */
export interface OTPVerificationResult {
  success: boolean;
  error?: string;
  remainingAttempts?: number;
}

/**
 * OTP 검증 (통합 함수)
 * @param inputOTP 사용자가 입력한 OTP
 * @param storedHash 저장된 해시
 * @param expiresAt 만료 시간
 * @param attempts 현재 시도 횟수
 * @returns 검증 결과
 */
export async function validateOTP(
  inputOTP: string,
  storedHash: string,
  expiresAt: Date | string,
  attempts: number
): Promise<OTPVerificationResult> {
  // 1. OTP 형식 검증
  if (!isValidOTPFormat(inputOTP)) {
    return {
      success: false,
      error: 'OTP는 6자리 숫자여야 합니다.',
    };
  }

  // 2. 최대 시도 횟수 확인
  if (isMaxAttemptsExceeded(attempts)) {
    return {
      success: false,
      error: '최대 시도 횟수를 초과했습니다. 새로운 인증번호를 요청해주세요.',
      remainingAttempts: 0,
    };
  }

  // 3. 만료 시간 확인
  if (isOTPExpired(expiresAt)) {
    return {
      success: false,
      error: '인증번호가 만료되었습니다. 새로운 인증번호를 요청해주세요.',
    };
  }

  // 4. OTP 검증
  const isValid = await verifyOTP(inputOTP, storedHash);

  if (!isValid) {
    const remainingAttempts = MAX_ATTEMPTS - attempts - 1;
    return {
      success: false,
      error:
        remainingAttempts > 0
          ? `인증번호가 일치하지 않습니다. (남은 시도: ${remainingAttempts}회)`
          : '인증번호가 일치하지 않습니다. 새로운 인증번호를 요청해주세요.',
      remainingAttempts,
    };
  }

  // 5. 검증 성공
  return {
    success: true,
  };
}

/**
 * 상수 export
 */
export const OTP_CONFIG = {
  LENGTH: OTP_LENGTH,
  EXPIRY_MINUTES: OTP_EXPIRY_MINUTES,
  MAX_ATTEMPTS,
  SALT_ROUNDS: BCRYPT_SALT_ROUNDS,
};
