import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { couponsRepository } from '@/repositories/coupons.repository'
import { issueCouponToUserAction, useCouponAction } from '@/lib/actions/coupons.actions'

export const couponsQueries = {
  all: () => ['coupons'] as const,

  userCoupons: (userId: string) =>
    queryOptions({
      queryKey: [...couponsQueries.all(), 'user', userId] as const,
      queryFn: () => couponsRepository.findUserCoupons(userId),
      enabled: !!userId,
    }),

  activeCoupons: () =>
    queryOptions({
      queryKey: [...couponsQueries.all(), 'active'] as const,
      queryFn: () => couponsRepository.findActiveCoupons(),
      staleTime: 5 * 60 * 1000, // 5분간 fresh 유지
    }),

  byCode: (code: string) =>
    queryOptions({
      queryKey: [...couponsQueries.all(), 'code', code] as const,
      queryFn: () => couponsRepository.findByCode(code),
      enabled: !!code,
    }),
}

/**
 * 쿠폰 발급 mutation
 */
export function useIssueCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, couponId }: { userId: string; couponId: string }) => {
      const result = await issueCouponToUserAction(userId, couponId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      // 사용자 쿠폰 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: couponsQueries.userCoupons(variables.userId).queryKey,
      })
    },
  })
}

/**
 * 쿠폰 사용 mutation
 */
export function useUseCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userCouponId, orderId }: { userCouponId: string; orderId: string }) => {
      const result = await useCouponAction(userCouponId, orderId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: () => {
      // 모든 쿠폰 캐시 무효화
      queryClient.invalidateQueries({ queryKey: couponsQueries.all() })
    },
  })
}
