'use client';

import { useState, useEffect } from 'react';
import { Skeleton, StatusBanner } from '@/components/ui';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/components/admin/SidebarContext';
import type { Transaction } from '@/types';

type TxFilter = 'All' | 'Held' | 'Released' | 'Disputed';

function formatTxDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

function getDisplayStatus(tx: Transaction): { label: string; colorClass: string } {
  if (tx.status === 'DISPUTED') {
    return { label: 'Disputed', colorClass: 'text-[#EF4444] bg-[#FEF2F2]' };
  }
  if (tx.status === 'SUCCESSFUL') {
    if (tx.payoutStatus === 'RELEASED') {
      return { label: 'Released', colorClass: 'text-[#1A6B3C] bg-[#EAF5EE]' };
    }
    return { label: 'Held', colorClass: 'text-[#D4801A] bg-[#FAEEDA]' };
  }
  if (tx.status === 'PENDING') {
    return { label: 'Pending', colorClass: 'text-[#D4801A] bg-[#FAEEDA]' };
  }
  if (tx.status === 'REFUNDED') {
    return { label: 'Refunded', colorClass: 'text-[#185FA5] bg-[#E6F1FB]' };
  }
  if (tx.status === 'FAILED') {
    return { label: 'Failed', colorClass: 'text-[#71717A] bg-[#F4F4F5]' };
  }
  return { label: tx.status, colorClass: 'text-[#71717A] bg-[#F4F4F5]' };
}

export default function AdminTransactionsPage() {
  const { user } = useAuth();
  const { toggle: toggleSidebar } = useSidebar();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<TxFilter>('All');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.admin.transactions();
        setTransactions(res.data || []);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError('Failed to load transactions');
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function handleRelease(txId: string) {
    setActionLoading(txId);
    setError('');
    setFeedback('');
    try {
      const res = await api.payments.releasePayout(txId);
      setFeedback(res.data?.message || `Release initiated for ${txId}`);
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === txId ? { ...tx, payoutStatus: 'RELEASED' as const } : tx,
        ),
      );
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Failed to release payout');
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRefund(txId: string) {
    setActionLoading(txId);
    setError('');
    setFeedback('');
    try {
      const res = await api.payments.refund(txId);
      setFeedback(res.data?.message || `Refund processed for ${txId}`);
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === txId ? { ...tx, status: 'REFUNDED' as const } : tx,
        ),
      );
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Failed to process refund');
      }
    } finally {
      setActionLoading(null);
    }
  }

  const filters: TxFilter[] = ['All', 'Held', 'Released', 'Disputed'];

  const filtered = transactions.filter((tx) => {
    if (activeFilter === 'All') return true;
    const { label } = getDisplayStatus(tx);
    return label === activeFilter;
  });

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
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="py-4 border-b border-[#F4F4F5] last:border-b-0">
              <Skeleton className="h-4 w-full" />
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
        <h1 className="text-[26px] font-bold text-[#18181B] leading-tight">Transaction Monitor</h1>
        <p className="text-sm text-[#71717A] mt-1">
          Escrow payments and fund releases via Flutterwave
        </p>
      </div>

      {error && <StatusBanner variant="error" className="mb-0">{error}</StatusBanner>}
      {feedback && <StatusBanner variant="success" className="mb-0">{feedback}</StatusBanner>}

      {/* ── Filter Tabs ── */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 text-xs font-semibold rounded-full border transition-colors ${
              activeFilter === f
                ? 'bg-[#18181B] text-white border-[#18181B]'
                : 'bg-white text-[#18181B] border-[#E5E7EB] hover:bg-[#F4F4F5]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Transactions Table ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] text-center py-16">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-sm text-[#71717A]">No transactions match this filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#F4F4F5]">
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6 whitespace-nowrap">TXN ID</th>
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Consumer</th>
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Provider</th>
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Service</th>
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Amount</th>
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Status</th>
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Date</th>
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const displayStatus = getDisplayStatus(tx);
                  const consumer = tx.consumer?.name || `ID: ${tx.consumerId.slice(0, 6)}`;
                  const provider = tx.provider?.user?.name || `ID: ${tx.providerId.slice(0, 6)}`;
                  const service = tx.provider?.tradeCategory || '—';
                  const txId = `TXN-${tx.id.slice(0, 4)}`;

                  const isHeld = displayStatus.label === 'Held';
                  const isDisputed = displayStatus.label === 'Disputed';

                  return (
                    <tr key={tx.id} className="border-b border-[#F4F4F5] last:border-b-0 hover:bg-[#FAFAF9] transition-colors">
                      <td className="py-4 px-6 text-sm text-[#71717A] font-mono whitespace-nowrap">{txId}</td>
                      <td className="py-4 px-6 text-sm text-[#71717A]">{consumer}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-[#18181B]">{provider}</td>
                      <td className="py-4 px-6 text-sm text-[#71717A] italic">{service}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-[#18181B] whitespace-nowrap">{formatNaira(tx.amount)}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${displayStatus.colorClass}`}>
                          {displayStatus.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-[#71717A] whitespace-nowrap">{formatTxDate(tx.createdAt)}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {isHeld && (
                            <button
                              type="button"
                              onClick={() => handleRelease(tx.id)}
                              disabled={actionLoading === tx.id}
                              className="text-xs font-semibold text-[#1A6B3C] border border-[#1A6B3C] px-3 py-1.5 rounded-md hover:bg-[#EAF5EE] transition-colors disabled:opacity-50"
                            >
                              {actionLoading === tx.id ? '...' : 'Release'}
                            </button>
                          )}
                          {isDisputed && (
                            <button
                              type="button"
                              onClick={() => handleRefund(tx.id)}
                              disabled={actionLoading === tx.id}
                              className="text-xs font-semibold text-[#EF4444] border border-[#EF4444] px-3 py-1.5 rounded-md hover:bg-[#FEF2F2] transition-colors disabled:opacity-50"
                            >
                              {actionLoading === tx.id ? '...' : 'Refund'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setFeedback(`${service} — ₦${(tx.amount / 100).toLocaleString('en-NG')} by ${consumer} → ${provider}`)}
                            className="text-sm text-[#71717A] hover:text-[#18181B] font-medium transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Footer note ── */}
          <div className="px-6 py-4 border-t border-[#F4F4F5]">
            <p className="text-xs text-[#A1A1AA] italic">
              Funds held in escrow auto-release to provider 7 days after job completion if no dispute is raised.
            </p>
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
