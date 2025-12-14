import { createClient } from "@/lib/supabaseServer";
import { createServiceClient } from "@/lib/supabaseServiceServer";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth exchange error:", error);

      // 이메일 충돌 에러 처리
      if (error.message.includes("already registered") ||
          error.message.includes("User already registered") ||
          error.code === "user_already_exists") {
        return NextResponse.redirect(
          new URL("/auth/login?error=email_already_registered", requestUrl.origin)
        );
      }

      return NextResponse.redirect(new URL("/auth/login?error=auth_callback_failed", requestUrl.origin));
    }

    if (data?.session && data?.user) {
      const userEmail = data.user.email;
      const userProvider = data.user.app_metadata?.provider;

      // 카카오 로그인인 경우 이메일 중복 확인
      if (userProvider === "kakao" && userEmail) {
        const serviceSupabase = await createServiceClient();

        // 기존 이메일로 가입된 다른 계정이 있는지 확인
        const { data: existingProfile, error: profileError } = await serviceSupabase
          .from("user_profiles")
          .select("user_id, email")
          .eq("email", userEmail.toLowerCase())
          .neq("user_id", data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile check error:", profileError);
        }

        // 다른 계정으로 이미 가입된 이메일인 경우
        if (existingProfile) {
          // 카카오로 생성된 계정 삭제 (롤백)
          try {
            await serviceSupabase.auth.admin.deleteUser(data.user.id);
          } catch (deleteError) {
            console.error("Failed to rollback user:", deleteError);
          }

          // 로그아웃
          await supabase.auth.signOut();

          return NextResponse.redirect(
            new URL("/auth/login?error=email_already_registered", requestUrl.origin)
          );
        }

        // 프로필 완성 여부 확인 (이름, 전화번호)
        const { data: profile } = await serviceSupabase
          .from("user_profiles")
          .select("display_name, phone, phone_verified")
          .eq("user_id", data.user.id)
          .single();

        const needsProfileCompletion = !profile?.display_name || !profile?.phone || !profile?.phone_verified;

        if (needsProfileCompletion) {
          return NextResponse.redirect(
            new URL("/auth/signup?mode=kakao", requestUrl.origin)
          );
        }
      }
    }
  }

  // 홈페이지로 리다이렉트
  const response = NextResponse.redirect(new URL("/", requestUrl.origin));

  // 쿠키가 제대로 설정되도록 명시적으로 헤더 추가
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  return response;
}
