'use client';

import { useState, useEffect } from 'react';
import { Skeleton, StatusBanner } from '@/components/ui';
import { api, ApiClientError } from '@/lib/api';
import { AdminHeader, FloatingHelpButton } from '@/components/admin/AdminHeader';

interface FlaggedItem {
  id: string;
  type: 'Review' | 'Profile';
  target: string;
  reporter: string;
  reason: string;
  date: string;
  status: string;
}

const fallbackFlags: FlaggedItem[] = [
  {
    id: 'flag-1',
    type: 'Review',
    target: 'Emeka Okafor',
    reporter: 'Anonymous',
    reason: 'Suspected fake review — generic language, no booking record',
    date: '2 Jul 2025',
    status: 'PENDING',
  },
  {
    id: 'flag-2',
    type: 'Profile',
    target: 'Fast Fix Mechanics',
    reporter: 'Tunde B.',
    reason: 'Credentials listed do not match submitted documents',
    date: '1 Jul 2025',
    status: 'PENDING',
  },
  {
    id: 'flag-3',
    type: 'Review',
    target: 'Adaeze Nwosu',
    reporter: 'Kemi A.',
    reason: 'Offensive language in review response',
    date: '30 Jun 2025',
    status: 'PENDING',
  },
];

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState<FlaggedItem[]>(fallbackFlags);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFeedback, setActionFeedback] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.admin.flags();
        if (res.data && res.data.length > 0) {
          const mapped: FlaggedItem[] = res.data.map((f, idx) => ({
            id: f.id,
            type: f.targetType === 'REVIEW' ? 'Review' : 'Profile',
            target: f.targetId ? `Item #${f.targetId.slice(0, 6)}` : `Provider #${idx + 1}`,
            reporter: f.reportedBy ? 'User' : 'Anonymous',
            reason: f.reason || 'Flagged for content review',
            date: new Date(f.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            status: f.status,
          }));
          setFlags(mapped);
        }
      } catch (err: any) {
        // Fallback preview
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function handleResolve(id: string, action: 'REMOVE' | 'DISMISS') {
    setProcessingId(id);
    setActionFeedback('');
    try {
      if (!id.startsWith('flag-')) {
        await api.admin.resolveFlag(id, action);
      }
      setFlags((prev) => prev.filter((f) => f.id !== id));
      setActionFeedback(`Item ${action === 'REMOVE' ? 'removed' : 'dismissed'} successfully.`);
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
      <div className="w-full">
        <AdminHeader />
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs w-full space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 relative pb-12">
      <AdminHeader />

      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#18181B] tracking-tight">
          Flagged Content
        </h1>
        <p className="text-sm text-[#71717A] mt-0.5">
          {flags.length} item{flags.length === 1 ? '' : 's'} pending moderation
        </p>
      </div>

      {actionFeedback && <StatusBanner variant="success" className="my-2">{actionFeedback}</StatusBanner>}
      {error && <StatusBanner variant="error" className="my-2">{error}</StatusBanner>}

      {flags.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-16 text-center shadow-xs w-full">
          <div className="w-12 h-12 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            ✓
          </div>
          <p className="text-base font-semibold text-[#18181B]">No flagged content to review</p>
          <p className="text-sm text-[#71717A] mt-1">Community reviews and profile content are all clear.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-xs overflow-hidden w-full">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F4F4F5] bg-[#F9F9F8]">
                  <th className="py-3.5 px-6 text-xs font-semibold text-[#71717A]">Type</th>
                  <th className="py-3.5 px-6 text-xs font-semibold text-[#71717A]">Target</th>
                  <th className="py-3.5 px-6 text-xs font-semibold text-[#71717A]">Reporter</th>
                  <th className="py-3.5 px-6 text-xs font-semibold text-[#71717A]">Reason</th>
                  <th className="py-3.5 px-6 text-xs font-semibold text-[#71717A]">Date</th>
                  <th className="py-3.5 px-6 text-xs font-semibold text-[#71717A]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5]">
                {flags.map((flag) => (
                  <tr key={flag.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-4 px-6">
                      {flag.type === 'Review' ? (
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                          Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                          Profile
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-[#18181B]">
                      {flag.target}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#71717A]">
                      {flag.reporter}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#52525B] max-w-xs truncate">
                      {flag.reason}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#71717A]">
                      {flag.date}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={processingId === flag.id}
                          onClick={() => handleResolve(flag.id, 'DISMISS')}
                          className="border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#374151] text-xs font-semibold px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                        >
                          Dismiss
                        </button>

                        <button
                          type="button"
                          disabled={processingId === flag.id}
                          onClick={() => handleResolve(flag.id, 'REMOVE')}
                          className="border border-[#FCA5A5] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FloatingHelpButton />
    </div>
  );
}
