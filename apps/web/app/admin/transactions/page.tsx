'use client';

import { useState, useEffect } from 'react';
import { Card, Badge, Skeleton, StatusBanner } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate, formatNaira } from '@/lib/utils';
import type { Transaction } from '@/types';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.admin.transactions();
        setTransactions(res.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const statusColor: Record<string, string> = {
    PENDING: 'bg-warning-bg text-warning-text',
    SUCCESSFUL: 'bg-success-bg text-success-text',
    FAILED: 'bg-error-bg text-error-text',
    REFUNDED: 'bg-info-bg text-info-text',
    DISPUTED: 'bg-error-bg text-error-text',
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-heading text-neutral-900 mb-6">Transactions</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><Skeleton className="h-12 w-full" /></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-heading text-neutral-900 mb-6">Transactions</h1>

      {error && <StatusBanner variant="error" className="mb-4">{error}</StatusBanner>}

      {transactions.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-display mb-2">💳</p>
          <p className="text-body text-neutral-500">No transactions yet</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-caption text-neutral-500 uppercase tracking-wide py-3 px-4">ID</th>
                <th className="text-caption text-neutral-500 uppercase tracking-wide py-3 px-4">Amount</th>
                <th className="text-caption text-neutral-500 uppercase tracking-wide py-3 px-4">Status</th>
                <th className="text-caption text-neutral-500 uppercase tracking-wide py-3 px-4">Gateway ref</th>
                <th className="text-caption text-neutral-500 uppercase tracking-wide py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-surface-border hover:bg-surface-bg transition-colors">
                  <td className="text-small text-neutral-900 py-3 px-4 font-mono">
                    {tx.id.slice(0, 8)}…
                  </td>
                  <td className="text-small text-neutral-900 py-3 px-4 font-medium">
                    {formatNaira(tx.amount)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-caption font-medium px-2 py-0.5 rounded-pill ${statusColor[tx.status] || ''}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="text-small text-neutral-500 py-3 px-4 font-mono">
                    {tx.gatewayRef.slice(0, 12)}…
                  </td>
                  <td className="text-caption text-neutral-500 py-3 px-4">
                    {formatDate(tx.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
