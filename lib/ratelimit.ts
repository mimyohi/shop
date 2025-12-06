/**
 * Rate Limiting 유틸리티
 * 인메모리 방식 (개발/소규모 프로덕션)
 *
 * 프로덕션 대규모 서비스에서는:
 * - Upstash Redis (@upstash/ratelimit) 사용 권장
 * - 또는 Redis/Memcached 사용
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp (ms)
}

// 인메모리 저장소
const store = new Map<string, RateLimitEntry>();

// 정리 간격 (10분마다 만료된 항목 제거)
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

// 주기적 정리
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

/**
 * Rate limit 설정
 */
export interface RateLimitConfig {
  /**
   * 허용된 최대 요청 수
   */
  maxRequests: number;

  /**
   * 시간 창 (밀리초)
   */
  windowMs: number;

  /**
   * 키 프리픽스 (식별용)
   */
  prefix?: string;
}

/**
 * Rate limit 결과
 */
export interface RateLimitResult {
  /**
   * 허용 여부
   */
  allowed: boolean;

  /**
   * 남은 요청 수
   */
  remaining: number;

  /**
   * 리셋되는 시간 (Unix timestamp, ms)
   */
  resetAt: number;

  /**
   * 제한 초과 시 에러 메시지
   */
  error?: string;
}

/**
 * Rate limit 체크
 * @param identifier 식별자 (IP, 전화번호 등)
 * @param config Rate limit 설정
 * @returns Rate limit 결과
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = config.prefix ? `${config.prefix}:${identifier}` : identifier;

  // 기존 항목 조회
  const existing = store.get(key);

  if (existing) {
    // 시간 창이 지났으면 리셋
    if (existing.resetAt < now) {
      store.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: now + config.windowMs,
      };
    }

    // 제한 초과
    if (existing.count >= config.maxRequests) {
      const resetIn = Math.ceil((existing.resetAt - now) / 1000); // 초 단위
      return {
        allowed: false,
        remaining: 0,
        resetAt: existing.resetAt,
        error: `너무 많은 요청입니다. ${resetIn}초 후에 다시 시도해주세요.`,
      };
    }

    // 카운트 증가
    existing.count += 1;
    store.set(key, existing);

    return {
      allowed: true,
      remaining: config.maxRequests - existing.count,
      resetAt: existing.resetAt,
    };
  }

  // 첫 요청
  store.set(key, {
    count: 1,
    resetAt: now + config.windowMs,
  });

  return {
    allowed: true,
    remaining: config.maxRequests - 1,
    resetAt: now + config.windowMs,
  };
}

/**
 * 사전 정의된 Rate limit 프리셋
 */
export const RateLimitPresets = {
  /**
   * OTP 발송: 전화번호당 30분에 3회
   */
  OTP_SEND_PER_PHONE: {
    maxRequests: 3,
    windowMs: 30 * 60 * 1000, // 30분
    prefix: 'otp:send:phone',
  } as RateLimitConfig,

  /**
   * OTP 발송: IP당 1시간에 10회
   */
  OTP_SEND_PER_IP: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1시간
    prefix: 'otp:send:ip',
  } as RateLimitConfig,

  /**
   * OTP 검증: 전화번호당 5분에 5회
   */
  OTP_VERIFY_PER_PHONE: {
    maxRequests: 5,
    windowMs: 5 * 60 * 1000, // 5분
    prefix: 'otp:verify:phone',
  } as RateLimitConfig,

  /**
   * 로그인: IP당 15분에 5회
   */
  LOGIN_PER_IP: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15분
    prefix: 'login:ip',
  } as RateLimitConfig,
};

/**
 * 전화번호 OTP 발송 제한 확인
 * @param phone 전화번호
 * @returns Rate limit 결과
 */
export function checkOTPSendRateLimit(phone: string): RateLimitResult {
  return checkRateLimit(phone, RateLimitPresets.OTP_SEND_PER_PHONE);
}

/**
 * IP 기반 OTP 발송 제한 확인
 * @param ip IP 주소
 * @returns Rate limit 결과
 */
export function checkIPRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(ip, RateLimitPresets.OTP_SEND_PER_IP);
}

/**
 * OTP 검증 제한 확인
 * @param phone 전화번호
 * @returns Rate limit 결과
 */
export function checkOTPVerifyRateLimit(phone: string): RateLimitResult {
  return checkRateLimit(phone, RateLimitPresets.OTP_VERIFY_PER_PHONE);
}

/**
 * 특정 키의 rate limit 리셋 (테스트용)
 * @param identifier 식별자
 * @param prefix 프리픽스
 */
export function resetRateLimit(identifier: string, prefix?: string): void {
  const key = prefix ? `${prefix}:${identifier}` : identifier;
  store.delete(key);
}

/**
 * 모든 rate limit 데이터 삭제 (테스트용)
 */
export function clearAllRateLimits(): void {
  store.clear();
}

/**
 * IP 주소 추출 헬퍼 (Next.js API Routes용)
 * @param headers Request headers
 * @returns IP 주소
 */
export function getClientIP(headers: Headers): string {
  // X-Forwarded-For (프록시/로드 밸런서)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // X-Real-IP
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // CF-Connecting-IP (Cloudflare)
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp;
  }

  // 기본값
  return 'unknown';
}
