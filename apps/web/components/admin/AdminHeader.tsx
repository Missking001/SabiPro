'use client';

import { useSidebar } from './SidebarContext';
import { useAuth } from '@/hooks/useAuth';

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const { toggle } = useSidebar();
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-between bg-transparent py-1 mb-6 w-full">
      <button
        type="button"
        onClick={toggle}
        className="text-[#18181B] hover:text-black transition-colors p-1"
        aria-label="Toggle sidebar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button
          type="button"
          className="w-9 h-9 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#52525B] hover:text-[#18181B] transition-colors relative shadow-xs"
          aria-label="Notifications"
        >
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full" />
        </button>

        {/* Admin User Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#1A6B3C] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            A
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-[#18181B] leading-none">
              {user?.name || 'Admin User'}
            </p>
            <p className="text-[11px] text-[#71717A] leading-tight mt-0.5">
              Platform ops
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FloatingHelpButton() {
  return (
    <button
      type="button"
      className="fixed bottom-6 right-6 w-9 h-9 rounded-full bg-white border border-[#E5E7EB] shadow-md flex items-center justify-center text-[#71717A] hover:text-[#18181B] hover:shadow-lg transition-all font-semibold text-sm z-40"
      aria-label="Help"
    >
      ?
    </button>
  );
}
