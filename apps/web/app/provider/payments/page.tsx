'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Skeleton, StatusBanner, Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { formatNaira, formatDate } from '@/lib/utils';
import type { Transaction } from '@/types';

export default function ProviderEarningsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Bank details form state
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const txRes = await api.payments.getProviderHistory();
        setTransactions(txRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load earnings history');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleUpdateBankDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!bankCode || !accountNumber) return;
    setIsSubmittingDetails(true);
    setDetailsSuccess('');
    setError('');

    try {
      await api.payouts.submitDetails({ bankCode, accountNumber });
      setDetailsSuccess('Bank payout details updated successfully!');
      setBankCode('');
      setAccountNumber('');
      setShowBankModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update bank details');
    } finally {
      setIsSubmittingDetails(false);
    }
  }

  // Monthly stats computations (in kobo)
  const now = new Date();
  const currentMonthName = now.toLocaleString('en-US', { month: 'long' });
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Successful transactions for this month
  const thisMonthTxs = transactions.filter((t) => {
    const d = new Date(t.createdAt);
    return (
      (t.status === 'SUCCESSFUL' || t.payoutStatus === 'RELEASED') &&
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear
    );
  });

  const totalEarnedKobo = thisMonthTxs.reduce((sum, t) => sum + t.amount, 0);

  const inEscrowKobo = transactions
    .filter((t) => t.status === 'SUCCESSFUL' && t.payoutStatus !== 'RELEASED')
    .reduce((sum, t) => sum + t.amount, 0);

  const withdrawnKobo = transactions
    .filter((t) => t.payoutStatus === 'RELEASED')
    .reduce((sum, t) => sum + t.amount, 0);

  // Compute Weekly Earnings Breakdown for 4 weeks of the current month
  const weeklyEarningsKobo = [0, 0, 0, 0];
  thisMonthTxs.forEach((t) => {
    const day = new Date(t.createdAt).getDate();
    if (day <= 7) weeklyEarningsKobo[0] += t.amount;
    else if (day <= 14) weeklyEarningsKobo[1] += t.amount;
    else if (day <= 21) weeklyEarningsKobo[2] += t.amount;
    else weeklyEarningsKobo[3] += t.amount;
  });

  const maxWeeklyKobo = Math.max(...weeklyEarningsKobo, 100000); // minimum scale

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] py-8 px-4 md:px-6">
        <div className="max-w-xl mx-auto space-y-4">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-44 w-full rounded-card" />
          <Skeleton className="h-48 w-full rounded-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] py-6 px-4 md:px-6 pb-20">
      <div className="max-w-xl mx-auto space-y-5">
        {/* Top Bar Header matching mockup */}
        <div className="flex items-center justify-between">
          <Link
            href="/provider/dashboard"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-neutral-900 hover:text-primary-base transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Earnings
          </Link>

          <button
            type="button"
            onClick={() => setShowBankModal(!showBankModal)}
            className="text-xs text-primary-base font-semibold hover:underline bg-primary-tint px-3 py-1.5 rounded-full"
          >
            Bank Details ⚙️
          </button>
        </div>

        {error && <StatusBanner variant="error">{error}</StatusBanner>}
        {detailsSuccess && <StatusBanner variant="success">{detailsSuccess}</StatusBanner>}

        {/* Bank Details Drawer/Modal */}
        {showBankModal && (
          <Card className="border border-primary-base bg-white">
            <h3 className="text-small font-semibold text-neutral-900 mb-2">Configure Payout Bank Account</h3>
            <form onSubmit={handleUpdateBankDetails} className="space-y-3">
              <Input
                label="Bank Code"
                placeholder="e.g. 044 (Access Bank), 058 (GTB)"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                required
              />
              <Input
                label="Account Number"
                placeholder="10-digit NUBAN number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" isLoading={isSubmittingDetails} className="w-full text-small py-2.5">
                  Save Bank Details
                </Button>
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="px-4 py-2 text-small text-neutral-600 border border-surface-border rounded-component hover:bg-neutral-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Main Green Banner matching 5th reference mockup */}
        <div className="bg-[#1A6B3C] text-white rounded-card p-6 shadow-md relative overflow-hidden">
          <p className="text-xs font-medium text-emerald-100/90 mb-1">
            Total earned — {currentMonthName} {currentYear}
          </p>

          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6">
            {formatNaira(totalEarnedKobo)}
          </h2>

          <div className="grid grid-cols-2 gap-4 text-small mb-6 pt-4 border-t border-emerald-500/40">
            <div>
              <p className="text-caption text-emerald-200/90">In escrow</p>
              <p className="text-body font-bold text-white mt-0.5">{formatNaira(inEscrowKobo)}</p>
            </div>
            <div>
              <p className="text-caption text-emerald-200/90">Withdrawn</p>
              <p className="text-body font-bold text-white mt-0.5">{formatNaira(withdrawnKobo)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowBankModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-emerald-700/80 border border-emerald-400/50 hover:bg-emerald-700 rounded-component transition-colors"
          >
            Withdraw funds
          </button>
        </div>

        {/* Weekly Earnings Chart matching mockup */}
        <div className="bg-white rounded-card border border-surface-border p-5 shadow-xs">
          <h3 className="text-small font-semibold text-neutral-900 mb-4">
            Weekly earnings ({currentMonthName})
          </h3>

          <div className="flex items-end justify-between gap-4 h-36 pt-4 px-2">
            {['W1', 'W2', 'W3', 'W4'].map((weekLabel, index) => {
              const weekAmount = weeklyEarningsKobo[index];
              const heightPercent = Math.max(12, Math.round((weekAmount / maxWeeklyKobo) * 100));

              return (
                <div key={weekLabel} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div
                    className="w-full bg-[#1A6B3C] rounded-t-component transition-all duration-500 hover:bg-[#155630]"
                    style={{ height: `${heightPercent}%` }}
                    title={`${weekLabel}: ${formatNaira(weekAmount)}`}
                  />
                  <span className="text-caption font-medium text-neutral-500">{weekLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions List matching mockup */}
        <div className="bg-white rounded-card border border-surface-border p-5 shadow-xs">
          <h3 className="text-small font-semibold text-neutral-900 mb-4">
            Recent transactions
          </h3>

          {transactions.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-surface-border rounded-component">
              <p className="text-small text-neutral-500">No payment transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isHeld = tx.payoutStatus === 'PENDING' && tx.status === 'SUCCESSFUL';
                const isReleased = tx.payoutStatus === 'RELEASED';
                const isDisputed = tx.status === 'DISPUTED';

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3.5 rounded-component border border-surface-border bg-neutral-0 hover:bg-neutral-50/70 transition-colors"
                  >
                    <div>
                      <h4 className="text-small font-semibold text-neutral-900">
                        {tx.provider?.tradeCategory || 'Service Job'}
                      </h4>
                      <p className="text-caption text-neutral-500 mt-0.5">
                        {tx.consumer?.name || 'Customer'} • {formatDate(tx.createdAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-small font-bold text-neutral-900">
                        {formatNaira(tx.amount)}
                      </p>
                      <span
                        className={`inline-block text-caption font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                          isHeld
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : isReleased
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : isDisputed
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                        }`}
                      >
                        {isHeld ? 'Held' : isReleased ? 'Released' : isDisputed ? 'Disputed' : tx.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
