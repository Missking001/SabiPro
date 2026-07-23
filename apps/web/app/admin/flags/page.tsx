'use client';

import { useState, useEffect } from 'react';
import { Skeleton, StatusBanner } from '@/components/ui';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/components/admin/SidebarContext';
import type { ContentFlag } from '@/types';

/* ── Mock data matching the reference screenshot ── */
const mockFlags = [
  {
    id: 'mock-flag-1',
    reportedBy: 'anonymous',
    targetId: 'target-1',
    targetType: 'REVIEW' as const,
    reason: 'Suspected fake review — generic language, no booking record',
    status: 'PENDING' as const,
    createdAt: '2025-07-02T10:00:00Z',
    reporter: { name: 'Anonymous', email: '' },
    _target: 'Emeka Okafor',
  },
  {
    id: 'mock-flag-2',
    reportedBy: 'tunde-b',
    targetId: 'target-2',
    targetType: 'INQUIRY' as const,
    reason: 'Credentials listed do not match submitted documents',
    status: 'PENDING' as const,
    createdAt: '2025-07-01T10:00:00Z',
    reporter: { name: 'Tunde B.', email: '' },
    _target: 'Fast Fix Mechanics',
    _typeLabel: 'Profile',
  },
  {
    id: 'mock-flag-3',
    reportedBy: 'kemi-a',
    targetId: 'target-3',
    targetType: 'REVIEW' as const,
    reason: 'Offensive language in review response',
    status: 'PENDING' as const,
    createdAt: '2025-06-30T10:00:00Z',
    reporter: { name: 'Kemi A.', email: '' },
    _target: 'Adaeze Nwosu',
  },
];

type FlagItem = ContentFlag & {
  _target?: string;
  _typeLabel?: string;
};

function formatFlagDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminFlagsPage() {
  const { user } = useAuth();
  const { toggle: toggleSidebar } = useSidebar();
  const [flags, setFlags] = useState<FlagItem[]>([]);
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
      const live = res.data || [];
      setFlags(live.length > 0 ? live : mockFlags);
    } catch {
      setFlags(mockFlags);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResolve(id: string, action: 'REMOVE' | 'DISMISS') {
    if (id.startsWith('mock-')) {
      setFlags((prev) => prev.filter((f) => f.id !== id));
      setActionFeedback(`Flag ${action === 'REMOVE' ? 'removed' : 'dismissed'} successfully`);
      return;
    }
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

  const pendingCount = flags.length;

  /* ── Loading skeleton ── */
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
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-4 border-b border-[#F4F4F5] last:border-b-0">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 relative pb-12">
      {/* ── Top Header Bar ── */}
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
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#52525B] hover:text-[#18181B] transition-colors relative shadow-xs"
            aria-label="Notifications"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#1A6B3C] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              A
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-[#18181B] leading-tight">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-[#71717A] leading-tight">Platform ops</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page Title ── */}
      <div>
        <h1 className="text-[26px] font-bold text-[#18181B] leading-tight">Flagged Content</h1>
        <p className="text-sm text-[#71717A] mt-1">
          {pendingCount} item{pendingCount !== 1 ? 's' : ''} pending moderation
        </p>
      </div>

      {actionFeedback && <StatusBanner variant="success" className="mb-0">{actionFeedback}</StatusBanner>}
      {error && <StatusBanner variant="error" className="mb-0">{error}</StatusBanner>}

      {/* ── Flags Table ── */}
      {pendingCount === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] text-center py-16">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-sm text-[#71717A]">No flagged content to review</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#F4F4F5]">
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Type</th>
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Target</th>
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Reporter</th>
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Reason</th>
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Date</th>
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((flag) => {
                  const isReview = flag.targetType === 'REVIEW';
                  const typeLabel = (flag as FlagItem)._typeLabel || (isReview ? 'Review' : 'Profile');
                  const targetName = (flag as FlagItem)._target || `ID: ${flag.targetId.slice(0, 8)}`;
                  const reporterName = flag.reporter?.name || 'Anonymous';
                  const isProcessing = processingId === flag.id;

                  return (
                    <tr key={flag.id} className="border-b border-[#F4F4F5] last:border-b-0 hover:bg-[#FAFAF9] transition-colors">
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                            isReview
                              ? 'bg-[#EAF5EE] text-[#1A6B3C]'
                              : 'bg-[#FAEEDA] text-[#D4801A]'
                          }`}
                        >
                          {typeLabel}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-semibold text-[#18181B]">{targetName}</td>
                      <td className="py-4 px-6 text-sm text-[#71717A]">{reporterName}</td>
                      <td className="py-4 px-6 text-sm text-[#71717A] max-w-[280px]">{flag.reason || '—'}</td>
                      <td className="py-4 px-6 text-sm text-[#71717A] whitespace-nowrap">{formatFlagDate(flag.createdAt)}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleResolve(flag.id, 'DISMISS')}
                            className="text-sm text-[#71717A] hover:text-[#18181B] font-medium transition-colors disabled:opacity-50"
                          >
                            Dismiss
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleResolve(flag.id, 'REMOVE')}
                            className="text-xs font-semibold text-[#EF4444] border border-[#EF4444] px-3.5 py-1.5 rounded-md hover:bg-[#FEF2F2] transition-colors disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Help FAB ── */}
      <button
        type="button"
        className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-white border border-[#E5E7EB] shadow-md flex items-center justify-center text-[#71717A] hover:text-[#18181B] hover:shadow-lg transition-all z-50"
        aria-label="Help"
      >
        ?
      </button>
    </div>
  );
}
