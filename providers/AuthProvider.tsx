"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabaseAuth } from "@/lib/supabaseAuth";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/models/user.model";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isKakaoUser: boolean;
  isProfileComplete: boolean;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser: {
    id: string;
    email: string;
    app_metadata?: { provider?: string };
    user_metadata?: Record<string, any>;
  } | null;
  initialProfile: UserProfile | null;
}

export function AuthProvider({
  children,
  initialUser,
  initialProfile,
}: AuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(initialUser as User | null);
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [isLoading, setIsLoading] = useState(false);

  // router.refresh() 후 서버에서 받은 새로운 초기값으로 state 동기화
  useEffect(() => {
    setUser(initialUser as User | null);
    setProfile(initialProfile);
  }, [initialUser?.id, initialProfile?.id]);

  const isKakaoUser = user?.app_metadata?.provider === "kakao";
  const isProfileComplete = Boolean(
    profile?.display_name && profile?.phone && profile?.phone_verified
  );
  const isAuthenticated = Boolean(user) && (!isKakaoUser || isProfileComplete);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabaseAuth
        .from("user_profiles")
        .select("id, user_id, email, display_name, phone, phone_verified, created_at, updated_at")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Failed to fetch profile:", error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  }, []);

  const refetchProfile = useCallback(async () => {
    if (!user?.id) return;
    const newProfile = await fetchProfile(user.id);
    setProfile(newProfile);
  }, [user?.id, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabaseAuth.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/");
    router.refresh();
  }, [router]);

  // 인증 상태 변화 구독
  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseAuth.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        return;
      }

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        const userProfile = await fetchProfile(session.user.id);
        setProfile(userProfile);
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated,
        isKakaoUser,
        isProfileComplete,
        signOut,
        refetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

// 선택적 사용 (context가 없어도 에러 안남)
export function useOptionalAuthContext() {
  const context = useContext(AuthContext);
  // AuthProvider에서 isLoading은 false로 시작하므로 fallback도 false
  // 서버에서 이미 초기 인증 상태를 가져왔기 때문
  return context || {
    user: null,
    profile: null,
    isLoading: false,
    isAuthenticated: false,
    isKakaoUser: false,
    isProfileComplete: false,
    signOut: async () => {},
    refetchProfile: async () => {},
  };
}
