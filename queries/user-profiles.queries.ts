import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { userProfilesRepository, UpdateUserProfileData } from '@/repositories/user-profiles.repository'
import { updateUserProfileAction } from '@/lib/actions/profiles.actions'

export type { UpdateUserProfileData } from '@/repositories/user-profiles.repository'

export const userProfilesQueries = {
  all: () => ['userProfiles'] as const,

  byUserId: (userId: string) =>
    queryOptions({
      queryKey: [...userProfilesQueries.all(), userId] as const,
      queryFn: () => userProfilesRepository.findByUserId(userId),
      enabled: !!userId,
    }),
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateUserProfileData }) => {
      const result = await updateUserProfileAction(userId, data)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: userProfilesQueries.byUserId(variables.userId).queryKey,
      })
    },
  })
}
