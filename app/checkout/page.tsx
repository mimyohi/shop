import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import {
  fetchUserPointsServer,
  fetchAvailableUserCouponsServer,
  fetchShippingAddressesServer,
  fetchUserProfileServer,
  // fetchUserHealthConsultationServer, // 문진표 관련 주석 처리
} from "@/lib/server-data";
import CheckoutContent from "./CheckoutContent";

export default async function CheckoutPage() {
  // 서버에서 인증 상태 확인
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!user) {
    redirect("/auth/login?next=/checkout");
  }

  // 서버에서 모든 데이터 병렬 가져오기
  const [userPoints, availableCoupons, addresses, profile] =
    await Promise.all([
      fetchUserPointsServer(user.id),
      fetchAvailableUserCouponsServer(user.id),
      fetchShippingAddressesServer(user.id),
      fetchUserProfileServer(user.id),
      // fetchUserHealthConsultationServer(user.id), // 문진표 관련 주석 처리
    ]);

  return (
    <CheckoutContent
      user={user}
      initialUserPoints={userPoints}
      initialAvailableCoupons={availableCoupons}
      initialAddresses={addresses}
      initialProfile={profile}
      // initialHealthConsultation={savedHealthConsultation} // 문진표 관련 주석 처리
    />
  );
}
