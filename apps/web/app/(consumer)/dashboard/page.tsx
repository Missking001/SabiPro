'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Skeleton, StatusBanner } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import type { ProviderSummary, Transaction, Notification } from '@/types';

function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
}

function getFirstName(name: string): string {
  return name.split(' ')[0];
}

// Service category definitions with inline SVG icon paths
const SERVICE_CATEGORIES = [
  {
    name: 'Plumber',
    icon: 'plumber',
    color: 'text-primary-base',
    bgColor: 'bg-primary-tint',
  },
  {
    name: 'Electrician',
    icon: 'electrician',
    color: 'text-secondary-base',
    bgColor: 'bg-secondary-tint',
  },
  {
    name: 'Tailor',
    icon: 'tailor',
    color: 'text-tertiary-base',
    bgColor: 'bg-tertiary-tint',
  },
  {
    name: 'Carpenter',
    icon: 'carpenter',
    color: 'text-[#8B5E3C]',
    bgColor: 'bg-[#FDF3EB]',
  },
  {
    name: 'Mechanic',
    icon: 'mechanic',
    color: 'text-error-base',
    bgColor: 'bg-error-bg',
  },
  {
    name: 'Cleaner',
    icon: 'cleaner',
    color: 'text-success-text',
    bgColor: 'bg-success-bg',
  },
];

function ServiceIcon({ icon, className }: { icon: string; className?: string }) {
  const cls = className || 'w-7 h-7';
  switch (icon) {
    case 'plumber':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.049.58.025 1.193-.14 1.743" />
        </svg>
      );
    case 'electrician':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      );
    case 'tailor':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.696.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.331 4.331 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664" />
        </svg>
      );
    case 'carpenter':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.049.58.025 1.193-.14 1.743" />
        </svg>
      );
    case 'mechanic':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 00-.879-2.121l-2.246-2.246A2.999 2.999 0 0014.524 9H9.75V5.25A2.25 2.25 0 007.5 3h-3A2.25 2.25 0 002.25 5.25v8.625c0 .621.504 1.125 1.125 1.125H5.25" />
        </svg>
      );
    case 'cleaner':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
        </svg>
      );
    default:
      return null;
  }
}

