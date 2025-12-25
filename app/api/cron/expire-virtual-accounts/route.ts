import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Vercel Cron 인증 확인
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error("Cron 인증 실패");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date().toISOString();

    // 가상계좌 입금 기한이 만료된 pending 주문 조회
    const { data: expiredOrders, error: selectError } = await supabaseAdmin
      .from("orders")
      .select("id, order_id, user_phone, user_name, virtual_account_due_date")
      .eq("status", "pending")
      .eq("payment_method", "VIRTUAL_ACCOUNT")
      .lt("virtual_account_due_date", now);

    if (selectError) {
      console.error("만료된 주문 조회 실패:", selectError);
      return NextResponse.json(
        { error: "만료된 주문 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      console.log("만료된 가상계좌 주문이 없습니다.");
      return NextResponse.json({
        success: true,
        message: "만료된 가상계좌 주문이 없습니다.",
        cancelled: 0,
      });
    }

    console.log(`만료된 가상계좌 주문 ${expiredOrders.length}건 발견`);

    // 만료된 주문들 취소 처리
    const orderIds = expiredOrders.map((order) => order.id);
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "cancelled",
        consultation_status: "cancelled",
        cancel_reason: "가상계좌 입금 기한 만료",
        updated_at: now,
      })
      .in("id", orderIds);

    if (updateError) {
      console.error("주문 취소 처리 실패:", updateError);
      return NextResponse.json(
        { error: "주문 취소 처리에 실패했습니다." },
        { status: 500 }
      );
    }

    console.log(
      `${expiredOrders.length}건의 가상계좌 주문이 만료로 취소되었습니다.`
    );

    return NextResponse.json({
      success: true,
      message: `${expiredOrders.length}건의 만료된 가상계좌 주문이 취소되었습니다.`,
      cancelled: expiredOrders.length,
      cancelledOrderIds: expiredOrders.map((o) => o.order_id),
    });
  } catch (error) {
    console.error("가상계좌 만료 처리 중 오류:", error);
    return NextResponse.json(
      { error: "가상계좌 만료 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
