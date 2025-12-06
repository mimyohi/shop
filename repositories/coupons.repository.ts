import { supabaseAuth } from "@/lib/supabaseAuth";
import { Coupon, UserCoupon } from "@/models";

export const couponsRepository = {
  /**
   * 사용자의 모든 쿠폰 목록 조회 (사용 여부 무관)
   */
  async findUserCoupons(userId: string): Promise<UserCoupon[]> {
    const { data, error } = await supabaseAuth
      .from("user_coupons")
      .select(
        `
        *,
        coupon:coupons(*)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user coupons:", error);
      throw new Error("Failed to fetch user coupons");
    }

    // coupon이 null인 경우 필터링 (삭제된 쿠폰 등)
    return (data || []).filter(
      (item: any) => item.coupon !== null
    ) as UserCoupon[];
  },

  /**
   * 사용자의 사용 가능한 쿠폰 목록 조회 (결제 시 사용)
   */
  async findAvailableUserCoupons(userId: string): Promise<UserCoupon[]> {
    const { data, error } = await supabaseAuth
      .from("user_coupons")
      .select(
        `
        *,
        coupon:coupons(*)
      `
      )
      .eq("user_id", userId)
      .eq("is_used", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching available user coupons:", error);
      throw new Error("Failed to fetch available user coupons");
    }

    // coupon이 null이거나 만료된 쿠폰 필터링
    const now = new Date();
    return (data || []).filter((item: any) => {
      if (!item.coupon) return false;
      if (item.coupon.valid_until) {
        return new Date(item.coupon.valid_until) >= now;
      }
      return true;
    }) as UserCoupon[];
  },

  /**
   * 모든 활성 쿠폰 조회
   */
  async findActiveCoupons(): Promise<Coupon[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabaseAuth
      .from("coupons")
      .select("*")
      .eq("is_active", true)
      .lte("valid_from", now)
      .or(`valid_until.is.null,valid_until.gte.${now}`);

    if (error) {
      console.error("Error fetching active coupons:", error);
      throw new Error("Failed to fetch active coupons");
    }

    return data || [];
  },

  /**
   * 쿠폰 코드로 조회
   */
  async findByCode(code: string): Promise<Coupon | null> {
    const { data, error } = await supabaseAuth
      .from("coupons")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching coupon by code:", error);
      return null;
    }

    return data;
  },

  /**
   * 사용자에게 쿠폰 발급
   */
  async issueCouponToUser(
    userId: string,
    couponId: string
  ): Promise<UserCoupon> {
    const { data, error } = await supabaseAuth
      .from("user_coupons")
      .insert({
        user_id: userId,
        coupon_id: couponId,
        is_used: false,
      })
      .select(
        `
        *,
        coupon:coupons(*)
      `
      )
      .single();

    if (error) {
      console.error("Error issuing coupon:", error);
      throw new Error("Failed to issue coupon");
    }

    return data as UserCoupon;
  },

  /**
   * 쿠폰 사용 처리
   */
  async useCoupon(userCouponId: string, orderId: string): Promise<UserCoupon> {
    const { data, error } = await supabaseAuth
      .from("user_coupons")
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        order_id: orderId,
      })
      .eq("id", userCouponId)
      .select(
        `
        *,
        coupon:coupons(*)
      `
      )
      .single();

    if (error) {
      console.error("Error using coupon:", error);
      throw new Error("Failed to use coupon");
    }

    return data as UserCoupon;
  },
};
