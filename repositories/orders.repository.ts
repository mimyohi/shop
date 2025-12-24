import { supabaseAuth } from "@/lib/supabaseAuth";
import { Order, OrderItem, Product, OrderHealthConsultation, CashReceiptType, PaymentMethod } from "@/models";

export interface OrderWithItems extends Order {
  order_items: (OrderItem & {
    product: Product | null;
  })[];
  order_health_consultation: OrderHealthConsultation;
}

export interface CreateOrderData {
  user_email: string;
  user_name: string;
  user_phone?: string;
  total_amount: number;
  order_id: string;
  consultation_status?: Order["consultation_status"];
  // 배송 정보
  shipping_address_id?: string;
  shipping_name?: string;
  shipping_phone?: string;
  shipping_postal_code?: string;
  shipping_address?: string;
  shipping_address_detail?: string;
  // 포인트/쿠폰
  used_points?: number;
  user_coupon_id?: string;
  coupon_discount?: number;
  // 배송비
  shipping_fee?: number;
  // 현금영수증
  cash_receipt_type?: CashReceiptType;
  cash_receipt_number?: string;
  // 결제 방법
  payment_method?: PaymentMethod;
  items: {
    product_id?: string;
    product_name: string;
    product_price: number;
    quantity: number;
    selected_options?: any;
    selected_addons?: any;
    // Product Option 관련 필드
    option_id?: string;
    option_name?: string;
    option_price?: number;
    visit_type?: string;
    selected_option_settings?: any;
  }[];
  health_consultation?: {
    user_id?: string;
    chief_complaint?: string;
    symptom_duration?: string;
    symptom_severity?: string;
    symptom_checklist?: any;
    lifestyle_info?: any;
    basic_info?: any;
    goals?: any;
    health?: any;
    [key: string]: any; // 다른 필드들도 허용
  };
}

