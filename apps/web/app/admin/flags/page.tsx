'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Skeleton, StatusBanner } from '@/components/ui';
import { api, ApiClientError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { ContentFlag } from '@/types';

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFeedback, setActionFeedback] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadFlags();
  }, []);

  async function loadFlags() {
    try {
      const res = await api.admin.flags();
      setFlags(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load flags');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResolve(id: string, action: 'REMOVE' | 'DISMISS') {
    setProcessingId(id);
    setActionFeedback('');
    try {
      await api.admin.resolveFlag(id, action);
      setFlags((prev) => prev.filter((f) => f.id !== id));
      setActionFeedback(`Flag ${action === 'REMOVE' ? 'removed' : 'dismissed'} successfully`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setActionFeedback(err.message);
      } else {
        setActionFeedback('Failed to resolve flag');
      }
    } finally {
      setProcessingId(null);
    }
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-heading text-neutral-900 mb-6">Flagged content</h1>
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
      <h1 className="text-heading text-neutral-900 mb-6">Flagged content</h1>

      {actionFeedback && (
        <StatusBanner variant="success" className="mb-4">{actionFeedback}</StatusBanner>
      )}

      {error && (
        <StatusBanner variant="error" className="mb-4">{error}</StatusBanner>
      )}

      {flags.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-display mb-2">✅</p>
          <p className="text-body text-neutral-500">No flagged content to review</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <Card key={flag.id}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-small font-medium text-neutral-900">
                      {flag.targetType === 'REVIEW' ? '📝 Review' : '📩 Inquiry'} flagged
                    </span>
                    <span className="text-caption text-neutral-500 bg-surface-bg px-2 py-0.5 rounded-pill">
                      {flag.status}
                    </span>
                  </div>
                  {flag.reason && (
                    <p className="text-small text-neutral-700 mb-1">
                      Reason: {flag.reason}
                    </p>
                  )}
                  <p className="text-caption text-neutral-500">
                    Reported {formatDate(flag.createdAt)} · Target ID: {flag.targetId.slice(0, 8)}…
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    isLoading={processingId === flag.id}
                    onClick={() => handleResolve(flag.id, 'DISMISS')}
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    isLoading={processingId === flag.id}
                    onClick={() => handleResolve(flag.id, 'REMOVE')}
                  >
                    Remove content
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
