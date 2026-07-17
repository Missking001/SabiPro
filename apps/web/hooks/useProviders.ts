'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { ProviderSummary } from '@/types';

export function useProviders(initialLoading = false) {
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState('');

  async function searchProviders(params?: Record<string, string | number | undefined>) {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.providers.search(params);
      setProviders(res.data || []);
      return res.data || [];
    } catch (err: any) {
      const msg = err.message || 'Failed to load providers';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    providers,
    isLoading,
    error,
    searchProviders,
  };
}
