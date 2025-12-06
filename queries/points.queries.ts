import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { pointsRepository } from '@/repositories/points.repository'

export const pointsQueries = {
  all: () => ['points'] as const,

  byUserId: (userId: string) =>
    queryOptions({
      queryKey: [...pointsQueries.all(), userId] as const,
      queryFn: () => pointsRepository.findByUserId(userId),
      enabled: !!userId,
    }),

  history: (userId: string, limit = 50) =>
    queryOptions({
      queryKey: [...pointsQueries.all(), 'history', userId, limit] as const,
      queryFn: () => pointsRepository.findHistoryByUserId(userId, limit),
      enabled: !!userId,
    }),
}

/**
 * 포인트 적립 mutation
 */
export function useEarnPoints() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      points,
      reason,
      orderId,
    }: {
      userId: string
      points: number
      reason: string
      orderId?: string
    }) => pointsRepository.earnPoints(userId, points, reason, orderId),
    onSuccess: (_, variables) => {
      // 포인트 정보 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: pointsQueries.byUserId(variables.userId).queryKey,
      })
      // 포인트 히스토리 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: [...pointsQueries.all(), 'history', variables.userId],
      })
    },
  })
}

/**
 * 포인트 사용 mutation
 */
export function useUsePoints() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      points,
      reason,
      orderId,
    }: {
      userId: string
      points: number
      reason: string
      orderId?: string
    }) => pointsRepository.usePoints(userId, points, reason, orderId),
    onSuccess: (_, variables) => {
      // 포인트 정보 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: pointsQueries.byUserId(variables.userId).queryKey,
      })
      // 포인트 히스토리 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: [...pointsQueries.all(), 'history', variables.userId],
      })
    },
  })
}
