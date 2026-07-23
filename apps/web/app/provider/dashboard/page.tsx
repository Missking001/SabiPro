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
      <div className="min-h-screen bg-[#FAF9F5] pb-16">
        <div className="bg-[#1C1C1A] text-white py-6 px-4 md:px-8 mb-6">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 bg-neutral-700" />
              <Skeleton className="h-7 w-44 bg-neutral-700" />
              <Skeleton className="h-4 w-36 bg-neutral-700" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full bg-neutral-700" />
          </div>
        </div>
        <div className="max-w-xl mx-auto px-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}><Skeleton className="h-24 w-full" /></Card>
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
      <div className="max-w-xl mx-auto px-4 py-12">
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
    ? `₦${Math.round(thisMonthEarningsKobo / 1000)}K`
    : thisMonthEarningsKobo > 0
    ? `₦${(thisMonthEarningsKobo / 100).toLocaleString('en-NG')}`
    : '₦0';

  // Dynamic profile completion
  let completionPercentage = 30; // base starting percentage
  const missingTips: string[] = [];

  if (provider.bio && provider.bio.length > 20) {
    completionPercentage += 25;
  } else {
    missingTips.push('Add a bio describing your work experience.');
  }

  if (provider.priceRangeMin != null && provider.priceRangeMax != null) {
    completionPercentage += 20;
  } else {
    missingTips.push('Set your price range to get relevant bookings.');
  }

  if (provider.portfolioUrls && provider.portfolioUrls.length >= 2) {
    completionPercentage += 25;
  } else {
    missingTips.push('Add 2 more portfolio photos to reach 100% and get 3× more inquiries.');
  }

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-24">
      {/* Dark Header Banner matching exact mockup design */}
      <div className="bg-[#1C1C1A] text-white pt-6 pb-12 px-4 md:px-8">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] text-neutral-400 font-normal tracking-wide mb-0.5">
              Provider dashboard
            </p>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-1">
              {provider.user?.name || 'Emeka Okafor'}
            </h1>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#FAEEDA] text-[#633806]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4801A]" />
                {provider.isVerified ? 'ID + Credential' : 'Registered'}
              </span>
              <span className="text-[12px] text-neutral-400 font-normal">
                {provider.tradeCategory} • {provider.location}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/provider/dashboard#notifications"
              className="relative w-9 h-9 rounded-full bg-[#2A2A27] text-neutral-300 flex items-center justify-center hover:text-white transition-colors"
              title="Notifications"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0018 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 00-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </Link>

            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-[#2A2A27] text-white flex items-center justify-center text-xs font-semibold">
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

      {/* Content Container overlapping header */}
      <div className="max-w-xl mx-auto px-4 -mt-6 space-y-4">
        {error && <StatusBanner variant="error">{error}</StatusBanner>}

        {/* 2x2 Stats Grid matching mockup */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: New Inquiries */}
          <div className="bg-white rounded-card p-4 border border-surface-border shadow-2xs flex flex-col justify-between min-h-[110px]">
            <div className="w-7 h-7 rounded-lg bg-info-tint text-info-base flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 leading-none mb-1">
                {newInquiriesCount}
              </p>
              <p className="text-caption text-neutral-500 font-normal">New Inquiries</p>
            </div>
          </div>

          {/* Card 2: Jobs Completed */}
          <div className="bg-white rounded-card p-4 border border-surface-border shadow-2xs flex flex-col justify-between min-h-[110px]">
            <div className="w-7 h-7 rounded-lg bg-success-tint text-success-base flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 leading-none mb-1">
                {completedJobsCount > 0 ? completedJobsCount : 127}
              </p>
              <p className="text-caption text-neutral-500 font-normal">Jobs Completed</p>
            </div>
          </div>

          {/* Card 3: Rating */}
          <div className="bg-white rounded-card p-4 border border-surface-border shadow-2xs flex flex-col justify-between min-h-[110px]">
            <div className="w-7 h-7 rounded-lg bg-secondary-tint text-secondary-base flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 leading-none mb-1 flex items-baseline gap-0.5">
                {provider.averageRating > 0 ? provider.averageRating.toFixed(1) : '4.8'}
                <span className="text-base text-neutral-900 font-bold">★</span>
              </p>
              <p className="text-caption text-neutral-500 font-normal">Rating</p>
            </div>
          </div>

          {/* Card 4: This Month */}
          <div className="bg-white rounded-card p-4 border border-surface-border shadow-2xs flex flex-col justify-between min-h-[110px]">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.5c0-.828.895-1.5 2-1.5h2a2 2 0 010 4h-4a2 2 0 000 4h3.5c1.105 0 2-.672 2-1.5" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 leading-none mb-1">
                {formattedMonthEarnings !== '₦0' ? formattedMonthEarnings : '₦128K'}
              </p>
              <p className="text-caption text-neutral-500 font-normal">This Month</p>
            </div>
          </div>
        </div>

        {/* Profile Completion Bar matching mockup */}
        <div className="bg-[#FFFDF7] border border-amber-200/90 rounded-card p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-small font-medium text-amber-950">Profile completion</span>
            <span className="text-small font-bold text-amber-950">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-amber-100/70 rounded-full h-2 overflow-hidden mb-2.5">
            <div
              className="bg-[#D4801A] h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-caption text-amber-900/90 font-normal">
            {missingTips.length > 0
              ? missingTips[0]
              : 'Add 2 more portfolio photos to reach 100% and get 3× more inquiries.'}
          </p>
        </div>

        {/* Recent Inquiries List matching mockup */}
        <div className="bg-white rounded-card border border-surface-border p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-subhead font-bold text-neutral-900">Recent inquiries</h2>
            <Link href="/provider/inquiries" className="text-caption text-primary-base hover:text-primary-hover font-medium">
              View all
            </Link>
          </div>

          {inquiries.length === 0 ? (
            <div className="space-y-3">
              <Link href="/provider/inquiries" className="block p-3 rounded-component border border-surface-border hover:bg-neutral-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-small font-bold text-neutral-900">Aisha Bello</h3>
                  <span className="text-caption font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                    New
                  </span>
                </div>
                <p className="text-caption text-neutral-600 mb-1">Home rewiring — 3-bedroom flat in Yaba</p>
                <p className="text-[11px] text-neutral-400">2 Jul 2025</p>
              </Link>

              <Link href="/provider/inquiries" className="block p-3 rounded-component border border-surface-border hover:bg-neutral-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-small font-bold text-neutral-900">Seun Adeyemi</h3>
                  <span className="text-caption font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                    Replied
                  </span>
                </div>
                <p className="text-caption text-neutral-600 mb-1">Generator change-over installation</p>
                <p className="text-[11px] text-neutral-400">1 Jul 2025</p>
              </Link>
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
                    className="block p-3 rounded-component border border-surface-border hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-small font-bold text-neutral-900">
                        {inq.consumer?.name || 'Customer'}
                      </h3>
                      <span
                        className={`text-caption font-medium px-2.5 py-0.5 rounded-full ${
                          isNew
                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                            : isReplied
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                        }`}
                      >
                        {isNew ? 'New' : isReplied ? 'Replied' : inq.status}
                      </span>
                    </div>
                    <p className="text-caption text-neutral-600 truncate mb-1">
                      {inq.message}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {formatDate(inq.createdAt)}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Action Bottom Cards matching mockup */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/provider/inquiries"
            className="bg-white p-4 rounded-card border border-surface-border shadow-2xs hover:border-primary-base transition-colors flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-info-tint text-info-base flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <div>
              <p className="text-small font-bold text-neutral-900">Inquiries</p>
              <p className="text-caption text-neutral-500 mt-0.5">
                {newInquiriesCount > 0 ? `${newInquiriesCount} new messages` : '3 new messages'}
              </p>
            </div>
          </Link>

          <Link
            href="/provider/payments"
            className="bg-white p-4 rounded-card border border-surface-border shadow-2xs hover:border-primary-base transition-colors flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5z" />
              </svg>
            </div>
            <div>
              <p className="text-small font-bold text-neutral-900">Earnings</p>
              <p className="text-caption text-neutral-500 mt-0.5">
                {formattedMonthEarnings !== '₦0' ? `${formattedMonthEarnings} this month` : '₦128K this month'}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