export const ordersRepository = {
  /**
   * 주문 생성 (순차 처리)
   */
  async create(data: CreateOrderData): Promise<OrderWithItems> {
    // 1. 주문 생성
    const { data: order, error: orderError } = await supabaseAuth
      .from("orders")
      .insert({
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
        // 현금영수증 정보
        cash_receipt_type: data.cash_receipt_type || null,
        cash_receipt_number: data.cash_receipt_number || null,
        // 결제 방법
        payment_method: data.payment_method || "CARD",
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Error creating order:", orderError);
      throw new Error("Failed to create order");
    }

    // 2. 주문 상품 생성
    const { error: itemsError } = await supabaseAuth.from("order_items").insert(
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
      throw new Error("Failed to create order items");
    }

    // 3. 건강 상담 정보 생성 (필수)
    // id, created_at, updated_at 필드 제외 (새 레코드 생성 시 자동 생성됨)
    const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...healthConsultationData } = data.health_consultation || {};

    const { error: consultationError } = await supabaseAuth
      .from("order_health_consultation")
      .insert({
        order_id: order.id,
        ...healthConsultationData,
      });

    if (consultationError) {
      console.error("Error creating health consultation:", consultationError);
      throw new Error("Failed to create health consultation");
    }

    // 4. 전체 주문 정보 조회 및 반환
    const fullOrder = await this.findById(order.id);
    if (!fullOrder) {
      throw new Error("Failed to fetch created order");
    }

    return fullOrder;
  },

  /**
   * 주문 조회 (order_id로)
   */
  async findByOrderId(order_id: string): Promise<OrderWithItems | null> {
    const { data: order, error } = await supabaseAuth
      .from("orders")
      .select("*")
      .eq("order_id", order_id)
      .single();

    if (error || !order) {
      return null;
    }

    // order_items 조회 (product 포함)
    const { data: orderItems } = await supabaseAuth
      .from("order_items")
      .select(
        `
        *,
        product:products(*)
      `
      )
      .eq("order_id", order.id);

    // order_health_consultation 조회
    const { data: consultations } = await supabaseAuth
      .from("order_health_consultation")
      .select("*")
      .eq("order_id", order.id);

    return {
      ...order,
      order_items: orderItems || [],
      order_health_consultation: consultations?.[0]!,
    } as OrderWithItems;
  },

  /**
   * 주문 조회 (id로)
   */
  async findById(id: string): Promise<OrderWithItems | null> {
    const { data: order, error } = await supabaseAuth
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !order) {
      return null;
    }

    // order_items 조회 (product 포함)
    const { data: orderItems } = await supabaseAuth
      .from("order_items")
      .select(
        `
        *,
        product:products(*)
      `
      )
      .eq("order_id", order.id);

    // order_health_consultation 조회
    const { data: consultations } = await supabaseAuth
      .from("order_health_consultation")
      .select("*")
      .eq("order_id", order.id);

    return {
      ...order,
      order_items: orderItems || [],
      order_health_consultation: consultations?.[0]!,
    } as OrderWithItems;
  },

  /**
   * 사용자별 주문 목록 조회
   */
  async findByUserEmail(
    user_email: string,
    options?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{
    orders: OrderWithItems[];
    totalCount: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 주문 목록 조회
    const {
      data: orders,
      error,
      count,
    } = await supabaseAuth
      .from("orders")
      .select("*", { count: "exact" })
      .eq("user_email", user_email)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error || !orders) {
      console.error("Error fetching orders:", error);
      return { orders: [], totalCount: 0 };
    }

    // 각 주문에 대해 order_items와 consultations 조회
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const { data: orderItems } = await supabaseAuth
          .from("order_items")
          .select(
            `
            *,
            product:products(*)
          `
          )
          .eq("order_id", order.id);

        const { data: consultations } = await supabaseAuth
          .from("order_health_consultation")
          .select("*")
          .eq("order_id", order.id);

        return {
          ...order,
          order_items: orderItems || [],
          order_health_consultation: consultations?.[0]!,
        } as OrderWithItems;
      })
    );

    return {
      orders: ordersWithItems,
      totalCount: count || 0,
    };
  },

  /**
   * 주문 상태 업데이트
   */
  async updateStatus(
    order_id: string,
    status: string,
    payment_key?: string
  ): Promise<OrderWithItems> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (payment_key) {
      updateData.payment_key = payment_key;
    }

    const { data: order, error } = await supabaseAuth
      .from("orders")
      .update(updateData)
      .eq("order_id", order_id)
      .select()
      .single();

    if (error || !order) {
      console.error("Error updating order status:", error);
      throw new Error("Failed to update order status");
    }

    // 전체 주문 정보 조회
    const fullOrder = await this.findById(order.id);
    if (!fullOrder) {
      throw new Error("Failed to fetch updated order");
    }

    return fullOrder;
  },

  /**
   * 주문 삭제 (취소)
   */
  async delete(order_id: string): Promise<void> {
    // 1. 주문 조회
    const { data: order, error: findError } = await supabaseAuth
      .from("orders")
      .select("id")
      .eq("order_id", order_id)
      .single();

    if (findError || !order) {
      throw new Error("Order not found");
    }

    // 2. order_items 삭제
    const { error: itemsError } = await supabaseAuth
      .from("order_items")
      .delete()
      .eq("order_id", order.id);

    if (itemsError) {
      console.error("Error deleting order items:", itemsError);
      throw new Error("Failed to delete order items");
    }

    // 3. order_health_consultation 삭제
    const { error: consultationsError } = await supabaseAuth
      .from("order_health_consultation")
      .delete()
      .eq("order_id", order.id);

    if (consultationsError) {
      console.error("Error deleting consultations:", consultationsError);
      // Continue even if there are no consultations
    }

    // 4. 주문 삭제
    const { error: deleteError } = await supabaseAuth
      .from("orders")
      .delete()
      .eq("id", order.id);

    if (deleteError) {
      console.error("Error deleting order:", deleteError);
      throw new Error("Failed to delete order");
    }
  },
};
