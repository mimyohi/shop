import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  userHealthConsultationsRepository,
  UpsertUserHealthConsultationInput,
} from '@/repositories/user-health-consultations.repository'
import { saveUserHealthConsultationAction } from '@/lib/actions/health-consultations.actions'

export const userHealthConsultationsQueries = {
  all: () => ['user-health-consultations'] as const,

  byUserId: (userId: string) =>
    queryOptions({
      queryKey: [...userHealthConsultationsQueries.all(), userId] as const,
      queryFn: () => userHealthConsultationsRepository.findByUserId(userId),
      enabled: !!userId,
    }),
}

export function useUpsertUserHealthConsultation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpsertUserHealthConsultationInput) => {
      const result = await saveUserHealthConsultationAction(input)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: userHealthConsultationsQueries.byUserId(variables.user_id).queryKey,
      })
    },
  })
}

export type { UpsertUserHealthConsultationInput } from '@/repositories/user-health-consultations.repository'
