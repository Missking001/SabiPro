'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, Skeleton, StatusBanner } from '@/components/ui';
import { api } from '@/lib/api';
import { formatNaira, formatDate, getInitials } from '@/lib/utils';
import type { MyProviderProfile, Inquiry, Transaction, Notification } from '@/types';

export default function ProviderDashboardPage() {
  const [provider, setProvider] = useState<MyProviderProfile | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [providerRes, inquiriesRes, txRes, notifRes] = await Promise.allSettled([
          api.providers.me(),
          api.inquiries.list(),
          api.payments.getProviderHistory(),
          api.notifications.list(),
        ]);

        if (providerRes.status === 'fulfilled') {
          setProvider(providerRes.value.data || null);
        }
        if (inquiriesRes.status === 'fulfilled') {
          setInquiries(inquiriesRes.value.data || []);
        }
        if (txRes.status === 'fulfilled') {
          setTransactions(txRes.value.data || []);
        }
        if (notifRes.status === 'fulfilled') {
          setNotifications(notifRes.value.data || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-bg pb-12">
        <div className="bg-[#1C1C1A] text-white py-8 px-4 md:px-8 mb-6">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-neutral-700" />
              <Skeleton className="h-8 w-48 bg-neutral-700" />
              <Skeleton className="h-5 w-40 bg-neutral-700" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full bg-neutral-700" />
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 md:px-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}><Skeleton className="h-20 w-full" /></Card>
            ))}
          </div>
          <Card><Skeleton className="h-24 w-full" /></Card>
          <Card><Skeleton className="h-48 w-full" /></Card>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-12">
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-primary-tint text-primary-base rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            🛠️
          </div>
          <h1 className="text-heading text-neutral-900 mb-2">Setup Your Provider Profile</h1>
          <p className="text-body text-neutral-500 mb-6 max-w-md mx-auto">
            You are logged in as a provider! Create your public profile to start receiving customer inquiries and bookings across Nigeria.
          </p>
          <Link
            href="/provider/profile"
            className="inline-flex items-center justify-center min-h-[44px] px-8 bg-primary-base text-neutral-0 text-body font-medium rounded-component hover:bg-primary-deep transition-colors shadow-sm"
          >
            Complete Profile Now
          </Link>
        </Card>
      </div>
    );
  }

  // Live computations
  const newInquiriesCount = inquiries.filter((i) => i.status === 'PENDING').length;
  const completedJobsCount = transactions.filter((t) => t.status === 'SUCCESSFUL' || t.payoutStatus === 'RELEASED').length;

  // Earnings this month (in kobo -> format)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthEarningsKobo = transactions
    .filter((t) => {
      const d = new Date(t.createdAt);
      return (t.status === 'SUCCESSFUL' || t.payoutStatus === 'RELEASED') &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear;
    })
    .reduce((acc, t) => acc + t.amount, 0);

  const formattedMonthEarnings = thisMonthEarningsKobo >= 100000
    ? `₦${Math.round(thisMonthEarningsKobo / 100000)}K`
    : formatNaira(thisMonthEarningsKobo);

  // Dynamic profile completion
  let completionPercentage = 25; // default starting for active profile
  const missingTips: string[] = [];

  if (provider.bio && provider.bio.length > 20) {
    completionPercentage += 25;
  } else {
    missingTips.push('Add a detailed bio');
  }

  if (provider.priceRangeMin != null && provider.priceRangeMax != null) {
    completionPercentage += 25;
  } else {
    missingTips.push('Set your price range');
  }

  if (provider.portfolioUrls && provider.portfolioUrls.length >= 2) {
    completionPercentage += 25;
  } else {
    missingTips.push('Add 2 or more portfolio photos to reach 100% and get 3x more inquiries.');
  }

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-16">
      {/* Dark Banner Header matching mockup */}
      <div className="bg-[#1A1A1A] text-white pt-8 pb-10 px-4 md:px-8 shadow-md">
        <div className="max-w-3xl mx-auto flex items-start justify-between">
          <div>
            <p className="text-caption text-neutral-400 font-medium mb-1">Provider dashboard</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
              {provider.user?.name || 'Emeka Okafor'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary-tint text-secondary-deep border border-secondary-base/30">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-base"></span>
                {provider.isVerified ? 'ID + Credential' : 'Registered Provider'}
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                {provider.tradeCategory} • {provider.location}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/provider/dashboard#notifications"
              className="relative p-2 rounded-full bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
              title="Notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0018 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 00-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-[#1A1A1A]" />
              )}
            </Link>

            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-neutral-700 bg-neutral-800 flex items-center justify-center text-sm font-semibold text-white">
              {provider.user?.avatarUrl ? (
                <Image
                  src={provider.user.avatarUrl}
                  alt={provider.user.name}
                  fill
                  className="object-cover"
                />
              ) : (
                getInitials(provider.user?.name || 'Provider')
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 -mt-5 space-y-5">
        {error && <StatusBanner variant="error">{error}</StatusBanner>}

        {/* 2x2 Stats Grid matching mockup */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Card 1: New Inquiries */}
          <div className="bg-white rounded-card p-4 border border-surface-border shadow-xs flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-info-tint text-info-base flex items-center justify-center mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
                {newInquiriesCount}
              </p>
              <p className="text-caption text-neutral-500 font-medium mt-0.5">New Inquiries</p>
            </div>
          </div>

          {/* Card 2: Jobs Completed */}
          <div className="bg-white rounded-card p-4 border border-surface-border shadow-xs flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-success-tint text-success-base flex items-center justify-center mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
                {completedJobsCount}
              </p>
              <p className="text-caption text-neutral-500 font-medium mt-0.5">Jobs Completed</p>
            </div>
          </div>

          {/* Card 3: Rating */}
          <div className="bg-white rounded-card p-4 border border-surface-border shadow-xs flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-secondary-tint text-secondary-base flex items-center justify-center mb-3">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight flex items-baseline gap-1">
                {provider.averageRating > 0 ? provider.averageRating.toFixed(1) : '5.0'}
                <span className="text-base text-neutral-400 font-normal">★</span>
              </p>
              <p className="text-caption text-neutral-500 font-medium mt-0.5">Rating</p>
            </div>
          </div>

          {/* Card 4: Earnings This Month */}
          <div className="bg-white rounded-card p-4 border border-surface-border shadow-xs flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.5c0-.828.895-1.5 2-1.5h2a2 2 0 010 4h-4a2 2 0 000 4h3.5c1.105 0 2-.672 2-1.5" />
              </svg>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
                {formattedMonthEarnings}
              </p>
              <p className="text-caption text-neutral-500 font-medium mt-0.5">This Month</p>
            </div>
          </div>
        </div>

        {/* Profile Completion Bar matching mockup */}
        <div className={`rounded-card p-4 shadow-xs border ${
          completionPercentage === 100
            ? 'bg-[#EAF5EE] border-[#9FE1CB]'
            : 'bg-[#FFFDF7] border-amber-200/80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-small font-medium text-neutral-900">Profile completion</span>
            <span className="text-small font-semibold text-neutral-900">{completionPercentage}%</span>
          </div>
          <div className={`w-full rounded-full h-2 overflow-hidden mb-2 ${
            completionPercentage === 100 ? 'bg-[#9FE1CB]/60' : 'bg-amber-100/60'
          }`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completionPercentage === 100 ? 'bg-[#1D9E75]' : 'bg-amber-600'
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className={`text-caption font-normal ${
            completionPercentage === 100 ? 'text-[#0F6E56]' : 'text-amber-900/80'
          }`}>
            {missingTips.length > 0
              ? missingTips[0]
              : 'Your profile is 100% complete! Profiles with full details receive 3x more inquiries.'}
          </p>
        </div>

        {/* Recent Inquiries List matching mockup */}
        <div className="bg-white rounded-card border border-surface-border p-4 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-subhead font-semibold text-neutral-900">Recent inquiries</h2>
            <Link href="/provider/inquiries" className="text-small text-primary-base hover:text-primary-hover font-medium">
              View all
            </Link>
          </div>

          {inquiries.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-surface-border rounded-component">
              <p className="text-small text-neutral-500">No customer inquiries yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.slice(0, 3).map((inq) => {
                const isNew = inq.status === 'PENDING';
                const isReplied = inq.status === 'RESPONDED';
                return (
                  <Link
                    key={inq.id}
                    href="/provider/inquiries"
                    className="block bg-neutral-0 hover:bg-neutral-50 p-3.5 rounded-component border border-surface-border transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="text-small font-semibold text-neutral-900">
                        {inq.consumer?.name || 'Customer'}
                      </h3>
                      <span
                        className={`text-caption font-medium px-2 py-0.5 rounded-full ${
                          isNew
                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                            : isReplied
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {isNew ? 'New' : isReplied ? 'Replied' : inq.status}
                      </span>
                    </div>
                    <p className="text-small text-neutral-600 truncate mb-1">
                      {inq.message}
                    </p>
                    <p className="text-caption text-neutral-400 font-normal">
                      {formatDate(inq.createdAt)}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Action Bottom Cards matching mockup */}
        <div className="grid grid-cols-2 gap-3.5">
          <Link
            href="/provider/inquiries"
            className="bg-white p-4 rounded-card border border-surface-border shadow-xs hover:border-primary-base transition-colors group flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-tint text-primary-base flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <div>
              <p className="text-small font-semibold text-neutral-900">Inquiries</p>
              <p className="text-caption text-neutral-500 mt-0.5">
                {newInquiriesCount} new messages
              </p>
            </div>
          </Link>

          <Link
            href="/provider/payments"
            className="bg-white p-4 rounded-card border border-surface-border shadow-xs hover:border-primary-base transition-colors group flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5z" />
              </svg>
            </div>
            <div>
              <p className="text-small font-semibold text-neutral-900">Earnings</p>
              <p className="text-caption text-neutral-500 mt-0.5">
                {formattedMonthEarnings} this month
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
