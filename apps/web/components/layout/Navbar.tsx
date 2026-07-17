'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import type { Notification } from '@/types';

export function Navbar() {
  const pathname = usePathname();
  if (pathname !== '/') return null;
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Sync access token to sessionStorage so api.ts can read it
  useEffect(() => {
    if (isAuthenticated && user?.accessToken) {
      sessionStorage.setItem('sabipro_token', user.accessToken);
    } else {
      sessionStorage.removeItem('sabipro_token');
    }
  }, [isAuthenticated, user?.accessToken]);

  // Fetch notifications when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    api.notifications
      .list()
      .then((res) => setNotifications(res.data || []))
      .catch(() => {});
  }, [isAuthenticated]);

  async function handleMarkAllRead() {
    await api.notifications.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  function getDashboardLink() {
    if (user?.role === 'ADMIN') return '/admin/dashboard';
    if (user?.role === 'PROVIDER') return '/provider/dashboard';
    return '/dashboard';
  }


  return (
    <nav className="bg-white/10 backdrop-blur-md sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/sabipro_logo_v4.png"
              alt="SabiPro"
              width={180}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#how-it-works"
              className="text-small font-medium text-neutral-900/80 hover:text-neutral-900 transition-colors"
            >
              How it works
            </Link>
            <Link
              href="/search"
              className={`text-small font-medium transition-colors ${
                isActive('/search') ? 'text-neutral-900' : 'text-neutral-900/80 hover:text-neutral-900'
              }`}
            >
              Services
            </Link>
            <Link
              href="#top-providers"
              className="text-small font-medium text-neutral-900/80 hover:text-neutral-900 transition-colors"
            >
              Top Providers
            </Link>

            <Link
              href="/login"
              className={`text-small font-medium transition-colors ${
                isActive('/login') ? 'text-neutral-900' : 'text-neutral-900/80 hover:text-neutral-900'
              }`}
            >
              Log in
            </Link>
            <Link href="/register">
              <Button size="sm" className="!bg-secondary-base hover:!bg-secondary-hover !text-neutral-900 !rounded-pill !px-5">
                Get started
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-white/10 backdrop-blur-md px-4 py-4 space-y-3">
          <Link href="#how-it-works" className="block text-body text-neutral-900/80 hover:text-neutral-900 py-2" onClick={() => setIsOpen(false)}>
            How it works
          </Link>
          <Link href="/search" className="block text-body text-neutral-900/80 hover:text-neutral-900 py-2" onClick={() => setIsOpen(false)}>
            Services
          </Link>
          <Link href="#top-providers" className="block text-body text-neutral-900/80 hover:text-neutral-900 py-2" onClick={() => setIsOpen(false)}>
            Top Providers
          </Link>
          <Link href="/login" className="block text-body text-neutral-900/80 hover:text-neutral-900 py-2" onClick={() => setIsOpen(false)}>
            Log in
          </Link>
          <Link href="/register" onClick={() => setIsOpen(false)}>
            <Button className="w-full !bg-secondary-base hover:!bg-secondary-hover !text-neutral-900">Get started</Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
