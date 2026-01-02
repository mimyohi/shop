import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createServiceClient } from "@/lib/supabaseServiceServer";

type DeleteStep = {
  name: string;
  execute: () => PromiseLike<{ error: unknown }>;
};

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
    const serviceClient = await createServiceClient();

    // 삭제 작업 정의 (외래키 제약 순서대로)
    const deleteSteps: DeleteStep[] = [
      {
        name: "point_history",
        execute: () => serviceClient.from("point_history").delete().eq("user_id", userId),
      },
      {
        name: "user_points",
        execute: () => serviceClient.from("user_points").delete().eq("user_id", userId),
      },
      {
        name: "user_coupons",
        execute: () => serviceClient.from("user_coupons").delete().eq("user_id", userId),
      },
      {
        name: "shipping_addresses",
        execute: () => serviceClient.from("shipping_addresses").delete().eq("user_id", userId),
      },
      {
        name: "user_health_consultations",
        execute: () => serviceClient.from("user_health_consultations").delete().eq("user_id", userId),
      },
      {
        name: "user_health_profiles",
        execute: () => serviceClient.from("user_health_profiles").delete().eq("user_id", userId),
      },
    ];

    // 연결 해제 작업 (주문 기록은 유지)
    const unlinkSteps: DeleteStep[] = [
      {
        name: "order_health_consultation",
        execute: () => serviceClient.from("order_health_consultation").update({ user_id: null }).eq("user_id", userId),
      },
      {
        name: "orders",
        execute: () => serviceClient.from("orders").update({ user_id: null }).eq("user_id", userId),
      },
    ];

    const completedSteps: string[] = [];
    const errors: { step: string; error: unknown }[] = [];

    // 삭제 작업 실행
    for (const step of deleteSteps) {
      const { error } = await step.execute();
      if (error) {
        errors.push({ step: step.name, error });
        console.error(`회원 탈퇴 - ${step.name} 삭제 실패:`, error);
      } else {
        completedSteps.push(step.name);
      }
    }

    // 연결 해제 작업 실행
    for (const step of unlinkSteps) {
      const { error } = await step.execute();
      if (error) {
        errors.push({ step: step.name, error });
        console.error(`회원 탈퇴 - ${step.name} 연결 해제 실패:`, error);
      } else {
        completedSteps.push(step.name);
      }
    }

    // user_profiles 삭제
    const { error: profileError } = await serviceClient
      .from("user_profiles")
      .delete()
      .eq("user_id", userId);

    if (profileError) {
      errors.push({ step: "user_profiles", error: profileError });
      console.error("회원 탈퇴 - user_profiles 삭제 실패:", profileError);
    } else {
      completedSteps.push("user_profiles");
    }

    // 중요 데이터 삭제에 실패한 경우 auth.users 삭제 중단
    const criticalErrors = errors.filter(e =>
      ["user_profiles", "user_points", "user_coupons"].includes(e.step)
    );

    if (criticalErrors.length > 0) {
      console.error("회원 탈퇴 중단 - 중요 데이터 삭제 실패:", criticalErrors);
      return NextResponse.json(
        {
          success: false,
          error: "회원 탈퇴 처리 중 오류가 발생했습니다. 고객센터에 문의해주세요.",
          completedSteps,
          failedSteps: errors.map(e => e.step),
        },
        { status: 500 }
      );
    }

    // auth.users에서 사용자 삭제
    // Supabase 기본은 soft-delete라 재가입 시 이메일 충돌이 날 수 있어 하드 삭제로 명시
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(
      userId,
      false // should_soft_delete
    );

    if (deleteError) {
      console.error("User deletion error:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: "회원 탈퇴 처리 중 오류가 발생했습니다. 고객센터에 문의해주세요.",
          completedSteps,
        },
        { status: 500 }
      );
    }

    // 일부 비중요 데이터 삭제 실패해도 성공 처리 (로그만 기록)
    if (errors.length > 0) {
      console.warn("회원 탈퇴 완료 (일부 데이터 삭제 실패):", {
        userId,
        completedSteps,
        failedSteps: errors.map(e => e.step),
      });
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