function getBadgeLabel(badgeType?: string): string {
  if (!badgeType) return '';
  switch (badgeType) {
    case 'BOTH':
      return 'ID + Credential';
    case 'IDENTITY':
      return 'ID Verified';
    case 'CREDENTIAL':
      return 'Credential Verified';
    default:
      return '';
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'text-secondary-base' : 'text-surface-input'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default function ConsumerDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { isDark, toggleTheme, mounted: themeMounted } = useTheme();
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [activeTransaction, setActiveTransaction] = useState<Transaction | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sabipro_avatar');
    if (stored) setLocalAvatar(stored);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLocalAvatar(dataUrl);
      localStorage.setItem('sabipro_avatar', dataUrl);
    };
    reader.readAsDataURL(file);
  }

  const greeting = useMemo(() => getGreeting(), []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    async function loadDashboard() {
      try {
        // Fetch top-rated providers, active transactions, and notifications in parallel
        const [providersRes, txRes, notifsRes] = await Promise.allSettled([
          api.providers.search({ sortBy: 'rating', pageSize: 5 }),
          api.payments.getConsumerHistory(),
          api.notifications.list(),
        ]);

        if (providersRes.status === 'fulfilled') {
          setProviders(providersRes.value.data || []);
        }
        if (txRes.status === 'fulfilled') {
          // Find the most recent active/pending transaction for the escrow banner
          const txList = txRes.value.data || [];
          const active = txList.find(
            (tx: Transaction) => tx.status === 'PENDING' || tx.status === 'SUCCESSFUL',
          );
          if (active) setActiveTransaction(active);
        }
        if (notifsRes.status === 'fulfilled') {
          setNotifications(notifsRes.value.data || []);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [authLoading, isAuthenticated, router]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/search');
    }
  }

  function handleCategoryClick(category: string) {
    router.push(`/search?tradeCategory=${encodeURIComponent(category)}`);
  }

  async function handleMarkAllRead() {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Silently fail — non-critical action
    }
  }

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="min-h-screen bg-surface-bg">
        <div className="bg-primary-base pt-6 pb-10 px-4">
          <Skeleton className="h-8 w-48 mb-4 !bg-neutral-0/10" />
          <Skeleton className="h-12 w-full rounded-component !bg-neutral-0/10" />
        </div>
        <div className="max-w-2xl mx-auto px-4 -mt-4">
          <Skeleton className="h-20 w-full rounded-card mb-6" />
          <Skeleton className="h-48 w-full rounded-card mb-6" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      </div>
    );
  }

  const firstName = user?.name ? getFirstName(user.name) : 'there';

  return (
    <div className="min-h-screen bg-surface-bg">
      {/* ─── Green header section ─── */}
      <div className="bg-primary-base">
        <div className="max-w-2xl mx-auto px-4 md:px-6 pt-10 pb-20">
          {/* Top bar: greeting + actions */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-small text-neutral-0/70">{greeting}</p>
              <h1 className="text-heading text-neutral-0 font-medium">
                {firstName} <span className="inline-block animate-wave origin-bottom-right">👋</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Dark mode toggle */}
              {themeMounted && (
                <button
                  onClick={toggleTheme}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-0/15 hover:bg-neutral-0/25 active:bg-neutral-0/35 transition-colors"
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  id="dashboard-theme-toggle"
                >
                  {isDark ? (
                    /* Sun icon */
                    <svg className="w-5 h-5 text-neutral-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    /* Moon icon */
                    <svg className="w-5 h-5 text-neutral-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              )}

              {/* Notification bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="relative w-10 h-10 flex items-center justify-center rounded-full bg-neutral-0/15 hover:bg-neutral-0/25 transition-colors"
                  aria-label="Notifications"
                  id="dashboard-notifications-btn"
                >
                  <svg className="w-5 h-5 text-neutral-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-error-base text-neutral-0 text-[10px] font-medium rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
                    <div className="absolute right-0 top-12 w-80 bg-neutral-0 border border-surface-border rounded-card shadow-xl z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
                        <span className="text-small font-medium text-neutral-900">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-caption text-primary-base hover:text-primary-hover"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-small text-neutral-500 text-center py-8">No notifications yet</p>
                        ) : (
                          notifications.slice(0, 8).map((n) => (
                            <div
                              key={n.id}
                              className={`px-4 py-3 border-b border-surface-border last:border-0 transition-colors ${
                                !n.isRead ? 'bg-primary-tint' : ''
                              }`}
                            >
                              <p className="text-small text-neutral-700">{n.message}</p>
                              <p className="text-caption text-neutral-500 mt-0.5">
                                {new Date(n.createdAt).toLocaleDateString('en-NG', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Avatar */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-10 h-10 rounded-full bg-neutral-0/20 flex items-center justify-center overflow-hidden border-2 border-neutral-0/30"
                id="dashboard-avatar-btn"
              >
                {localAvatar || user?.avatarUrl ? (
                  <img src={localAvatar || user?.avatarUrl!} alt={user?.name || ''} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-neutral-0 text-small font-medium">
                    {firstName.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main content (overlaps green header) ─── */}
      <div className="max-w-2xl mx-auto px-4 md:px-6 -mt-6 relative z-10 pb-24">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative mb-6">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plumbers, tailors, mechanics..."
            className="w-full h-12 pl-12 pr-4 bg-neutral-0 rounded-component text-body text-neutral-700 placeholder:text-neutral-500 border border-surface-border shadow-md outline-none focus:ring-2 focus:ring-secondary-base/50 transition-shadow"
            id="dashboard-search-input"
          />
        </form>

        {/* Suggested Provider Card */}
        {!isLoading && providers.length > 0 && (
          <div className="bg-neutral-0 border border-surface-border rounded-card p-4 mb-6 flex items-center gap-3 shadow-sm hover:border-primary-base/20 transition-all">
            <div className="w-10 h-10 bg-primary-tint text-primary-deep rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {providers[0].user?.avatarUrl ? (
                <img src={providers[0].user.avatarUrl} alt={providers[0].user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-body font-medium">{providers[0].user?.name?.charAt(0) || 'P'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-overline text-primary-base font-semibold tracking-wider">RECOMMENDED FOR YOU</span>
                {providers[0].isVerified && (
                  <span className="inline-flex items-center gap-0.5 bg-secondary-tint text-secondary-deep text-[10px] font-medium px-1.5 py-0.2 rounded-pill">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-small font-medium text-neutral-900 truncate">
                {providers[0].user?.name} — {providers[0].tradeCategory}
              </p>
              <p className="text-caption text-neutral-500">
                ⭐ {providers[0].averageRating.toFixed(1)} ({providers[0].totalReviews} reviews) · 📍 {providers[0].location}
              </p>
            </div>
            <Link
              href={`/providers/${providers[0].slug}`}
              className="text-small font-medium text-primary-base hover:text-primary-hover transition-colors flex-shrink-0 bg-primary-tint px-3 py-1.5 rounded-component"
              id="dashboard-suggested-view-btn"
            >
              View Profile
            </Link>
          </div>
        )}

        {error && (
          <StatusBanner variant="error" className="mb-4">
            {error}
          </StatusBanner>
        )}

        {/* ─── Active booking / escrow banner ─── */}
        {activeTransaction && (
          <div className="bg-neutral-0 border border-surface-border rounded-card p-4 mb-6 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-secondary-tint rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-secondary-base" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-small font-medium text-neutral-900 truncate">
                Payment · {formatNaira(activeTransaction.amount)}
              </p>
              <p className="text-caption text-neutral-500">
                {activeTransaction.status === 'PENDING' ? 'Pending' : 'Scheduled'}{' '}
                {new Date(activeTransaction.createdAt).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                · <span className="text-secondary-base font-medium">{formatNaira(activeTransaction.amount)} in escrow</span>
              </p>
            </div>
            <Link
              href="/dashboard#transactions"
              className="text-small font-medium text-primary-base hover:text-primary-hover transition-colors flex-shrink-0"
            >
              View
            </Link>
          </div>
        )}

        {/* ─── Browse services ─── */}
        <section className="mb-8">
          <h2 className="text-subhead text-neutral-900 font-medium mb-4">Browse services</h2>
          <div className="grid grid-cols-3 gap-3">
            {SERVICE_CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => handleCategoryClick(cat.name)}
                className={`${cat.bgColor} rounded-card p-4 flex flex-col items-center gap-2.5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group`}
                id={`dashboard-category-${cat.name.toLowerCase()}`}
              >
                <span className={`${cat.color} transition-transform duration-200 group-hover:scale-110`}>
                  <ServiceIcon icon={cat.icon} className="w-7 h-7" />
                </span>
                <span className={`text-small font-medium ${cat.color}`}>{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ─── Top rated near you ─── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-subhead text-neutral-900 font-medium">Top rated near you</h2>
            <Link
              href="/search"
              className="text-small font-medium text-primary-base hover:text-primary-hover transition-colors"
              id="dashboard-see-all"
            >
              See all
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-neutral-0 border border-surface-border rounded-card p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 !rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-48 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="bg-neutral-0 border border-surface-border rounded-card p-10 text-center">
              <p className="text-display mb-2">🔍</p>
              <h3 className="text-subhead text-neutral-900 mb-1">No providers found</h3>
              <p className="text-small text-neutral-500 mb-4">
                Try browsing by category above
              </p>
              <Link
                href="/search"
                className="inline-block text-small font-medium text-primary-base hover:text-primary-hover"
              >
                Explore all providers →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((provider) => (
                <Link
                  key={provider.id}
                  href={`/providers/${provider.slug}`}
                  className="block bg-neutral-0 border border-surface-border rounded-card p-4 hover:border-primary-base/30 hover:shadow-sm transition-all duration-200 group"
                  id={`dashboard-provider-${provider.slug}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-primary-tint flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {provider.user?.avatarUrl ? (
                        <img
                          src={provider.user.avatarUrl}
                          alt={provider.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-primary-deep text-body font-medium">
                          {provider.user?.name?.charAt(0) || 'P'}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-body font-medium text-neutral-900 truncate group-hover:text-primary-base transition-colors">
                            {provider.user?.name || 'Provider'}
                          </h3>
                          <p className="text-small text-neutral-500 truncate">
                            {provider.tradeCategory} · 📍 {provider.location}
                          </p>
                        </div>

                        {/* Verification badge */}
                        {provider.vettingBadge?.isActive && (
                          <span className="inline-flex items-center gap-1 bg-secondary-tint text-secondary-deep text-caption font-medium px-2 py-0.5 rounded-pill whitespace-nowrap flex-shrink-0">
                            <span className="w-1.5 h-1.5 bg-primary-base rounded-full" />
                            {getBadgeLabel(provider.vettingBadge.badgeType)}
                          </span>
                        )}
                      </div>

                      {/* Rating + price */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <StarRating rating={provider.averageRating} />
                          <span className="text-small font-medium text-neutral-900">
                            {provider.averageRating.toFixed(1)}
                          </span>
                          <span className="text-caption text-neutral-500">
                            ({provider.totalReviews})
                          </span>
                        </div>
                      </div>

                      {/* Availability + price range */}
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            provider.isAvailable ? 'bg-success-base' : 'bg-surface-disabled'
                          }`}
                        />
                        {provider.priceRangeMin != null && provider.priceRangeMax != null && (
                          <span className="text-small text-neutral-700">
                            ₦{(provider.priceRangeMin / 100).toLocaleString('en-NG')} – ₦{(provider.priceRangeMax / 100).toLocaleString('en-NG')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setShowProfileModal(false)} />
          
          {/* Modal Content */}
          <div className="bg-neutral-0 rounded-card max-w-sm w-full p-6 relative z-10 shadow-2xl border border-surface-border">
            <button 
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-900"
              aria-label="Close profile modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex flex-col items-center text-center mt-4">
              {/* Large Avatar */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-primary-tint flex items-center justify-center text-display font-medium text-primary-deep mb-4 overflow-hidden border-2 border-primary-base/20 relative group cursor-pointer"
              >
                {localAvatar || user?.avatarUrl ? (
                  <img src={localAvatar || user?.avatarUrl!} alt={user?.name || ''} className="w-full h-full object-cover" />
                ) : (
                  <span>{firstName.charAt(0).toUpperCase()}</span>
                )}
                <div className="absolute inset-0 bg-neutral-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <svg className="w-6 h-6 text-neutral-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.16a15.53 15.53 0 01-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              
              <h2 className="text-subhead font-medium text-neutral-900">{user?.name}</h2>
              <p className="text-small text-neutral-500 mb-1">{user?.email}</p>
              
              <span className="inline-flex items-center gap-1.5 bg-primary-tint text-primary-deep text-caption font-medium px-2.5 py-0.5 rounded-pill mb-6">
                <span className="w-1.5 h-1.5 bg-success-base rounded-full" />
                {user?.role} Account
              </span>
              
              <div className="w-full border-t border-surface-border pt-4 mb-4 flex flex-col gap-1 text-left">
                {/* Menu Option 1: Profile Settings */}
                <Link
                  href="/settings"
                  onClick={() => setShowProfileModal(false)}
                  className="flex items-center justify-between p-3 rounded-component hover:bg-surface-bg transition-colors text-small font-medium text-neutral-900"
                >
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Account Settings
                  </span>
                  <span className="text-neutral-400 font-bold">&gt;</span>
                </Link>

                {/* Menu Option 2: Payment Details */}
                <Link
                  href="/bookings"
                  onClick={() => setShowProfileModal(false)}
                  className="flex items-center justify-between p-3 rounded-component hover:bg-surface-bg transition-colors text-small font-medium text-neutral-900"
                >
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Payment History
                  </span>
                  <span className="text-neutral-400 font-bold">&gt;</span>
                </Link>

                {/* Menu Option 3: Become a Provider */}
                {user?.role === 'CONSUMER' && (
                  <Link
                    href="/become-provider"
                    onClick={() => setShowProfileModal(false)}
                    className="flex items-center justify-between p-3 rounded-component hover:bg-surface-bg transition-colors text-small font-medium text-neutral-900"
                  >
                    <span className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Become a Provider
                    </span>
                    <span className="text-neutral-400 font-bold">&gt;</span>
                  </Link>
                )}

                {/* Menu Option 4: Help & Support */}
                <Link
                  href="/help"
                  onClick={() => setShowProfileModal(false)}
                  className="flex items-center justify-between p-3 rounded-component hover:bg-surface-bg transition-colors text-small font-medium text-neutral-900"
                >
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Help & Support
                  </span>
                  <span className="text-neutral-400 font-bold">&gt;</span>
                </Link>
              </div>

              <div className="w-full flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    logout();
                  }}
                  className="w-full h-11 bg-error-bg hover:bg-error-bg/80 text-error-text font-medium text-small rounded-component transition-colors"
                >
                  Sign Out
                </button>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="w-full h-11 bg-surface-bg hover:bg-surface-bg/80 text-neutral-700 font-medium text-small rounded-component transition-colors"
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
