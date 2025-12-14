import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import ChannelTalk from "@/components/ChannelTalk";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabaseServer";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Shop - 온라인 쇼핑몰",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  // 서버에서 인증 상태 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 프로필 조회
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("user_profiles")
      .select("id, user_id, email, display_name, phone, phone_verified, created_at, updated_at")
      .eq("user_id", user.id)
      .single();
    profile = data;
  }

  const initialUser = user
    ? {
        id: user.id,
        email: user.email || "",
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
      }
    : null;

  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className={`${montserrat.variable}`}>
        <NuqsAdapter>
          <ReactQueryProvider>
            <AuthProvider initialUser={initialUser} initialProfile={profile}>
              {children}
              <ChannelTalk />
            </AuthProvider>
          </ReactQueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
