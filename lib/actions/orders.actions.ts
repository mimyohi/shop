"use server";

import { createClient } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";
import type {
  CreateOrderData,
  OrderWithItems,
} from "@/repositories/orders.repository";

/**
 * 주문 생성 서버 액션 (롤백 로직 포함)
 */
export async function createOrderAction(data: CreateOrderData) {
  const supabase = await createClient();
  let createdOrderId: string | null = null;

  try {
    // 현재 로그인한 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();

    // 1. 주문 생성
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id || null, // 로그인한 경우 user_id 설정
        user_email: data.user_email,
        user_name: data.user_name,
        user_phone: data.user_phone,
        total_amount: data.total_amount,
        order_id: data.order_id,
        status: "pending",
        consultation_status: data.consultation_status ?? "chatting_required",
        // 배송 정보
        shipping_address_id: data.shipping_address_id,
        shipping_name: data.shipping_name,
        shipping_phone: data.shipping_phone,
        shipping_postal_code: data.shipping_postal_code,
        shipping_address: data.shipping_address,
        shipping_address_detail: data.shipping_address_detail,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Error creating order:", orderError);
      return {
        success: false,
        error: orderError?.message || "Failed to create order",
      };
    }

    createdOrderId = order.id;

    // 2. 주문 상품 생성
    const { error: itemsError } = await supabase.from("order_items").insert(
      data.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        product_price: item.product_price,
        quantity: item.quantity,
        selected_options: item.selected_options || null,
        selected_addons: item.selected_addons || null,
        // Product Option 관련 필드
        option_id: item.option_id || null,
        option_name: item.option_name || null,
        option_price: item.option_price || 0,
        visit_type: item.visit_type || null,
        selected_option_settings: item.selected_option_settings || null,
      }))
    );

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      // 롤백: 생성된 주문 삭제
      if (createdOrderId) {
        await rollbackOrder(supabase, createdOrderId);
      }
      return {
        success: false,
        error: "Failed to create order items",
      };
    }

    // 3. 건강 상담 정보 생성 (있는 경우)
    if (data.health_consultation) {
      const { error: consultationError } = await supabase
        .from("order_health_consultation")
        .insert({
          order_id: order.id,
          ...data.health_consultation,
        });

      if (consultationError) {
        console.error("Error creating health consultation:", consultationError);
        // 롤백: 생성된 주문과 아이템 삭제
        if (createdOrderId) {
          await rollbackOrder(supabase, createdOrderId);
        }
        return {
          success: false,
          error: "Failed to create health consultation",
        };
      }

      // 로그인한 사용자라면 user_health_consultations 테이블에도 저장 (다음 주문 시 자동 불러오기용)
      if (user) {
        const { error: userConsultationError } = await supabase
          .from("user_health_consultations")
          .upsert(
            {
              user_id: user.id,
              ...data.health_consultation,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id",
            }
          );

        if (userConsultationError) {
          // 사용자 문진 저장 실패는 주문에 영향을 주지 않음 (로그만 남김)
          console.error("Error saving user health consultation:", userConsultationError);
        }
      }
    }

    // 4. 전체 주문 정보 조회
    const { data: fullOrder, error: fetchError } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          *,
          product:products(*)
        ),
        order_health_consultation (*)
      `
      )
      .eq("id", order.id)
      .single();

    if (fetchError || !fullOrder) {
      console.error("Error fetching created order:", fetchError);
      // 롤백: 생성된 모든 데이터 삭제
      if (createdOrderId) {
        await rollbackOrder(supabase, createdOrderId);
      }
      return {
        success: false,
        error: "Failed to fetch created order",
      };
    }

    // 캐시 무효화
    revalidatePath("/profile");
    revalidatePath("/orders");

    return {
      success: true,
      data: fullOrder as OrderWithItems,
    };
  } catch (error: any) {
    console.error("Error in createOrderAction:", error);
    // 롤백: 생성된 주문이 있다면 삭제
    if (createdOrderId) {
      await rollbackOrder(supabase, createdOrderId);
    }
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * 주문 생성 실패 시 롤백 (생성된 주문 및 관련 데이터 삭제)
 */
async function rollbackOrder(supabase: Awaited<ReturnType<typeof createClient>>, orderId: string) {
  try {
    // 1. order_health_consultation 삭제
    await supabase
      .from("order_health_consultation")
      .delete()
      .eq("order_id", orderId);

    // 2. order_items 삭제
    await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    // 3. 주문 삭제
    await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    console.log("Order rollback completed:", orderId);
  } catch (rollbackError) {
    console.error("Error during order rollback:", rollbackError);
  }
}

/**
 * 결제 실패 시 주문 삭제 서버 액션 (order_id 기준)
 * 결제 흐름에서 사용 - 방금 생성된 주문을 삭제
 */
export async function deleteOrderByOrderIdAction(order_id: string) {
  try {
    const supabase = await createClient();

    // 1. 주문 조회
    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("order_id", order_id)
      .single();

    if (findError || !order) {
      console.error("Order not found for deletion:", order_id);
      return {
        success: false,
        error: "Order not found",
      };
    }

    // pending 상태인 주문만 삭제 가능 (결제 완료된 주문은 삭제 불가)
    if (order.status !== "pending") {
      return {
        success: false,
        error: "Only pending orders can be deleted",
      };
    }

    // 2. order_health_consultation 삭제
    await supabase
      .from("order_health_consultation")
      .delete()
      .eq("order_id", order.id);

    // 3. order_items 삭제
    await supabase
      .from("order_items")
      .delete()
      .eq("order_id", order.id);

    // 4. 주문 삭제
    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", order.id);

    if (deleteError) {
      console.error("Error deleting order:", deleteError);
      return {
        success: false,
        error: "Failed to delete order",
      };
    }

    console.log("Order deleted after payment failure:", order_id);

    // 캐시 무효화
    revalidatePath("/profile");
    revalidatePath("/orders");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error in deleteOrderByOrderIdAction:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * 주문 취소/삭제 서버 액션
 */
export async function cancelOrderAction(order_id: string) {
  try {
    const supabase = await createClient();

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // 1. 주문 조회 및 소유권 확인
    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("id, user_email, status")
      .eq("order_id", order_id)
      .single();

    if (findError || !order) {
      return {
        success: false,
        error: "Order not found",
      };
    }

    // 소유권 확인 (user email과 order user_email이 일치하는지)
    if (order.user_email !== user.email) {
      return {
        success: false,
        error: "Unauthorized to cancel this order",
      };
    }

    // 취소 가능한 상태 확인
    if (order.status !== "pending") {
      return {
        success: false,
        error: "Only pending orders can be cancelled",
      };
    }

    // 2. order_health_consultation 삭제
    await supabase
      .from("order_health_consultation")
      .delete()
      .eq("order_id", order.id);

    // 3. order_items 삭제
    const { error: itemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", order.id);

    if (itemsError) {
      console.error("Error deleting order items:", itemsError);
      return {
        success: false,
        error: "Failed to delete order items",
      };
    }

    // 4. 주문 삭제
    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", order.id);

    if (deleteError) {
      console.error("Error deleting order:", deleteError);
      return {
        success: false,
        error: "Failed to delete order",
      };
    }

    // 캐시 무효화
    revalidatePath("/profile");
    revalidatePath("/orders");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error in cancelOrderAction:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * 주문 상태 업데이트 서버 액션
 */
export async function updateOrderStatusAction(
  order_id: string,
  status: string,
  payment_key?: string
) {
  try {
    const supabase = await createClient();

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // 주문 조회
    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("id, user_id, user_email, status")
      .eq("order_id", order_id)
      .single();

    if (findError || !order) {
      return {
        success: false,
        error: "Order not found",
      };
    }

    // 소유권 확인 (로그인 사용자인 경우)
    if (user && order.user_id && order.user_id !== user.id) {
      return {
        success: false,
        error: "Unauthorized to update this order",
      };
    }

    // 상태 업데이트
    const updateData: { status: string; payment_key?: string; updated_at: string } = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (payment_key) {
      updateData.payment_key = payment_key;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", order.id);

    if (updateError) {
      console.error("Error updating order status:", updateError);
      return {
        success: false,
        error: "Failed to update order status",
      };
    }

    // 캐시 무효화
    revalidatePath("/profile");
    revalidatePath("/orders");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error in updateOrderStatusAction:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}
