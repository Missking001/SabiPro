'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge, Skeleton, StatusBanner } from '@/components/ui';
import { api, ApiClientError } from '@/lib/api';
import type { ProviderSummary } from '@/types';

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    try {
      const res = await api.admin.providers();
      setProviders(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load providers');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(id: string) {
    setProcessingId(id);
    setFeedback('');
    try {
      await api.admin.approveVetting(id, 'BOTH');
      setProviders((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isVerified: true, onboardingState: 'VERIFIED' as const } : p)),
      );
      setFeedback('Provider verified successfully');
    } catch (err) {
      setFeedback(err instanceof ApiClientError ? err.message : 'Failed to approve provider');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRevoke(id: string) {
    setProcessingId(id);
    setFeedback('');
    try {
      await api.admin.revokeBadge(id);
      setProviders((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isVerified: false, onboardingState: 'ACTIVE' as const } : p)),
      );
      setFeedback('Badge revoked');
    } catch (err) {
      setFeedback(err instanceof ApiClientError ? err.message : 'Failed to revoke badge');
    } finally {
      setProcessingId(null);
    }
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-heading text-neutral-900 mb-6">Providers</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><Skeleton className="h-16 w-full" /></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-heading text-neutral-900 mb-6">Providers</h1>

      {feedback && <StatusBanner variant="success" className="mb-4">{feedback}</StatusBanner>}
      {error && <StatusBanner variant="error" className="mb-4">{error}</StatusBanner>}

      {providers.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-body text-neutral-500">No providers registered yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {providers.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-small font-medium text-neutral-900">
                      {p.user?.name || 'Provider'}
                    </span>
                    {p.isVerified ? (
                      <Badge variant="verified">Verified</Badge>
                    ) : (
                      <span className="text-caption text-neutral-500 bg-surface-bg px-2 py-0.5 rounded-pill">
                        {p.onboardingState}
                      </span>
                    )}
                    {p.isAvailable ? (
                      <Badge variant="available">Available</Badge>
                    ) : (
                      <Badge variant="unavailable">Unavailable</Badge>
                    )}
                  </div>
                  <p className="text-small text-neutral-700">
                    {p.tradeCategory} · {p.location}
                  </p>
                  <p className="text-caption text-neutral-500">
                    ⭐ {p.averageRating.toFixed(1)} · {p.totalReviews} reviews
                  </p>
                </div>
                <div className="flex gap-2">
                  {!p.isVerified && (p.onboardingState === 'ACTIVE' || p.onboardingState === 'PROFILE_COMPLETE') && (
                    <Button
                      size="sm"
                      isLoading={processingId === p.id}
                      onClick={() => handleApprove(p.id)}
                    >
                      Approve vetting
                    </Button>
                  )}
                  {p.isVerified && (
                    <Button
                      size="sm"
                      variant="secondary"
                      isLoading={processingId === p.id}
                      onClick={() => handleRevoke(p.id)}
                    >
                      Revoke badge
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
