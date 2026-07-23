'use client';

import { useState, useEffect } from 'react';
import { Skeleton, StatusBanner } from '@/components/ui';
import { AdminHelpButton } from '@/components/admin/AdminHelpButton';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/components/admin/SidebarContext';
import { DocumentReviewModal } from '@/components/admin/DocumentReviewModal';
import type { ProviderSummary } from '@/types';

export default function AdminProvidersPage() {
  const { user } = useAuth();
  const { toggle: toggleSidebar } = useSidebar();
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewProvider, setReviewProvider] = useState<ProviderSummary | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    try {
      const res = await api.admin.providers();
      const unverified = (res.data || []).filter(
        (p) => !p.isVerified && (p.onboardingState === 'ACTIVE' || p.onboardingState === 'PROFILE_COMPLETE'),
      );
      setProviders(unverified);
    } catch (err: any) {
      setError(err.message || 'Failed to load providers');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(id: string, badgeType: string) {
    setProcessingId(id);
    setFeedback('');
    try {
      await api.admin.approveVetting(id, badgeType);
      setProviders((prev) => prev.filter((p) => p.id !== id));
      setFeedback(`Provider approved (${badgeType.replace('_', ' ')})`);
      setReviewProvider(null);
    } catch (err) {
      setFeedback(err instanceof ApiClientError ? err.message : 'Failed to approve provider');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    setProcessingId(id);
    setFeedback('');
    try {
      await api.admin.revokeBadge(id);
      setProviders((prev) => prev.filter((p) => p.id !== id));
      setFeedback('Provider rejected');
      setReviewProvider(null);
    } catch (err) {
      setFeedback(err instanceof ApiClientError ? err.message : 'Failed to reject provider');
    } finally {
      setProcessingId(null);
    }
  }

  const count = providers.length;

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between py-1 w-full">
          <Skeleton className="h-6 w-6 rounded" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="w-9 h-9 rounded-full" />
          </div>
        </div>
        <div>
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-6">
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-56 mb-1" />
              <Skeleton className="h-4 w-36 mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-36 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 relative pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-transparent py-1 w-full">
        <button
          type="button"
          onClick={toggleSidebar}
          className="text-[#18181B] hover:text-black transition-colors p-1"
          aria-label="Toggle sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#1A6B3C] text-white flex items-center justify-center font-bold text-sm shadow-xs">A</div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-[#18181B] leading-tight">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-[#71717A] leading-tight">Platform ops</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-[26px] font-bold text-[#18181B] leading-tight">Vetting Queue</h1>
        <p className="text-sm text-[#71717A] mt-1">
          {count} provider{count !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      {feedback && <StatusBanner variant="success" className="mb-0">{feedback}</StatusBanner>}
      {error && <StatusBanner variant="error" className="mb-0">{error}</StatusBanner>}

      {count === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] text-center py-16">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-sm text-[#71717A]">No providers awaiting review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map((p) => {
            const isProcessing = processingId === p.id;
            return (
              <div key={p.id} className="bg-white rounded-xl border border-[#E5E7EB] p-6 transition-shadow hover:shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
                  <h2 className="text-base font-bold text-[#18181B]">{p.user?.name || 'Provider'}</h2>
                </div>
                <p className="text-sm text-[#71717A] italic">{p.tradeCategory} · {p.location}</p>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  {p.onboardingState === 'PROFILE_COMPLETE' ? 'Profile complete' : 'Active'} · Not yet verified
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApprove(p.id, 'IDENTITY')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1A6B3C] rounded-full hover:bg-[#15573A] transition-colors disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" />
                    </svg>
                    Approve ID
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApprove(p.id, 'CREDENTIAL')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#185FA5] rounded-full hover:bg-[#134D88] transition-colors disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" />
                    </svg>
                    Approve Credential
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApprove(p.id, 'BOTH')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1A6B3C] rounded-full hover:bg-[#15573A] transition-colors disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" />
                    </svg>
                    Approve Both
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleReject(p.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#EF4444] hover:text-[#DC2626] transition-colors disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewProvider(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#71717A] hover:text-[#18181B] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    View docs
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AdminHelpButton />

      {/* Document Review Modal */}
      {reviewProvider && (
        <DocumentReviewModal
          provider={{
            id: reviewProvider.id,
            name: reviewProvider.user?.name || 'Provider',
            trade: reviewProvider.tradeCategory,
            location: reviewProvider.location,
            submittedAt: undefined,
            docs: [],
            docUrls: [],
          }}
          onClose={() => setReviewProvider(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
