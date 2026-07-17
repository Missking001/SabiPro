'use client';

import { useState, useEffect } from 'react';
import { Card, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { formatNaira } from '@/lib/utils';

interface DashboardStats {
  totalUsers: number;
  activeProviders: number;
  totalInquiries: number;
  totalTransactions: number;
  platformRevenue: number;
  pendingVetting: number;
  pendingFlags: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.admin.dashboard();
        if (res.data) setStats(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const items = [
    { label: 'Total users', value: stats?.totalUsers ?? 0, icon: '👥' },
    { label: 'Active providers', value: stats?.activeProviders ?? 0, icon: '🔧' },
    { label: 'Inquiries this month', value: stats?.totalInquiries ?? 0, icon: '📩' },
    { label: 'Transactions this month', value: stats?.totalTransactions ?? 0, icon: '💳' },
    { label: 'Platform revenue', value: formatNaira(stats?.platformRevenue ?? 0), icon: '💰' },
    { label: 'Pending vetting', value: stats?.pendingVetting ?? 0, icon: '🛡️' },
    { label: 'Pending flags', value: stats?.pendingFlags ?? 0, icon: '🚩' },
  ];

  if (isLoading) {
    return (
      <div>
        <h1 className="text-heading text-neutral-900 mb-6">Admin dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-heading text-neutral-900 mb-6">Admin dashboard</h1>
        <Card className="text-center py-12">
          <p className="text-body text-error-base mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-small text-primary-base hover:text-primary-hover font-medium"
          >
            Try again
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-heading text-neutral-900 mb-6">Admin dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-neutral-500 uppercase tracking-wide mb-1">
                  {item.label}
                </p>
                <p className="text-display font-medium text-neutral-900">{item.value}</p>
              </div>
              <span className="text-2xl">{item.icon}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
