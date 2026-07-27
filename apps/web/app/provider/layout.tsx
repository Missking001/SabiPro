'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, isProvider } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isProvider)) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, isProvider, router]);

  if (isLoading || !isAuthenticated || !isProvider) return null;

  return <>{children}</>;
}
