'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge, Skeleton, StatusBanner } from '@/components/ui';
import { api, ApiClientError } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import type { Inquiry } from '@/types';

export default function ProviderInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadInquiries();
  }, []);

  async function loadInquiries() {
    try {
      const res = await api.inquiries.list();
      setInquiries(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load inquiries');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    setProcessingId(id);
    setFeedback('');
    try {
      await api.inquiries.updateStatus(id, status);
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, status: status as Inquiry['status'] } : inq)),
      );
      setFeedback(`Inquiry marked as ${status.toLowerCase()}`);
    } catch (err) {
      setFeedback(err instanceof ApiClientError ? err.message : 'Failed to update inquiry');
    } finally {
      setProcessingId(null);
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-warning-bg text-warning-text',
    SEEN: 'bg-info-bg text-info-text',
    RESPONDED: 'bg-success-bg text-success-text',
    CLOSED: 'bg-surface-bg text-neutral-500',
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <h1 className="text-heading text-neutral-900 mb-6">Inquiries</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><Skeleton className="h-20 w-full" /></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <h1 className="text-heading text-neutral-900 mb-6">Inquiries</h1>

      {feedback && <StatusBanner variant="success" className="mb-4">{feedback}</StatusBanner>}
      {error && <StatusBanner variant="error" className="mb-4">{error}</StatusBanner>}

      {inquiries.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-display mb-2">📩</p>
          <p className="text-body text-neutral-500">No inquiries yet</p>
          <p className="text-small text-neutral-500 mt-1">When customers send you a message, it will appear here</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <Card key={inq.id}>
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-tint text-primary-deep rounded-full flex items-center justify-center text-small font-medium flex-shrink-0">
                      {inq.consumer?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-small font-medium text-neutral-900">
                          {inq.consumer?.name || 'Consumer'}
                        </span>
                        <span className={`text-caption font-medium px-2 py-0.5 rounded-pill ${statusColors[inq.status] || ''}`}>
                          {inq.status}
                        </span>
                      </div>
                      <p className="text-caption text-neutral-500">{formatRelativeTime(inq.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <p className="text-body text-neutral-700 bg-surface-bg rounded-component px-4 py-3">
                  {inq.message}
                </p>

                <div className="flex gap-2">
                  {inq.status === 'PENDING' && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        isLoading={processingId === inq.id}
                        onClick={() => handleUpdateStatus(inq.id, 'SEEN')}
                      >
                        Mark as seen
                      </Button>
                      <Button
                        size="sm"
                        isLoading={processingId === inq.id}
                        onClick={() => handleUpdateStatus(inq.id, 'RESPONDED')}
                      >
                        Mark as responded
                      </Button>
                    </>
                  )}
                  {inq.status === 'SEEN' && (
                    <Button
                      size="sm"
                      isLoading={processingId === inq.id}
                      onClick={() => handleUpdateStatus(inq.id, 'RESPONDED')}
                    >
                      Mark as responded
                    </Button>
                  )}
                  {(inq.status === 'RESPONDED' || inq.status === 'SEEN') && (
                    <Button
                      size="sm"
                      variant="secondary"
                      isLoading={processingId === inq.id}
                      onClick={() => handleUpdateStatus(inq.id, 'CLOSED')}
                    >
                      Close
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
