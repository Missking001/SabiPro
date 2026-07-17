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

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user as AuthUser | undefined;
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

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
