'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { supabaseAuth } from '@/lib/supabaseAuth';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  display_name?: string;
  phone?: string;
  phone_verified?: boolean;
  phone_verified_at?: string;
  created_at: string;
  updated_at: string;
}

interface UseAuthOptions {
  /** 인증이 필요한 페이지인지 여부 (기본: true) */
  requireAuth?: boolean;
  /** 인증되지 않았을 때 리다이렉트할 경로 (기본: /auth/login) */
  redirectTo?: string;
  /** 로그인 후 원래 페이지로 돌아올지 여부 (기본: true) */
  returnToCurrentPage?: boolean;
}

interface UseAuthReturn {
  /** Supabase Auth 사용자 객체 */
  user: User | null;
  /** 사용자 프로필 (user_profiles 테이블) */
  profile: UserProfile | null;
  /** 인증 상태 확인 중 여부 */
  isLoading: boolean;
  /** 프로필이 완성되었는지 (이름, 전화번호 인증 완료) */
  isProfileComplete: boolean;
  /** 카카오 로그인 사용자인지 */
  isKakaoUser: boolean;
  /** 인증된 사용자인지 (프로필 완성 포함) */
  isAuthenticated: boolean;
  /** 로그아웃 함수 */
  signOut: () => Promise<void>;
  /** 프로필 다시 불러오기 */
  refetchProfile: () => Promise<void>;
}

// 인증 체크를 건너뛸 경로들
const PUBLIC_PATHS = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/find-id',
  '/products',
  '/faq',
  '/about',
];

// 인증이 필요하지만 프로필 완성이 필요 없는 경로
const AUTH_ONLY_PATHS = [
  '/auth/signup', // 카카오 사용자 프로필 완성용
];

/**
 * 인증 상태 관리 공통 훅
 *
 * 카카오 로그인 사용자의 경우 프로필이 완성되지 않으면 (이름, 전화번호 없음)
 * 로그인하지 않은 것으로 처리합니다.
 *
 * @example
 * ```tsx
 * // 인증이 필요한 페이지
 * const { user, profile, isLoading, isAuthenticated } = useAuth();
 *
 * if (isLoading) return <Loading />;
 * if (!isAuthenticated) return null; // 자동으로 리다이렉트됨
 *
 * return <ProtectedContent user={user} />;
 * ```
 *
 * @example
 * ```tsx
 * // 인증이 필요 없는 페이지 (단순히 사용자 정보만 필요)
 * const { user, isAuthenticated } = useAuth({ requireAuth: false });
 *
 * return isAuthenticated ? <UserMenu user={user} /> : <LoginButton />;
 * ```
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const {
    requireAuth = true,
    redirectTo = '/auth/login',
    returnToCurrentPage = true,
  } = options;

  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 프로필 완성 여부 체크
  const isProfileComplete = Boolean(
    profile?.display_name && profile?.phone && profile?.phone_verified
  );

  // 카카오 사용자 여부
  const isKakaoUser = user?.app_metadata?.provider === 'kakao';

  // 인증 완료 여부 (카카오 사용자는 프로필 완성 필수)
  const isAuthenticated = Boolean(user) && (!isKakaoUser || isProfileComplete);

  // 프로필 조회 함수
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabaseAuth
        .from('user_profiles')
        .select('id, user_id, email, display_name, phone, phone_verified')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Failed to fetch profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, []);

  // 프로필 다시 불러오기
  const refetchProfile = useCallback(async () => {
    if (!user?.id) return;
    const newProfile = await fetchProfile(user.id);
    setProfile(newProfile);
  }, [user?.id, fetchProfile]);

  // 로그아웃
  const signOut = useCallback(async () => {
    await supabaseAuth.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/');
  }, [router]);

  // 인증 상태 변화 감지
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { data: { user: currentUser } } = await supabaseAuth.auth.getUser();

        if (!isMounted) return;

        if (currentUser) {
          setUser(currentUser);
          const userProfile = await fetchProfile(currentUser.id);
          if (isMounted) {
            setProfile(userProfile);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    // 인증 상태 변화 구독
    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          const userProfile = await fetchProfile(session.user.id);
          if (isMounted) {
            setProfile(userProfile);
          }
        } else {
          setUser(null);
          setProfile(null);
        }

        if (isMounted) {
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // 인증 필요 시 리다이렉트 처리
  useEffect(() => {
    if (isLoading) return;

    // 공개 경로는 리다이렉트 안함
    const isPublicPath = PUBLIC_PATHS.some(path =>
      pathname === path || pathname?.startsWith(`${path}/`)
    );
    if (isPublicPath && !requireAuth) return;

    // 인증이 필요한 페이지인데 인증되지 않은 경우
    if (requireAuth && !isAuthenticated) {
      // 카카오 사용자이고 프로필이 미완성인 경우
      if (user && isKakaoUser && !isProfileComplete) {
        // 이미 signup 페이지에 있으면 리다이렉트 안함
        if (pathname?.startsWith('/auth/signup')) return;

        router.push('/auth/signup?mode=kakao');
        return;
      }

      // 그 외 미인증 사용자
      if (!user) {
        const currentPath = returnToCurrentPage && pathname ? pathname : '';
        const nextParam = currentPath ? `?next=${encodeURIComponent(currentPath)}` : '';
        router.push(`${redirectTo}${nextParam}`);
      }
    }
  }, [
    isLoading,
    requireAuth,
    isAuthenticated,
    user,
    isKakaoUser,
    isProfileComplete,
    pathname,
    redirectTo,
    returnToCurrentPage,
    router,
  ]);

  return {
    user,
    profile,
    isLoading,
    isProfileComplete,
    isKakaoUser,
    isAuthenticated,
    signOut,
    refetchProfile,
  };
}

/**
 * 인증이 필요 없는 페이지에서 사용자 정보만 필요할 때 사용
 * 리다이렉트 없이 사용자 정보만 반환
 */
export function useOptionalAuth() {
  return useAuth({ requireAuth: false });
}

export default useAuth;
