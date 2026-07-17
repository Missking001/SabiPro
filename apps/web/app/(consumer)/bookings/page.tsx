'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { Transaction } from '@/types';
import { StatusBanner } from '@/components/ui';

export default function BookingsPage() {
  const { isAuthenticated, isConsumer, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isConsumer) return;

    fetchBookings();
  }, [isAuthenticated, isConsumer]);

  async function fetchBookings() {
    try {
      setLoading(true);
      setError('');
      const res = await api.payments.getConsumerHistory();
      setBookings(res.data || []);
    } catch (err) {
      setError('Something went wrong. Please try again later');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmComplete(id: string) {
    if (actionLoadingId) return;
    setActionLoadingId(id);
    try {
      await api.payments.releasePayout(id);
      // Refresh list
      await fetchBookings();
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : 'Failed to confirm completion. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleRaiseDispute(id: string) {
    if (actionLoadingId) return;
    if (!confirm('Are you sure you want to raise a dispute for this booking? Our team will review it.')) return;
    setActionLoadingId(id);
    try {
      await api.payments.dispute(id);
      // Refresh list
      await fetchBookings();
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : 'Failed to raise dispute. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  }

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 animate-pulse">
        <div className="h-8 w-48 bg-neutral-300 rounded mb-8" />
        <div className="space-y-4">
          <div className="h-32 bg-neutral-200 rounded-card" />
          <div className="h-32 bg-neutral-200 rounded-card" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isConsumer) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-12 text-center">
        <p className="text-display mb-2">🔒</p>
        <h2 className="text-subhead text-neutral-900 mb-2">Access Denied</h2>
        <p className="text-small text-neutral-500 mb-6">Please log in as a consumer to view your bookings.</p>
        <Link href="/login" className="inline-block bg-primary-base hover:bg-primary-deep text-white px-6 py-2.5 rounded-component font-medium">
          Sign In
        </Link>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (booking: Transaction) => {
    // Escrow state (successful payment, pending release)
    if (booking.status === 'SUCCESSFUL' && booking.payoutStatus === 'PENDING') {
      return (
        <span className="inline-flex items-center bg-[#FAEEDA] border border-[#FAC775] text-[#BA7517] text-[10px] font-medium px-2.5 py-0.5 rounded-full">
          In escrow
        </span>
      );
    }
    // Completed state (successful payment, released payout)
    if (booking.status === 'SUCCESSFUL' && booking.payoutStatus === 'RELEASED') {
      return (
        <span className="inline-flex items-center bg-[#EAF5EE] border border-[#9FE1CB] text-[#0F6E56] text-[10px] font-medium px-2.5 py-0.5 rounded-full">
          Completed
        </span>
      );
    }
    // Disputed
    if (booking.status === 'DISPUTED') {
      return (
        <span className="inline-flex items-center bg-[#FCEBEB] border border-[#F7C1C1] text-[#A32D2D] text-[10px] font-medium px-2.5 py-0.5 rounded-full">
          Disputed
        </span>
      );
    }
    // Failed
    if (booking.status === 'FAILED') {
      return (
        <span className="inline-flex items-center bg-neutral-100 border border-neutral-300 text-neutral-600 text-[10px] font-medium px-2.5 py-0.5 rounded-full">
          Failed
        </span>
      );
    }
    // Pending Checkout/Payment
    return (
      <span className="inline-flex items-center bg-neutral-50 border border-neutral-200 text-neutral-500 text-[10px] font-medium px-2.5 py-0.5 rounded-full">
        Pending payment
      </span>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-full bg-neutral-0 border border-surface-border text-neutral-700 flex items-center justify-center transition-all hover:bg-neutral-50 active:scale-95 shadow-sm"
          aria-label="Back to dashboard"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-heading text-neutral-900 font-medium">My Bookings</h1>
      </div>

      {error && (
        <StatusBanner variant="error" className="mb-6">
          {error}
        </StatusBanner>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-32 bg-neutral-100 border border-surface-border rounded-card animate-pulse" />
          <div className="h-32 bg-neutral-100 border border-surface-border rounded-card animate-pulse" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-neutral-0 border border-surface-border rounded-card p-12 text-center">
          <div className="w-16 h-16 bg-[#FAEEDA] text-[#EF9F27] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h2 className="text-subhead font-medium text-neutral-900 mb-1">No Bookings Yet</h2>
          <p className="text-small text-neutral-500 mb-6">When you book and pay a service provider, your history will show up here.</p>
          <Link href="/dashboard" className="inline-block bg-primary-base hover:bg-primary-deep text-white px-6 py-2.5 rounded-component font-medium transition-colors">
            Browse Services
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const shortId = `BK-${booking.id.slice(-4).toUpperCase()}`;
            const category = booking.provider?.tradeCategory 
              ? `${booking.provider.tradeCategory.charAt(0).toUpperCase()}${booking.provider.tradeCategory.slice(1)} service`
              : 'Service booking';
            
            const providerName = booking.provider?.user?.name || 'Vetted Provider';

            // Escrow state (successful payment, pending release)
            const isEscrow = booking.status === 'SUCCESSFUL' && booking.payoutStatus === 'PENDING';
            const isDisputed = booking.status === 'DISPUTED';

            return (
              <div key={booking.id} className="bg-neutral-0 border border-surface-border rounded-card p-5 md:p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-body font-medium text-neutral-900">{category}</h3>
                    <p className="text-caption text-neutral-500 mt-0.5">with {providerName}</p>
                  </div>
                  {getStatusBadge(booking)}
                </div>

                <div className="border-t border-surface-border/60 pt-3 flex items-center justify-between text-caption">
                  <span className="text-neutral-500">{shortId} • Booked {formatDate(booking.createdAt)}</span>
                  <span className="text-body font-medium text-neutral-900">
                    ₦{(booking.amount / 100).toLocaleString('en-NG')}
                  </span>
                </div>

                {isEscrow && (
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => handleConfirmComplete(booking.id)}
                      disabled={actionLoadingId !== null}
                      className="flex-1 h-11 bg-primary-base hover:bg-primary-deep text-white text-small font-medium rounded-component transition-all disabled:opacity-50"
                    >
                      {actionLoadingId === booking.id ? 'Confirming...' : 'Confirm complete'}
                    </button>
                    <button
                      onClick={() => handleRaiseDispute(booking.id)}
                      disabled={actionLoadingId !== null}
                      className="flex-1 h-11 border border-[#E24B4A] hover:bg-[#FCEBEB] text-[#E24B4A] text-small font-medium rounded-component transition-all disabled:opacity-50"
                    >
                      {actionLoadingId === booking.id ? 'Loading...' : 'Raise dispute'}
                    </button>
                  </div>
                )}

                {isDisputed && (
                  <div className="bg-[#FCEBEB] border border-[#F7C1C1] text-[#A32D2D] rounded-component p-3 text-caption">
                    Dispute raised — our team will review within 48 hours.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
