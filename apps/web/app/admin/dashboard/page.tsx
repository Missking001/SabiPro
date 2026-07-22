'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton, Card } from '@/components/ui';
import { api } from '@/lib/api';
import { formatNaira } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  totalUsers: number;
  activeProviders: number;
  totalInquiries: number;
  totalTransactions: number;
  platformRevenue: number;
  pendingVetting: number;
  pendingFlags: number;
}

const locations = ['Lagos', 'Abuja'];

function getDateRange(): string {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const year = now.getFullYear();
  return `${month} ${year}`;
}

function StatCard({
  label,
  value,
  icon,
  increase,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  increase?: string;
}) {
  const isPositive = increase && increase.startsWith('+');
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary-tint flex items-center justify-center text-primary-base">
          {icon}
        </div>
        {increase && (
          <span
            className={`text-caption font-medium flex items-center gap-0.5 ${
              isPositive ? 'text-success-base' : 'text-error-base'
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              {isPositive ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              )}
            </svg>
            {increase}
          </span>
        )}
      </div>
      <p className="text-display font-medium text-neutral-900 mb-0.5">{value}</p>
      <p className="text-caption text-neutral-500">{label}</p>
    </Card>
  );
}

function BarChart({
  title,
  data,
  color,
}: {
  title: string;
  data: { label: string; value: number }[];
  color: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <Card className="p-5">
      <p className="text-small font-medium text-neutral-900 mb-4">{title}</p>
      <div className="flex items-end gap-2 h-32">
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-sm transition-all"
              style={{
                height: `${(d.value / max) * 100}%`,
                backgroundColor: color,
                minHeight: d.value > 0 ? '4px' : '0',
              }}
            />
            <span className="text-[10px] text-neutral-500">{d.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
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

  const firstName = user?.name?.split(' ')[0] || 'A';

  const revenueData = [
    { label: 'Jan', value: 45000 },
    { label: 'Feb', value: 52000 },
    { label: 'Mar', value: 38000 },
    { label: 'Apr', value: 61000 },
    { label: 'May', value: 55000 },
    { label: 'Jun', value: 72000 },
    { label: 'Jul', value: 68000 },
  ];

  const signupData = [
    { label: 'Jan', value: 120 },
    { label: 'Feb', value: 190 },
    { label: 'Mar', value: 150 },
    { label: 'Apr', value: 280 },
    { label: 'May', value: 220 },
    { label: 'Jun', value: 340 },
    { label: 'Jul', value: 310 },
  ];

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
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
        <h1 className="text-heading text-neutral-900 mb-6">Platform Overview</h1>
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
      {/* Top header */}
      <div className="flex items-center justify-between mb-8">
        <div />
        <div className="flex items-center gap-4">
          {/* Notification bell */}
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-neutral-0 border border-surface-border flex items-center justify-center text-neutral-500 hover:text-neutral-700 transition-colors relative"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-error-base rounded-full" />
          </button>

          {/* Profile */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-base flex items-center justify-center text-neutral-0 text-small font-medium">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-small font-medium text-neutral-900 leading-tight">{user?.name || 'Admin User'}</p>
              <p className="text-caption text-neutral-500 leading-tight">Platform Ops</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Overview heading */}
      <h1 className="text-heading font-medium text-neutral-900 mb-1">Platform Overview</h1>
      <p className="text-small text-neutral-500 mb-6">
        {getDateRange()} &mdash; {locations.join(', ')}
      </p>

      {/* Row 1: 3 stat cards with increase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <StatCard
          label="Total users"
          value={(stats?.totalUsers ?? 0).toLocaleString()}
          increase="+12%"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total providers"
          value={(stats?.activeProviders ?? 0).toLocaleString()}
          increase="+12%"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.25c0-1.094-.787-2.036-1.872-2.18-2.087-.277-4.216-.42-6.378-.42s-4.291.143-6.378.42c-1.085.144-1.872 1.086-1.872 2.18v4.239c0 .605.205 1.16.55 1.61m16.5 0v.226c0 1.094-.786 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-.226" />
            </svg>
          }
        />
        <StatCard
          label="Active bookings"
          value={(stats?.totalInquiries ?? 0).toLocaleString()}
          increase="+12%"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
        />
      </div>

      {/* Row 2: 3 stat cards — Monthly Revenue (with %), Pending vetting (no %), Flagged content (no %) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Monthly Revenue"
          value={formatNaira(stats?.platformRevenue ?? 0)}
          increase="+8.5%"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Pending vetting"
          value={(stats?.pendingVetting ?? 0).toLocaleString()}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          }
        />
        <StatCard
          label="Flagged content"
          value={(stats?.pendingFlags ?? 0).toLocaleString()}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
            </svg>
          }
        />
      </div>

      {/* Row 3: 2 graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <BarChart title="Monthly Revenue Analytics" data={revenueData} color="#1A6B3C" />
        <BarChart title="New Sign Up Analytics" data={signupData} color="#185FA5" />
      </div>

      {/* Row 4: 2 bottom action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vetting queue */}
        <Card className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary-tint flex items-center justify-center text-primary-base">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </div>
            <div>
              <p className="text-small text-neutral-500">Vetting queue</p>
              <p className="text-body font-medium text-neutral-900">
                {stats?.pendingVetting ?? 0} awaiting document review
              </p>
            </div>
          </div>
          <Link
            href="/admin/providers"
            className="flex items-center gap-1 text-small font-medium text-primary-base hover:text-primary-hover transition-colors"
          >
            Review now
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </Card>

        {/* Flagged content */}
        <Card className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary-tint flex items-center justify-center text-primary-base">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
              </svg>
            </div>
            <div>
              <p className="text-small text-neutral-500">Flagged content</p>
              <p className="text-body font-medium text-neutral-900">
                {stats?.pendingFlags ?? 0} items pending moderation
              </p>
            </div>
          </div>
          <Link
            href="/admin/flags"
            className="flex items-center gap-1 text-small font-medium text-primary-base hover:text-primary-hover transition-colors"
          >
            Moderate
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </Card>
      </div>
    </div>
  );
}
