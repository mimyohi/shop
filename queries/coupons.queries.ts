import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { couponsRepository } from "@/repositories/coupons.repository";
import {
  issueCouponToUserAction,
  useCouponAction,
  registerCouponByCodeAction,
} from "@/lib/actions/coupons.actions";

export const couponsQueries = {
  all: () => ["coupons"] as const,

  userCoupons: (userId: string) =>
    queryOptions({
      queryKey: [...couponsQueries.all(), "user", userId] as const,
      queryFn: () => couponsRepository.findUserCoupons(userId),
      enabled: !!userId,
    }),

  activeCoupons: () =>
    queryOptions({
      queryKey: [...couponsQueries.all(), "active"] as const,
      queryFn: () => couponsRepository.findActiveCoupons(),
      staleTime: 5 * 60 * 1000, // 5분간 fresh 유지
    }),

  byCode: (code: string) =>
    queryOptions({
      queryKey: [...couponsQueries.all(), "code", code] as const,
      queryFn: () => couponsRepository.findByCode(code),
      enabled: !!code,
    }),
};

/**
 * 쿠폰 발급 mutation
 */
export function useIssueCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      couponId,
    }: {
      userId: string;
      couponId: string;
    }) => {
      const result = await issueCouponToUserAction(userId, couponId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      // 사용자 쿠폰 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: couponsQueries.userCoupons(variables.userId).queryKey,
      });
    },
  });
}

/**
 * 쿠폰 사용 mutation
 */
export function useUseCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userCouponId,
      orderId,
    }: {
      userCouponId: string;
      orderId: string;
    }) => {
      const result = await useCouponAction(userCouponId, orderId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      // 모든 쿠폰 캐시 무효화
      queryClient.invalidateQueries({ queryKey: couponsQueries.all() });
    },
  });
}

/**
 * 쿠폰 코드로 쿠폰 등록 mutation
 */
export function useRegisterCouponByCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (couponCode: string) => {
      const result = await registerCouponByCodeAction(couponCode);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: async () => {
      // 모든 쿠폰 관련 캐시 무효화 (userCoupons 포함)
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "coupons",
      });
    },
  });
}
