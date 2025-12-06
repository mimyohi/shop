export const NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

export const NEXT_PUBLIC_PORTONE_STORE_ID =
  process.env.NEXT_PUBLIC_PORTONE_STORE_ID!;
export const NEXT_PUBLIC_PORTONE_CHANNEL_KEY =
  process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!;
export const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET!;
export const PORTONE_WEBHOOK_SECRET = process.env.PORTONE_WEBHOOK_SECRET;

export const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY!;
export const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET!;

export const KAKAO_PF_ID = process.env.KAKAO_PF_ID;
export const KAKAO_TEMPLATE_OTP =
  process.env.KAKAO_TEMPLATE_OTP ?? "otp_auth";
export const KAKAO_TEMPLATE_ORDER_CONFIRM =
  process.env.KAKAO_TEMPLATE_ORDER_CONFIRM ?? "order_confirmation";
export const KAKAO_TEMPLATE_SHIPPING =
  process.env.KAKAO_TEMPLATE_SHIPPING ?? "shipping_notification";
export const KAKAO_TEMPLATE_CANCEL =
  process.env.KAKAO_TEMPLATE_CANCEL ?? "order_cancellation";

export const NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY =
  process.env.NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY!;

export const NODE_ENV = process.env.NODE_ENV ?? "development";

type Env = {
  readonly NEXT_PUBLIC_SUPABASE_URL: string;
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly NEXT_PUBLIC_PORTONE_STORE_ID: string;
  readonly NEXT_PUBLIC_PORTONE_CHANNEL_KEY: string;
  readonly PORTONE_API_SECRET: string;
  readonly PORTONE_WEBHOOK_SECRET?: string;
  readonly SOLAPI_API_KEY: string;
  readonly SOLAPI_API_SECRET: string;
  readonly KAKAO_PF_ID?: string;
  readonly KAKAO_TEMPLATE_OTP: string;
  readonly KAKAO_TEMPLATE_ORDER_CONFIRM: string;
  readonly KAKAO_TEMPLATE_SHIPPING: string;
  readonly KAKAO_TEMPLATE_CANCEL: string;
  readonly NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY: string;
  readonly NODE_ENV: string;
};

export const env: Env = {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_PORTONE_STORE_ID,
  NEXT_PUBLIC_PORTONE_CHANNEL_KEY,
  PORTONE_API_SECRET,
  PORTONE_WEBHOOK_SECRET,
  SOLAPI_API_KEY,
  SOLAPI_API_SECRET,
  KAKAO_PF_ID,
  KAKAO_TEMPLATE_OTP,
  KAKAO_TEMPLATE_ORDER_CONFIRM,
  KAKAO_TEMPLATE_SHIPPING,
  KAKAO_TEMPLATE_CANCEL,
  NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY,
  NODE_ENV,
};
