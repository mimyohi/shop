import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { addressesRepository, CreateAddressData, UpdateAddressData } from '@/repositories/addresses.repository'
import {
  createAddressAction,
  updateAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from '@/lib/actions/addresses.actions'

export type { CreateAddressData, UpdateAddressData } from '@/repositories/addresses.repository'

export const addressesQueries = {
  all: () => ['addresses'] as const,

  byUserId: (userId: string) =>
    queryOptions({
      queryKey: [...addressesQueries.all(), userId] as const,
      queryFn: () => addressesRepository.findByUserId(userId),
      enabled: !!userId,
    }),

  byId: (id: string) =>
    queryOptions({
      queryKey: [...addressesQueries.all(), 'detail', id] as const,
      queryFn: () => addressesRepository.findById(id),
      enabled: !!id,
    }),
}

/**
 * 배송지 생성 mutation
 */
export function useCreateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (addressData: CreateAddressData) => {
      const result = await createAddressAction(addressData)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      // 사용자의 배송지 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: addressesQueries.byUserId(variables.user_id).queryKey,
      })
    },
  })
}

/**
 * 배송지 수정 mutation
 */
export function useUpdateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, userId, data }: { id: string; userId: string; data: UpdateAddressData }) => {
      const result = await updateAddressAction(id, userId, data)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: (updatedAddress, variables) => {
      // 사용자의 배송지 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: addressesQueries.byUserId(variables.userId).queryKey,
      })
      // 특정 배송지 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: addressesQueries.byId(variables.id).queryKey,
      })
    },
  })
}

/**
 * 배송지 삭제 mutation
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const result = await deleteAddressAction(id, userId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result
    },
    onSuccess: (_, variables) => {
      // 사용자의 배송지 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: addressesQueries.byUserId(variables.userId).queryKey,
      })
    },
  })
}

/**
 * 기본 배송지 설정 mutation
 */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const result = await setDefaultAddressAction(id, userId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      // 사용자의 배송지 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: addressesQueries.byUserId(variables.userId).queryKey,
      })
    },
  })
}
