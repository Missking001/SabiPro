'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'CONSUMER' | 'PROVIDER' | 'ADMIN';
  accessToken: string;
  avatarUrl?: string | null;
}

function getAdminUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const token = sessionStorage.getItem('sabipro_token');
  const raw = sessionStorage.getItem('sabipro_admin_user');
  if (!token || !raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return { ...parsed, accessToken: token };
  } catch {
    return null;
  }
}

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const adminUser = getAdminUser();
  const sessionUser = session?.user as AuthUser | undefined;

  const user = sessionUser || adminUser || undefined;
  const isLoading = status === 'loading' && !adminUser;
  const isAuthenticated = status === 'authenticated' || !!adminUser;

  const isConsumer = user?.role === 'CONSUMER';
  const isProvider = user?.role === 'PROVIDER';
  const isAdmin = user?.role === 'ADMIN';

  async function login(email: string, password: string) {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    return result;
  }

  async function logout() {
    if (getAdminUser()) {
      sessionStorage.removeItem('sabipro_token');
      sessionStorage.removeItem('sabipro_admin_user');
    }
    await signOut({ redirect: false });
    router.push('/');
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    isConsumer,
    isProvider,
    isAdmin,
    login,
    logout,
  };
}
