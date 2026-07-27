'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function ConsumerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, isConsumer } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isConsumer)) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, isConsumer, router]);

  if (isLoading || !isAuthenticated || !isConsumer) return null;

  return <>{children}</>;
}
