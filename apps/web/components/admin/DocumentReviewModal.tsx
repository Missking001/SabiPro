'use client';

import { useState } from 'react';

interface ProviderForReview {
  id: string;
  name: string;
  trade: string;
  location: string;
  submittedAt?: string;
  docs: string[];
}

interface DocumentReviewModalProps {
  provider: ProviderForReview;
  onClose: () => void;
  onApprove: (id: string, badgeType: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export function DocumentReviewModal({ provider, onClose, onApprove, onReject }: DocumentReviewModalProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  async function handleApprove(badgeType: string) {
    setActionLoading(badgeType);
    setFeedback('');
    try {
      await onApprove(provider.id, badgeType);
      setFeedback(`Provider approved (${badgeType})`);
      setTimeout(onClose, 1200);
    } catch {
      setFeedback('Action failed. Try again.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    setActionLoading('reject');
    setFeedback('');
    try {
      await onReject(provider.id);
      setFeedback('Provider rejected');
      setTimeout(onClose, 1200);
    } catch {
      setFeedback('Action failed. Try again.');
    } finally {
      setActionLoading(null);
    }
  }

  const submittedDate = provider.submittedAt
    ? new Date(provider.submittedAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative z-10 shadow-2xl border border-[#E5E7EB] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-[#18181B]">Document Review</h2>
            <p className="text-sm text-[#71717A] mt-1">
              Reviewing documents for {provider.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Provider info */}
        <div className="bg-[#FAFAF9] rounded-xl p-4 mb-5 space-y-1">
          <p className="text-sm font-semibold text-[#18181B]">{provider.name}</p>
          <p className="text-sm text-[#71717A]">{provider.trade} · {provider.location}</p>
          {submittedDate && (
            <p className="text-xs text-[#A1A1AA]">Submitted {submittedDate}</p>
          )}
        </div>

        {/* Document previews */}
        <p className="text-xs font-semibold text-[#71717A] uppercase tracking-wide mb-3">Submitted Documents</p>
        <div className="space-y-3 mb-6">
          {provider.docs.map((doc) => (
            <div
              key={doc}
              className="border border-[#E5E7EB] rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-12 h-14 rounded-lg bg-[#F4F4F5] flex items-center justify-center text-[#A1A1AA] flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#18181B]">{doc}</p>
                <p className="text-xs text-[#A1A1AA] mt-0.5">Uploaded document · PDF</p>
              </div>
              <button
                type="button"
                className="text-xs text-[#1A6B3C] hover:text-[#15573A] font-medium flex-shrink-0"
              >
                View
              </button>
            </div>
          ))}
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`text-sm font-medium mb-4 ${feedback.includes('failed') ? 'text-[#EF4444]' : 'text-[#1A6B3C]'}`}>
            {feedback}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[#F4F4F5]">
          <button
            type="button"
            disabled={!!actionLoading}
            onClick={() => handleApprove('IDENTITY')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1A6B3C] rounded-full hover:bg-[#15573A] transition-colors disabled:opacity-50"
          >
            {actionLoading === 'IDENTITY' ? 'Processing...' : 'Approve ID'}
          </button>
          <button
            type="button"
            disabled={!!actionLoading}
            onClick={() => handleApprove('CREDENTIAL')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#185FA5] rounded-full hover:bg-[#134D88] transition-colors disabled:opacity-50"
          >
            {actionLoading === 'CREDENTIAL' ? 'Processing...' : 'Approve Credential'}
          </button>
          <button
            type="button"
            disabled={!!actionLoading}
            onClick={() => handleApprove('BOTH')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1A6B3C] rounded-full hover:bg-[#15573A] transition-colors disabled:opacity-50"
          >
            {actionLoading === 'BOTH' ? 'Processing...' : 'Approve Both'}
          </button>
          <button
            type="button"
            disabled={!!actionLoading}
            onClick={handleReject}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#EF4444] hover:text-[#DC2626] transition-colors disabled:opacity-50"
          >
            {actionLoading === 'reject' ? 'Processing...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
