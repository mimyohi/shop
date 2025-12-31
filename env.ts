// 클라이언트 환경변수 (NEXT_PUBLIC_ 접두사)
export const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const NEXT_PUBLIC_PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID!;
export const NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD!;
export const NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TRANSFER = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TRANSFER!;
export const NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY = process.env.NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY!;

// 서버 전용 환경변수 (클라이언트에서는 undefined)
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET!;
export const PORTONE_WEBHOOK_SECRET = process.env.PORTONE_WEBHOOK_SECRET;
export const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY!;
export const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET!;

// 카카오 알림톡 (선택적 - 설정 안하면 알림톡 비활성화)
export const KAKAO_PF_ID = process.env.KAKAO_PF_ID;
export const KAKAO_TEMPLATE_OTP = process.env.KAKAO_TEMPLATE_OTP;
export const KAKAO_TEMPLATE_ORDER_CONFIRM = process.env.KAKAO_TEMPLATE_ORDER_CONFIRM;

export const NODE_ENV = process.env.NODE_ENV ?? "development";

// 서버 사이드 환경변수 검증 함수 (API 라우트에서 호출)
export function validateServerEnv() {
  const required = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "PORTONE_API_SECRET",
    "SOLAPI_API_KEY",
    "SOLAPI_API_SECRET",
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`필수 서버 환경변수가 설정되지 않았습니다: ${missing.join(", ")}`);
  }
}

type Env = {
  readonly NEXT_PUBLIC_SUPABASE_URL: string;
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly NEXT_PUBLIC_PORTONE_STORE_ID: string;
  readonly NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD: string;
  readonly NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TRANSFER: string;
  readonly PORTONE_API_SECRET: string;
  readonly PORTONE_WEBHOOK_SECRET?: string;
  readonly SOLAPI_API_KEY: string;
  readonly SOLAPI_API_SECRET: string;
  readonly KAKAO_PF_ID?: string;
  readonly KAKAO_TEMPLATE_OTP?: string;
  readonly KAKAO_TEMPLATE_ORDER_CONFIRM?: string;
  readonly NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY: string;
  readonly NODE_ENV: string;
};

export const env: Env = {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_PORTONE_STORE_ID,
  NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD,
  NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TRANSFER,
  PORTONE_API_SECRET,
  PORTONE_WEBHOOK_SECRET,
  SOLAPI_API_KEY,
  SOLAPI_API_SECRET,
  KAKAO_PF_ID,
  KAKAO_TEMPLATE_OTP,
  KAKAO_TEMPLATE_ORDER_CONFIRM,
  NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY,
  NODE_ENV,
};
