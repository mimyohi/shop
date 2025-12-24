import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createServiceClient } from "@/lib/supabaseServiceServer";

export async function DELETE() {
  try {
    // 현재 로그인한 사용자 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Service role client로 데이터 삭제 (RLS 우회)
    const serviceClient = await createServiceClient();

    // 1. 관련 데이터 삭제 (외래키 제약 순서대로)
    // point_history 삭제
    await serviceClient
      .from("point_history")
      .delete()
      .eq("user_id", userId);

    // user_points 삭제
    await serviceClient
      .from("user_points")
      .delete()
      .eq("user_id", userId);

    // user_coupons 삭제
    await serviceClient
      .from("user_coupons")
      .delete()
      .eq("user_id", userId);

    // shipping_addresses 삭제
    await serviceClient
      .from("shipping_addresses")
      .delete()
      .eq("user_id", userId);

    // user_health_consultations 삭제
    await serviceClient
      .from("user_health_consultations")
      .delete()
      .eq("user_id", userId);

    // user_health_profiles 삭제
    await serviceClient
      .from("user_health_profiles")
      .delete()
      .eq("user_id", userId);

    // order_health_consultation의 user_id를 null로 설정 (주문 기록은 유지)
    await serviceClient
      .from("order_health_consultation")
      .update({ user_id: null })
      .eq("user_id", userId);

    // orders의 user_id를 null로 설정 (주문 기록은 유지하되 사용자 연결 해제)
    await serviceClient
      .from("orders")
      .update({ user_id: null })
      .eq("user_id", userId);

    // user_profiles 삭제
    await serviceClient
      .from("user_profiles")
      .delete()
      .eq("user_id", userId);

    // 2. auth.users에서 사용자 삭제
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(
      userId
    );

    if (deleteError) {
      console.error("User deletion error:", deleteError);
      return NextResponse.json(
        { success: false, error: "회원 탈퇴 처리 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "회원 탈퇴가 완료되었습니다.",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
