'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function BottomNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || pathname === '/' || pathname === '/login' || pathname === '/register' || pathname.startsWith('/admin')) return null;

  const isConsumer = user?.role !== 'PROVIDER' && user?.role !== 'ADMIN';

  if (isConsumer) {
    const isHome = pathname === '/dashboard';
    const isSearch = pathname === '/search' || pathname.startsWith('/providers/');
    const isBookings = pathname === '/bookings';
    const isMessages = pathname === '/messages';

    return (
      <>
        <div className="h-16" /> {/* Spacer */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-0 border-t border-surface-border shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto flex items-center justify-around h-16">
          {/* Home */}
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              isHome ? 'text-primary-base' : 'text-neutral-500 hover:text-primary-base'
            }`}
            id="bottomnav-home"
          >
            <svg className="w-6 h-6" fill={isHome ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={isHome ? undefined : 1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 11-1.06 1.06l-.22-.22V19.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75V15a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-6.13l-.22.22a.75.75 0 01-1.06-1.06l8.69-8.69z" />
            </svg>
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          {/* Search */}
          <Link
            href="/search"
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              isSearch ? 'text-primary-base' : 'text-neutral-500 hover:text-primary-base'
            }`}
            id="bottomnav-search"
          >
            <svg className="w-6 h-6" fill={isSearch ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={isSearch ? undefined : 1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <span className="text-[10px] font-medium">Search</span>
          </Link>

          {/* Bookings */}
          <Link
            href="/bookings"
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              isBookings ? 'text-primary-base' : 'text-neutral-500 hover:text-primary-base'
            }`}
            id="bottomnav-bookings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span className="text-[10px] font-medium">Bookings</span>
          </Link>

          {/* Messages */}
          <Link
            href="/messages"
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              isMessages ? 'text-primary-base' : 'text-neutral-500 hover:text-primary-base'
            }`}
            id="bottomnav-messages"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <span className="text-[10px] font-medium">Messages</span>
          </Link>
        </div>
      </nav>
      </>
    );
  }

  // Provider bottom nav
  const isHome = pathname === '/provider/dashboard';
  const isEnquiries = pathname === '/provider/inquiries';
  const isEarnings = pathname === '/provider/payments';
  const isProfile = pathname === '/provider/profile';

  return (
    <>
      <div className="h-16" /> {/* Spacer */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-0 border-t border-surface-border shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div className="max-w-2xl mx-auto flex items-center justify-around h-16">
        {/* Home */}
        <Link
          href="/provider/dashboard"
          className={`flex flex-col items-center gap-0.5 transition-colors ${
            isHome ? 'text-primary-base' : 'text-neutral-500 hover:text-primary-base'
          }`}
          id="bottomnav-provider-home"
        >
          <svg className="w-6 h-6" fill={isHome ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={isHome ? undefined : 1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* Enquiries */}
        <Link
          href="/provider/inquiries"
          className={`flex flex-col items-center gap-0.5 transition-colors ${
            isEnquiries ? 'text-primary-base' : 'text-neutral-500 hover:text-primary-base'
          }`}
          id="bottomnav-provider-enquiries"
        >
          <svg className="w-6 h-6" fill={isEnquiries ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={isEnquiries ? undefined : 1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          <span className="text-[10px] font-medium">Inquiries</span>
        </Link>

        {/* Earnings */}
        <Link
          href="/provider/payments"
          className={`flex flex-col items-center gap-0.5 transition-colors ${
            isEarnings ? 'text-primary-base' : 'text-neutral-500 hover:text-primary-base'
          }`}
          id="bottomnav-provider-earnings"
        >
          <svg className="w-6 h-6" fill={isEarnings ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={isEarnings ? undefined : 1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] font-medium">Earnings</span>
        </Link>

        {/* Profile */}
        <Link
          href="/provider/profile"
          className={`flex flex-col items-center gap-0.5 transition-colors ${
            isProfile ? 'text-primary-base' : 'text-neutral-500 hover:text-primary-base'
          }`}
          id="bottomnav-provider-profile"
        >
          <svg className="w-6 h-6" fill={isProfile ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={isProfile ? undefined : 1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
    </>
  );
}
