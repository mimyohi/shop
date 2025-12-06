import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/models';

interface UserStore {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setIsLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      userProfile: null,
      isLoading: true,

      setUser: (user: User | null) => {
        set({ user });
      },

      setUserProfile: (profile: UserProfile | null) => {
        set({ userProfile: profile });
      },

      setIsLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      clearUser: () => {
        set({ user: null, userProfile: null, isLoading: false });
      },
    }),
    {
      name: 'user-storage',
      // Persist only non-sensitive data
      partialize: (state) => ({
        user: state.user ? {
          id: state.user.id,
          email: state.user.email,
          user_metadata: state.user.user_metadata,
        } : null,
        userProfile: state.userProfile,
      }),
    }
  )
);
