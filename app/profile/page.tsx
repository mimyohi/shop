import { Suspense } from "react";
import { createClient } from "@/lib/supabaseServer";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProfileContent from "./ProfileContent";

type TabType =
  | "info"
  | "orders"
  | "points"
  | "coupons"
  | "addresses";
  // | "health"; // 문진표 탭 주석 처리

interface ProfilePageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

function ProfileLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="h-40 md:h-52 bg-gray-200 animate-pulse" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-56 shrink-0">
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-100 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </aside>
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
            <div className="border-t border-gray-200 pt-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-gray-100 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function LoginRequired() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="relative h-40 md:h-52 bg-gray-800 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1920&q=80)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/70 to-gray-900/30" />
        <div className="relative h-full flex flex-col items-center justify-center text-white">
          <h1 className="text-2xl md:text-3xl font-medium tracking-wide mb-2">
            My Page
          </h1>
          <p className="text-sm text-gray-300 text-center px-4">
            나만의 건강한 변화를 관리하세요
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-6">
            서비스를 이용하려면 로그인해주세요.
          </p>
          <a
            href="/auth/login"
            className="inline-block bg-gray-900 text-white px-6 py-3 rounded hover:bg-gray-800 transition text-sm"
          >
            로그인하기
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
}

async function ProfilePageContent({ searchParams }: ProfilePageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // 사용자 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LoginRequired />;
  }

  // 탭 파라미터 확인
  const allowedTabs: TabType[] = [
    "info",
    "orders",
    "points",
    "coupons",
    "addresses",
    // "health", // 문진표 탭 주석 처리
  ];
  const initialTab: TabType = allowedTabs.includes(params.tab as TabType)
    ? (params.tab as TabType)
    : "info";

  // 모든 데이터를 병렬로 페칭
  const [
    profileResult,
    pointsResult,
    ordersResult,
    addressesResult,
    // healthResult, // 문진표 관련 주석 처리
    couponsResult,
    historyResult,
  ] = await Promise.all([
    // Profile
    supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    // Points
    supabase
      .from("user_points")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    // Orders
    supabase
      .from("orders")
      .select(
        `
        *,
        order_items (*)
      `
      )
      .eq("user_email", user.email)
      .order("created_at", { ascending: false }),
    // Addresses
    supabase
      .from("shipping_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
    // Health Consultation - 문진표 관련 주석 처리
    // supabase
    //   .from("user_health_consultations")
    //   .select("*")
    //   .eq("user_id", user.id)
    //   .single(),
    // Coupons
    supabase
      .from("user_coupons")
      .select(
        `
        *,
        coupon:coupons (*)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    // Points History
    supabase
      .from("point_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const initialData = {
    profile: profileResult.data || null,
    userPoints: pointsResult.data || null,
    orders: ordersResult.data || [],
    addresses: addressesResult.data || [],
    // healthConsultation: healthResult.data || null, // 문진표 관련 주석 처리
    coupons: couponsResult.data || [],
    pointsHistory: historyResult.data || [],
  };

  return (
    <ProfileContent
      user={{ id: user.id, email: user.email || "" }}
      initialTab={initialTab}
      initialData={initialData}
    />
  );
}

export default function ProfilePage(props: ProfilePageProps) {
  return (
    <Suspense fallback={<ProfileLoadingSkeleton />}>
      <ProfilePageContent {...props} />
    </Suspense>
  );
}
