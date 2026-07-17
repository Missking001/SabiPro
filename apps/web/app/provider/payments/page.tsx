'use client';

import { useState, useEffect } from 'react';
import { Card, Badge, Skeleton, StatusBanner, Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import type { Transaction } from '@/types';

function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

export default function ProviderPaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const txRes = await api.payments.getProviderHistory();
        setTransactions(txRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load payments history');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function handleUpdateDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!bankCode || !accountNumber) return;
    setIsSubmittingDetails(true);
    setDetailsSuccess('');
    setError('');

    try {
      await api.payouts.submitDetails({ bankCode, accountNumber });
      setDetailsSuccess('Bank details updated successfully.');
      setBankCode('');
      setAccountNumber('');
    } catch (err: any) {
      setError(err.message || 'Failed to update bank details');
    } finally {
      setIsSubmittingDetails(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <h1 className="text-heading text-neutral-900 mb-6">Payments & Payouts</h1>
        <Card><Skeleton className="h-64 w-full" /></Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <h1 className="text-heading text-neutral-900 mb-6">Payments & Payouts</h1>

      {error && <StatusBanner variant="error" className="mb-4">{error}</StatusBanner>}
      {detailsSuccess && <StatusBanner variant="success" className="mb-4">{detailsSuccess}</StatusBanner>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <h2 className="text-subhead text-neutral-900 mb-4">Payout Details</h2>
            <p className="text-small text-neutral-500 mb-4">
              Enter your bank details to receive payouts. SabiPro deducts a small platform fee from each released payment.
            </p>
            <form onSubmit={handleUpdateDetails} className="space-y-4">
              <div>
                <label className="block text-caption font-medium text-neutral-700 mb-1">Bank Code</label>
                <Input 
                  placeholder="e.g. 044 (Access Bank)" 
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-caption font-medium text-neutral-700 mb-1">Account Number</label>
                <Input 
                  placeholder="10-digit number" 
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" isLoading={isSubmittingDetails} className="w-full">
                Save Details
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-subhead text-neutral-900 mb-4">Transaction History</h2>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-display mb-2">💸</p>
                <p className="text-body text-neutral-500">No transactions yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 border border-surface-border rounded-component flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-neutral-900 text-subhead">{formatNaira(tx.amount)}</span>
                        <Badge variant={tx.status === 'SUCCESSFUL' ? 'success' : tx.status === 'PENDING' ? 'warning' : 'error'}>
                          {tx.status}
                        </Badge>
                      </div>
                      <p className="text-small text-neutral-500">Gateway Ref: {tx.gatewayRef}</p>
                      <p className="text-caption text-neutral-500">Date: {new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
