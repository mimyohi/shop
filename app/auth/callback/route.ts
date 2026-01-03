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
      console.error("[Callback] Auth exchange error:", error);

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

    console.log("[Callback] Session created:", {
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      userId: data?.user?.id,
      email: data?.user?.email,
      provider: data?.user?.app_metadata?.provider,
    });

    if (data?.session && data?.user) {
      const userEmail = data.user.email;
      const userProvider = data.user.app_metadata?.provider;

      // 카카오 로그인인 경우 이메일 중복 확인
      if (userProvider === "kakao" && userEmail) {
        const serviceSupabase = await createServiceClient();

        // 고아 레코드(orphaned records) 정리: auth.users는 없지만 user_profiles만 남은 경우
        const { data: orphanedProfiles } = await serviceSupabase
          .from("user_profiles")
          .select("user_id, email")
          .eq("email", userEmail.toLowerCase());

        if (orphanedProfiles && orphanedProfiles.length > 0) {
          for (const orphan of orphanedProfiles) {
            // auth.users에 해당 user_id가 있는지 확인
            const { data: authUser } = await serviceSupabase.auth.admin.getUserById(orphan.user_id);

            // auth.users에 없으면 고아 레코드이므로 삭제
            if (!authUser.user) {
              console.log(`Cleaning up orphaned profile: ${orphan.user_id} (${orphan.email})`);
              await serviceSupabase
                .from("user_profiles")
                .delete()
                .eq("user_id", orphan.user_id);
            }
          }
        }

        // 기존 이메일로 가입된 다른 계정이 있는지 확인 (고아 레코드 정리 후 재확인)
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
          // 카카오로 생성된 계정 완전 삭제 (롤백)
          try {
            // 1. user_profiles 명시적으로 삭제 (CASCADE 보장)
            await serviceSupabase
              .from("user_profiles")
              .delete()
              .eq("user_id", data.user.id);

            // 2. user_points 삭제
            await serviceSupabase
              .from("user_points")
              .delete()
              .eq("user_id", data.user.id);

            // 3. auth.users 삭제
            await serviceSupabase.auth.admin.deleteUser(data.user.id);

            console.log(`Rollback completed for user: ${data.user.id}`);
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
        const { data: profile, error: profileCheckError } = await serviceSupabase
          .from("user_profiles")
          .select("display_name, phone, phone_verified")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (profileCheckError) {
          console.error("Profile check error:", profileCheckError);
        }

        const needsProfileCompletion = !profile?.display_name || !profile?.phone || !profile?.phone_verified;

        console.log("[Callback] Profile check:", {
          hasProfile: !!profile,
          display_name: profile?.display_name,
          phone: profile?.phone,
          phone_verified: profile?.phone_verified,
          needsProfileCompletion,
        });

        if (needsProfileCompletion) {
          console.log("[Callback] Redirecting to signup for profile completion");
          return NextResponse.redirect(
            new URL("/auth/signup?mode=kakao", requestUrl.origin)
          );
        }

        console.log("[Callback] Profile complete, redirecting to home");
      } else {
        console.log("[Callback] Not a Kakao user, skipping email check");
      }
    } else {
      console.warn("[Callback] No session or user data");
    }
  } else {
    console.warn("[Callback] No code parameter");
  }

  // 홈페이지로 리다이렉트
  console.log("[Callback] Redirecting to home");
  const response = NextResponse.redirect(new URL("/", requestUrl.origin));

  // 쿠키가 제대로 설정되도록 명시적으로 헤더 추가
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  return response;
}
