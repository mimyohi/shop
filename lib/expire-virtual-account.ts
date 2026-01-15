import { supabaseAuth } from "@/lib/supabaseAuth";
import type { Order } from "@/models";
import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseClientType = SupabaseClient | typeof supabaseAuth;

/**
 * 가상계좌 주문의 만료 여부를 확인하고 만료된 경우 취소 처리
 * Lazy Evaluation 방식으로 주문 조회 시점에 호출
 * 에러 발생 시 원본 주문을 그대로 반환 (사이드이펙트 없음)
 * @param order 주문 객체
 * @param supabase (선택) Supabase 클라이언트 - 서버용, 미전달 시 supabaseAuth 사용
 */
export async function checkAndExpireVirtualAccount(
  order: Order,
  supabase?: SupabaseClientType
): Promise<Order> {
  try {
    // 가상계좌가 아니거나, pending 상태가 아니거나, 만료일이 없으면 스킵
    if (
      order.payment_method !== "VIRTUAL_ACCOUNT" ||
      order.status !== "pending" ||
      !order.virtual_account_due_date
    ) {
      return order;
    }

    const now = new Date();
    const dueDate = new Date(order.virtual_account_due_date);

    // 아직 만료되지 않았으면 스킵
    if (dueDate > now) {
      return order;
    }

    const client = supabase || supabaseAuth;

    // 만료된 주문 취소 처리
    const { data: updatedOrder, error } = await client
      .from("orders")
      .update({
        status: "cancelled",
        consultation_status: "cancelled",
        cancel_reason: "가상계좌 입금 기한 만료",
        updated_at: now.toISOString(),
      })
      .eq("id", order.id)
      .select()
      .single();

    if (error) {
      console.error("가상계좌 만료 처리 실패:", error);
      return order; // 실패해도 원본 반환
    }

    console.log(`가상계좌 주문 만료 처리: ${order.order_id}`);
    return updatedOrder as Order;
  } catch (error) {
    // 어떤 에러가 발생해도 원본 주문 반환 (서비스 영향 없음)
    console.error("가상계좌 만료 체크 중 예외 발생:", error);
    return order;
  }
}

/**
 * 여러 주문에 대해 만료 체크 (주문 목록 조회 시 사용)
 * 에러 발생 시 원본 주문 목록을 그대로 반환 (사이드이펙트 없음)
 * @param orders 주문 목록
 * @param supabase (선택) Supabase 클라이언트 - 서버용, 미전달 시 supabaseAuth 사용
 */
export async function checkAndExpireVirtualAccounts(
  orders: Order[],
  supabase?: SupabaseClientType
): Promise<Order[]> {
  try {
    const now = new Date();
    const nowIso = now.toISOString();

    // 만료된 가상계좌 주문 필터링
    const expiredOrders = orders.filter(
      (order) =>
        order.payment_method === "VIRTUAL_ACCOUNT" &&
        order.status === "pending" &&
        order.virtual_account_due_date &&
        new Date(order.virtual_account_due_date) < now
    );

    if (expiredOrders.length === 0) {
      return orders;
    }

    const client = supabase || supabaseAuth;

    // 일괄 업데이트
    const expiredIds = expiredOrders.map((o) => o.id);
    const { error } = await client
      .from("orders")
      .update({
        status: "cancelled",
        consultation_status: "cancelled",
        cancel_reason: "가상계좌 입금 기한 만료",
        updated_at: nowIso,
      })
      .in("id", expiredIds);

    if (error) {
      console.error("가상계좌 일괄 만료 처리 실패:", error);
      return orders;
    }

    console.log(`가상계좌 주문 ${expiredOrders.length}건 만료 처리`);

    // 업데이트된 상태로 반환
    return orders.map((order) => {
      if (expiredIds.includes(order.id)) {
        return {
          ...order,
          status: "cancelled" as const,
          consultation_status: "cancelled" as const,
          cancel_reason: "가상계좌 입금 기한 만료",
          updated_at: nowIso,
        };
      }
      return order;
    });
  } catch (error) {
    // 어떤 에러가 발생해도 원본 주문 목록 반환 (서비스 영향 없음)
    console.error("가상계좌 일괄 만료 체크 중 예외 발생:", error);
    return orders;
  }
}
