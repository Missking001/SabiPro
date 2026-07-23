'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Button, Skeleton, StatusBanner } from '@/components/ui';
import { api, ApiClientError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Inquiry } from '@/types';

export default function ProviderInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  
  // Interactive state for selected/expanded inquiry card
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInquiries();
  }, []);

  async function loadInquiries() {
    try {
      const res = await api.inquiries.list();
      const loaded = res.data || [];
      setInquiries(loaded);
      // Auto expand the first PENDING inquiry if available
      const firstPending = loaded.find((i) => i.status === 'PENDING');
      if (firstPending) {
        setExpandedId(firstPending.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inquiries');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReply(id: string) {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    setFeedback('');
    setError('');

    try {
      await api.inquiries.updateStatus(id, 'RESPONDED');
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, status: 'RESPONDED' } : inq))
      );
      setFeedback('Reply sent to customer successfully');
      setReplyText('');
      setExpandedId(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to send reply');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDecline(id: string) {
    setIsSubmitting(true);
    setFeedback('');
    setError('');

    try {
      await api.inquiries.updateStatus(id, 'CLOSED');
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, status: 'CLOSED' } : inq))
      );
      setFeedback('Inquiry declined');
      setExpandedId(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to decline inquiry');
    } finally {
      setIsSubmitting(false);
    }
  }

  const newCount = inquiries.filter((i) => i.status === 'PENDING').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] py-8 px-4 md:px-6">
        <div className="max-w-xl mx-auto space-y-4">
          <Skeleton className="h-8 w-40" />
          {[1, 2, 3].map((i) => (
            <Card key={i}><Skeleton className="h-28 w-full" /></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] py-6 px-4 md:px-6 pb-20">
      <div className="max-w-xl mx-auto">
        {/* Top Navigation / Header matching mockup */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/provider/dashboard"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-neutral-900 hover:text-primary-base transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Inquiries
          </Link>

          {newCount > 0 && (
            <span className="bg-tertiary-base text-white text-xs font-semibold px-3 py-1 rounded-full shadow-xs">
              {newCount} new
            </span>
          )}
        </div>

        {feedback && <StatusBanner variant="success" className="mb-4">{feedback}</StatusBanner>}
        {error && <StatusBanner variant="error" className="mb-4">{error}</StatusBanner>}

        {inquiries.length === 0 ? (
          <div className="bg-white rounded-card border border-surface-border p-10 text-center shadow-xs">
            <div className="w-14 h-14 bg-info-tint text-info-base rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
              📩
            </div>
            <h2 className="text-subhead font-semibold text-neutral-900 mb-1">No Inquiries Yet</h2>
            <p className="text-small text-neutral-500 max-w-sm mx-auto">
              When customers find your profile and send messages or booking requests, they will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {inquiries.map((inq) => {
              const isExpanded = expandedId === inq.id;
              const isNew = inq.status === 'PENDING';
              const isReplied = inq.status === 'RESPONDED';
              const isCompleted = inq.status === 'CLOSED';

              return (
                <div
                  key={inq.id}
                  className="bg-white rounded-card border border-surface-border shadow-xs overflow-hidden transition-all"
                >
                  {/* Card Header Section */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedId(null);
                      } else {
                        setExpandedId(inq.id);
                        setReplyText('');
                      }
                    }}
                    className="w-full text-left p-4 hover:bg-neutral-50/60 transition-colors block"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h2 className="text-small font-semibold text-neutral-900">
                        {inq.consumer?.name || 'Customer'}
                      </h2>
                      <span
                        className={`text-caption font-semibold px-2.5 py-0.5 rounded-full ${
                          isNew
                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                            : isReplied
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                        }`}
                      >
                        {isNew ? 'New' : isReplied ? 'Replied' : 'Completed'}
                      </span>
                    </div>

                    <p className="text-small text-neutral-600 font-normal mb-1.5 line-clamp-2">
                      {inq.message}
                    </p>

                    <div className="flex items-center justify-between text-caption text-neutral-400">
                      <span>{formatDate(inq.createdAt)}</span>
                      <span className="text-xs text-primary-base font-medium flex items-center gap-0.5">
                        {isExpanded ? 'Collapse ▲' : 'View & Reply ▼'}
                      </span>
                    </div>
                  </button>

                  {/* Expanded Form / View matching 4th reference mockup */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-surface-border bg-[#FAF9F6]">
                      {/* Quote block */}
                      <blockquote className="italic text-small text-neutral-700 bg-white p-3.5 rounded-component border-l-3 border-primary-base mb-3 shadow-2xs">
                        &quot;{inq.message}&quot;
                      </blockquote>

                      {/* Reply Box if PENDING or RESPONDED */}
                      {!isCompleted ? (
                        <div className="space-y-3">
                          <textarea
                            rows={3}
                            placeholder="Write your reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full bg-white border border-surface-input rounded-component p-3 text-small text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-base focus:ring-1 focus:ring-primary-base"
                          />

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              onClick={() => handleReply(inq.id)}
                              isLoading={isSubmitting}
                              disabled={!replyText.trim()}
                              className="flex-1 bg-[#1A6B3C] hover:bg-[#155630] text-white text-small py-2.5 rounded-component flex items-center justify-center gap-1.5"
                            >
                              <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                              </svg>
                              Reply
                            </Button>

                            <button
                              type="button"
                              onClick={() => handleDecline(inq.id)}
                              disabled={isSubmitting}
                              className="px-4 py-2.5 bg-white border border-surface-border text-neutral-600 hover:text-neutral-900 text-small font-medium rounded-component hover:bg-neutral-100 transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-caption text-neutral-500 font-medium py-1">
                          This inquiry has been marked as closed/completed.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
