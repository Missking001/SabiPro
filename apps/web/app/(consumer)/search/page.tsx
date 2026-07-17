'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';
import { ProviderCardSkeleton } from '@/components/ui';
import { useProviders } from '@/hooks/useProviders';
import type { ProviderSummary } from '@/types';

export default function SearchPage() {
  const [search, setSearch] = useState('');
  const [tradeCategory, setTradeCategory] = useState('');
  const [location, setLocation] = useState('');
  const { providers, isLoading, error, searchProviders } = useProviders(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trade = params.get('tradeCategory') || '';
    const loc = params.get('location') || '';
    setTradeCategory(trade);
    setLocation(loc);
    searchProviders({ tradeCategory: trade || undefined, location: loc || undefined }).catch(() => {});
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    searchProviders({ search: search || undefined, tradeCategory: tradeCategory || undefined, location: location || undefined }).catch(() => {});
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <h1 className="text-heading text-neutral-900 mb-6">Find a service provider</h1>

      <form onSubmit={handleSearch} className="bg-neutral-0 border border-surface-border rounded-card p-4 md:p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            placeholder="Search by trade, name, or keyword"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Input
            placeholder="Trade category"
            value={tradeCategory}
            onChange={(e) => setTradeCategory(e.target.value)}
          />
          <Input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Button type="submit" className="w-full">Search</Button>
        </div>
      </form>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProviderCardSkeleton key={i} />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-error-bg border border-error-border rounded-card p-6 text-center">
          <p className="text-error-text text-body">{error}</p>
          <Button variant="ghost" className="mt-3" onClick={() => searchProviders()}>
            Try again
          </Button>
        </div>
      )}

      {!isLoading && !error && providers.length === 0 && (
        <div className="bg-neutral-0 border border-surface-border rounded-card p-12 text-center">
          <p className="text-display mb-2">🔍</p>
          <h2 className="text-subhead text-neutral-900 mb-1">No providers found</h2>
          <p className="text-small text-neutral-500">Try a different trade or location</p>
        </div>
      )}

      {!isLoading && !error && providers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider: ProviderSummary) => (
            <Link
              key={provider.id}
              href={`/providers/${provider.slug}`}
              className="bg-neutral-0 border border-surface-border rounded-card p-4 hover:border-primary-base hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-primary-tint text-primary-deep rounded-full flex items-center justify-center text-small font-medium">
                  {provider.user?.name?.charAt(0) || 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-subhead text-neutral-900 truncate group-hover:text-primary-base transition-colors">
                    {provider.user?.name || 'Provider'}
                  </h3>
                  <p className="text-caption text-neutral-500">{provider.tradeCategory}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-small text-neutral-500 mb-2">
                <span>📍 {provider.location}</span>
                <span>⭐ {provider.averageRating.toFixed(1)}</span>
                <span>({provider.totalReviews})</span>
              </div>
              {provider.bio && (
                <p className="text-small text-neutral-500 line-clamp-2">{provider.bio}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
