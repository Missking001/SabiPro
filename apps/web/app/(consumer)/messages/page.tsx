'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { Inquiry } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { StatusBanner } from '@/components/ui';

export default function MessagesPage() {
  const { isAuthenticated, isConsumer, isLoading: authLoading } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isConsumer) return;
    fetchMessages();
  }, [isAuthenticated, isConsumer]);

  async function fetchMessages() {
    try {
      setLoading(true);
      setError('');
      const res = await api.inquiries.list();
      setInquiries(res.data || []);
    } catch (err) {
      setError('Failed to load messages. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 animate-pulse">
        <div className="h-8 w-48 bg-neutral-300 rounded mb-8" />
        <div className="space-y-4">
          <div className="h-20 bg-neutral-200 rounded-card" />
          <div className="h-20 bg-neutral-200 rounded-card" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isConsumer) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-12 text-center">
        <p className="text-display mb-2">🔒</p>
        <h2 className="text-subhead text-neutral-900 mb-2">Access Denied</h2>
        <p className="text-small text-neutral-500 mb-6">Please log in as a consumer to view your messages.</p>
        <Link href="/login" className="inline-block bg-primary-base hover:bg-primary-deep text-white px-6 py-2.5 rounded-component font-medium">
          Sign In
        </Link>
      </div>
    );
  }

  const unreadCount = inquiries.filter((inq) => inq.status === 'PENDING').length;

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-full bg-neutral-0 border border-surface-border text-neutral-700 flex items-center justify-center transition-all hover:bg-neutral-50 active:scale-95 shadow-sm"
            aria-label="Back to dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h1 className="text-heading text-neutral-900 font-medium">Messages</h1>
        </div>

        {unreadCount > 0 && (
          <span className="bg-secondary-base text-white text-[10px] font-bold px-3 py-1 rounded-pill uppercase tracking-wider">
            {unreadCount} new
          </span>
        )}
      </div>

      {error && (
        <StatusBanner variant="error" className="mb-6">
          {error}
        </StatusBanner>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-20 bg-neutral-100 border border-surface-border rounded-card animate-pulse" />
          <div className="h-20 bg-neutral-100 border border-surface-border rounded-card animate-pulse" />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-neutral-0 border border-surface-border rounded-card p-12 text-center">
          <div className="w-16 h-16 bg-[#FAEEDA] text-[#EF9F27] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-subhead font-medium text-neutral-900 mb-1">No Messages</h2>
          <p className="text-small text-neutral-500 mb-6">When you send an inquiry to service providers, your conversation history will appear here.</p>
          <Link href="/dashboard" className="inline-block bg-primary-base hover:bg-primary-deep text-white px-6 py-2.5 rounded-component font-medium transition-colors">
            Find Providers
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => {
            const providerName = inquiry.provider?.user?.name || 'Vetted Provider';
            const avatarUrl = inquiry.provider?.user?.avatarUrl;
            const initials = providerName.charAt(0);
            const isUnread = inquiry.status === 'PENDING';

            return (
              <div
                key={inquiry.id}
                onClick={() => setSelectedInquiry(inquiry)}
                className="bg-neutral-0 border border-surface-border rounded-card p-4 hover:shadow-md hover:border-neutral-300 transition-all duration-200 cursor-pointer flex gap-4 items-center justify-between"
              >
                <div className="flex gap-4 items-center min-w-0 flex-1">
                  {/* Avatar wrapper */}
                  <div className="relative flex-shrink-0">
                    {avatarUrl ? (
                      <div className="w-12 h-12 relative rounded-full overflow-hidden border border-surface-border">
                        <Image
                          src={avatarUrl}
                          alt={providerName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-primary-tint text-primary-deep rounded-full flex items-center justify-center font-medium border border-surface-border">
                        {initials}
                      </div>
                    )}
                    {/* Unread dot indicator */}
                    {isUnread && (
                      <span className="absolute top-0 right-0 w-3 h-3 bg-secondary-base rounded-full border-2 border-neutral-0" />
                    )}
                  </div>

                  {/* Message Snippet */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-body font-medium text-neutral-900 truncate">
                      {providerName}
                    </h3>
                    <p className={`text-small truncate mt-0.5 ${isUnread ? 'text-neutral-900 font-medium' : 'text-neutral-500'}`}>
                      {inquiry.message}
                    </p>
                  </div>
                </div>

                {/* Relative timestamp */}
                <div className="flex-shrink-0 text-caption text-neutral-500 self-start pt-1">
                  {formatRelativeTime(inquiry.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Message View Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setSelectedInquiry(null)} />
          
          <div className="bg-neutral-0 rounded-card max-w-md w-full p-6 relative z-10 shadow-2xl border border-surface-border">
            <button 
              onClick={() => setSelectedInquiry(null)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-900"
              aria-label="Close message details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mt-2 space-y-4">
              <div className="flex items-center gap-3 border-b border-surface-border pb-4">
                {selectedInquiry.provider?.user?.avatarUrl ? (
                  <div className="w-12 h-12 relative rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={selectedInquiry.provider.user.avatarUrl}
                      alt={selectedInquiry.provider.user.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-primary-tint text-primary-deep rounded-full flex items-center justify-center font-medium flex-shrink-0">
                    {selectedInquiry.provider?.user?.name?.charAt(0) || 'P'}
                  </div>
                )}
                <div>
                  <h3 className="text-body font-medium text-neutral-900">
                    {selectedInquiry.provider?.user?.name || 'Vetted Provider'}
                  </h3>
                  <p className="text-caption text-neutral-500">
                    {selectedInquiry.provider?.tradeCategory} • {selectedInquiry.provider?.location}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-caption text-neutral-400 font-medium mb-1">SENT MESSAGE</p>
                <div className="bg-surface-bg border border-surface-border rounded-component p-4 text-body text-neutral-700 whitespace-pre-wrap leading-relaxed">
                  {selectedInquiry.message}
                </div>
              </div>

              <div className="text-caption text-neutral-500 flex items-center justify-between">
                <span>Status: <span className="font-semibold text-primary-base">{selectedInquiry.status}</span></span>
                <span>Sent {formatRelativeTime(selectedInquiry.createdAt)}</span>
              </div>

              <div className="flex gap-3 pt-2">
                {selectedInquiry.provider?.slug && (
                  <Link
                    href={`/providers/${selectedInquiry.provider.slug}`}
                    className="flex-1 h-11 bg-primary-base hover:bg-primary-deep text-white text-small font-medium rounded-component transition-colors flex items-center justify-center"
                  >
                    View Profile
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="flex-1 h-11 bg-surface-bg hover:bg-surface-bg/80 text-neutral-700 font-medium text-small rounded-component transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
