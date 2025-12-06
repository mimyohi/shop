import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/env";

export const supabaseAuth = createBrowserClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 로그인
export async function signIn(email: string, password: string) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

// 회원가입
interface SignUpOptions {
  displayName?: string;
  phone?: string;
  phoneVerified?: boolean;
}

export async function signUp(
  email: string,
  password: string,
  options?: SignUpOptions
) {
  const metadata: Record<string, string | boolean> = {};

  if (options?.displayName) {
    metadata.display_name = options.displayName;
  }
  if (options?.phone) {
    metadata.phone = options.phone;
  }
  if (typeof options?.phoneVerified === "boolean") {
    metadata.phone_verified = options.phoneVerified;
  }

  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  return { data, error };
}

// 로그아웃
export async function signOut() {
  const { error } = await supabaseAuth.auth.signOut();
  return { error };
}

// 현재 사용자 가져오기
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser();
  return { user, error };
}

// 세션 가져오기
export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabaseAuth.auth.getSession();
  return { session, error };
}

// Kakao 로그인 (Supabase에서 Kakao 설정 필요)
export async function signInWithKakao() {
  const { data, error } = await supabaseAuth.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
}

// 비밀번호 재설정 이메일 발송
export async function resetPassword(email: string) {
  const { data, error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  return { data, error };
}

// 비밀번호 업데이트
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabaseAuth.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
}
