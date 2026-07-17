'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Badge, Skeleton, StatusBanner } from '@/components/ui';
import { api } from '@/lib/api';
import type { MyProviderProfile, Inquiry } from '@/types';

export default function ProviderDashboardPage() {
  const [provider, setProvider] = useState<MyProviderProfile | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [providerRes, inquiriesRes] = await Promise.all([
          api.providers.me(),
          api.inquiries.list(),
        ]);
        setProvider(providerRes.data || null);
        setInquiries(inquiriesRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <h1 className="text-heading text-neutral-900 mb-6">Provider dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}><Skeleton className="h-16 w-full" /></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <h1 className="text-heading text-neutral-900 mb-6">Provider dashboard</h1>
        <Card className="text-center py-12">
          <p className="text-display mb-2">🔧</p>
          <p className="text-body text-neutral-700 mb-4">You haven&apos;t created a provider profile yet</p>
          <Link
            href="/provider/profile"
            className="inline-flex items-center justify-center min-h-[44px] px-6 bg-primary-base text-neutral-0 text-small font-medium rounded-component hover:bg-primary-deep transition-colors"
          >
            Create your profile
          </Link>
        </Card>
      </div>
    );
  }

  const pendingInquiries = inquiries.filter((i) => i.status === 'PENDING').length;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-heading text-neutral-900">Provider dashboard</h1>
        <div className="flex items-center gap-2">
          {provider.isVerified && <Badge variant="verified">Verified</Badge>}
          <Badge variant={provider.isAvailable ? 'available' : 'unavailable'}>
            {provider.isAvailable ? 'Available' : 'Unavailable'}
          </Badge>
        </div>
      </div>

      {error && <StatusBanner variant="error" className="mb-4">{error}</StatusBanner>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-caption text-neutral-500 uppercase tracking-wide mb-1">Total reviews</p>
          <p className="text-display font-medium text-neutral-900">{provider.totalReviews}</p>
        </Card>
        <Card>
          <p className="text-caption text-neutral-500 uppercase tracking-wide mb-1">Average rating</p>
          <p className="text-display font-medium text-neutral-900">
            ⭐ {provider.averageRating.toFixed(1)}
          </p>
        </Card>
        <Card>
          <p className="text-caption text-neutral-500 uppercase tracking-wide mb-1">Pending inquiries</p>
          <p className="text-display font-medium text-neutral-900">{pendingInquiries}</p>
        </Card>
      </div>

      {/* Profile summary */}
      <Card className="mb-6">
        <h2 className="text-subhead text-neutral-900 mb-3">Your profile</h2>
        <div className="space-y-2 text-small text-neutral-700">
          <p><span className="font-medium text-neutral-900">Trade:</span> {provider.tradeCategory}</p>
          <p><span className="font-medium text-neutral-900">Location:</span> {provider.location}</p>
          {provider.priceRange && (
            <p><span className="font-medium text-neutral-900">Price range:</span> {provider.priceRange}</p>
          )}
          <p><span className="font-medium text-neutral-900">Status:</span> {provider.onboardingState}</p>
        </div>
      </Card>

      {/* Recent inquiries */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-subhead text-neutral-900">Recent inquiries</h2>
          <Link href="/provider/inquiries" className="text-small text-primary-base hover:text-primary-hover font-medium">
            View all
          </Link>
        </div>
        {inquiries.length === 0 ? (
          <p className="text-small text-neutral-500 py-4 text-center">No inquiries yet</p>
        ) : (
          <div className="space-y-3">
            {inquiries.slice(0, 5).map((inq) => (
              <div key={inq.id} className="flex items-start gap-3 pb-3 border-b border-surface-border last:border-0 last:pb-0">
                <div className="w-8 h-8 bg-primary-tint text-primary-deep rounded-full flex items-center justify-center text-caption font-medium flex-shrink-0">
                  {inq.consumer?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-small font-medium text-neutral-900">{inq.consumer?.name || 'Consumer'}</span>
                    <span className="text-caption text-neutral-500 bg-surface-bg px-1.5 py-0.5 rounded-pill">{inq.status}</span>
                  </div>
                  <p className="text-small text-neutral-700 truncate">{inq.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick links */}
      <Card>
        <h2 className="text-subhead text-neutral-900 mb-2">Quick links</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/provider/profile" className="text-primary-base hover:text-primary-hover text-small font-medium">
            Edit profile
          </Link>
          <Link href="/provider/inquiries" className="text-primary-base hover:text-primary-hover text-small font-medium">
            View inquiries
          </Link>
          <Link href="/provider/payments" className="text-primary-base hover:text-primary-hover text-small font-medium">
            Payments & Payouts
          </Link>
          <Link href={`/providers/${provider.slug}`} className="text-primary-base hover:text-primary-hover text-small font-medium">
            View public profile
          </Link>
        </div>
      </Card>
    </div>
  );
}
