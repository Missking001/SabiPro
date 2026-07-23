'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton, Card } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/components/admin/SidebarContext';

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
  const { user } = useAuth();
  const { toggle: toggleSidebar } = useSidebar();
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

  const [showHelp, setShowHelp] = useState(false);

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const totalUsersVal = stats?.totalUsers ?? 12847;
  const activeProvidersVal = stats?.activeProviders ?? 3421;
  const activeBookingsVal = stats?.totalInquiries ?? 847;
  const revenueDisplay = stats?.platformRevenue ? `₦${(stats.platformRevenue / 100000000).toFixed(1)}M` : '₦4.2M';
  const pendingVettingVal = stats?.pendingVetting ?? 23;
  const pendingFlagsVal = stats?.pendingFlags ?? 7;

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5 border border-[#E5E7EB] w-full">
              <Skeleton className="h-10 w-10 rounded-full mb-3" />
              <Skeleton className="h-7 w-28 mb-1" />
              <Skeleton className="h-4 w-20" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-bold text-[#18181B] mb-6">Platform Overview</h1>
        <Card className="text-center py-12 border border-[#E5E7EB] w-full">
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-[#1A6B3C] hover:underline font-medium"
          >
            Try again
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 relative pb-12">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-transparent py-1 w-full">
        <button
          type="button"
          onClick={toggleSidebar}
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
              <p className="text-sm font-semibold text-[#18181B] leading-tight">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-[#71717A] leading-tight">
                Platform ops
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl md:text-[28px] font-bold text-[#18181B] tracking-tight">
          Platform Overview
        </h1>
        <p className="text-sm text-[#71717A] mt-1 font-normal">
          {today} · Lagos & Abuja
        </p>
      </div>

      {/* 6 Stat Cards Grid - Stretches full width across grid columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
        {/* Card 1: Total Users */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs relative flex flex-col justify-between min-h-[130px] w-full">
          <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="text-2xl md:text-3xl font-bold text-[#18181B] leading-none">
                {totalUsersVal.toLocaleString()}
              </p>
              <p className="text-xs text-[#71717A] mt-1.5 font-medium">Total Users</p>
            </div>
            <span className="text-xs font-semibold text-[#16A34A]">+8%</span>
          </div>
        </div>

        {/* Card 2: Total Providers */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs relative flex flex-col justify-between min-h-[130px] w-full">
          <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center text-[#16A34A]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="text-2xl md:text-3xl font-bold text-[#18181B] leading-none">
                {activeProvidersVal.toLocaleString()}
              </p>
              <p className="text-xs text-[#71717A] mt-1.5 font-medium">Total Providers</p>
            </div>
            <span className="text-xs font-semibold text-[#16A34A]">+12%</span>
          </div>
        </div>

        {/* Card 3: Active Bookings */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs relative flex flex-col justify-between min-h-[130px] w-full">
          <div className="w-10 h-10 rounded-full bg-[#FFFBEB] flex items-center justify-center text-[#D97706]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="text-2xl md:text-3xl font-bold text-[#18181B] leading-none">
                {activeBookingsVal.toLocaleString()}
              </p>
              <p className="text-xs text-[#71717A] mt-1.5 font-medium">Active Bookings</p>
            </div>
            <span className="text-xs font-semibold text-[#16A34A]">+3%</span>
          </div>
        </div>

        {/* Card 4: Monthly Revenue */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs relative flex flex-col justify-between min-h-[130px] w-full">
          <div className="w-10 h-10 rounded-full bg-[#FAF5FF] flex items-center justify-center text-[#9333EA]">
            <span className="text-lg font-bold leading-none">$</span>
          </div>
          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="text-2xl md:text-3xl font-bold text-[#18181B] leading-none">
                {revenueDisplay}
              </p>
              <p className="text-xs text-[#71717A] mt-1.5 font-medium">Monthly Revenue</p>
            </div>
            <span className="text-xs font-semibold text-[#16A34A]">+18%</span>
          </div>
        </div>

        {/* Card 5: Pending Vetting */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs relative flex flex-col justify-between min-h-[130px] w-full">
          <div className="w-10 h-10 rounded-full bg-[#FFF7ED] flex items-center justify-center text-[#EA580C]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="mt-3">
            <p className="text-2xl md:text-3xl font-bold text-[#18181B] leading-none">
              {pendingVettingVal}
            </p>
            <p className="text-xs text-[#71717A] mt-1.5 font-medium">Pending Vetting</p>
          </div>
        </div>

        {/* Card 6: Flagged Content */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs relative flex flex-col justify-between min-h-[130px] w-full">
          <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#EF4444]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
            </svg>
          </div>
          <div className="mt-3">
            <p className="text-2xl md:text-3xl font-bold text-[#18181B] leading-none">
              {pendingFlagsVal}
            </p>
            <p className="text-xs text-[#71717A] mt-1.5 font-medium">Flagged Content</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section - Fills container width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 w-full">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs flex flex-col justify-between w-full">
          <h2 className="text-sm font-semibold text-[#18181B] mb-4">
            Monthly Revenue (₦M)
          </h2>
          <div className="h-60 w-full pt-2">
            <svg className="w-full h-full" viewBox="0 0 450 180" preserveAspectRatio="none">
              {/* Horizontal Gridlines */}
              <line x1="30" y1="20" x2="440" y2="20" stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
              <text x="15" y="24" fill="#94A3B8" fontSize="11" textAnchor="end">6</text>

              <line x1="30" y1="65" x2="440" y2="65" stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
              <text x="15" y="69" fill="#94A3B8" fontSize="11" textAnchor="end">4</text>

              <line x1="30" y1="110" x2="440" y2="110" stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
              <text x="15" y="114" fill="#94A3B8" fontSize="11" textAnchor="end">2</text>

              <line x1="30" y1="155" x2="440" y2="155" stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
              <text x="15" y="159" fill="#94A3B8" fontSize="11" textAnchor="end">0</text>

              {/* Month Labels */}
              <text x="50" y="175" fill="#94A3B8" fontSize="11" textAnchor="middle">Feb</text>
              <text x="125" y="175" fill="#94A3B8" fontSize="11" textAnchor="middle">Mar</text>
              <text x="200" y="175" fill="#94A3B8" fontSize="11" textAnchor="middle">Apr</text>
              <text x="275" y="175" fill="#94A3B8" fontSize="11" textAnchor="middle">May</text>
              <text x="350" y="175" fill="#94A3B8" fontSize="11" textAnchor="middle">Jun</text>
              <text x="425" y="175" fill="#94A3B8" fontSize="11" textAnchor="middle">Jul</text>

              {/* Smooth Green Curve Line */}
              <path
                d="M 50 110 C 85 95, 90 92, 125 90 C 160 88, 165 80, 200 78 C 235 76, 240 68, 275 66 C 310 64, 315 58, 350 56 C 385 54, 390 50, 425 48"
                fill="none"
                stroke="#1A6B3C"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Markers at month points */}
              <circle cx="50" cy="110" r="4" fill="#1A6B3C" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="125" cy="90" r="4" fill="#1A6B3C" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="200" cy="78" r="4" fill="#1A6B3C" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="275" cy="66" r="4" fill="#1A6B3C" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="350" cy="56" r="4" fill="#1A6B3C" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="425" cy="48" r="4" fill="#1A6B3C" stroke="#FFFFFF" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* New Signups Grouped Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs flex flex-col justify-between w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#18181B]">New Signups</h2>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1A6B3C]" />
                <span className="text-[#52525B]">Consumers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4801A]" />
                <span className="text-[#52525B]">Providers</span>
              </div>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <svg className="w-full h-full" viewBox="0 0 450 180" preserveAspectRatio="none">
              {/* Horizontal Gridlines */}
              <line x1="35" y1="20" x2="440" y2="20" stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
              <text x="25" y="24" fill="#94A3B8" fontSize="10" textAnchor="end">2400</text>

              <line x1="35" y1="53" x2="440" y2="53" stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
              <text x="25" y="57" fill="#94A3B8" fontSize="10" textAnchor="end">1800</text>

              <line x1="35" y1="86" x2="440" y2="86" stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
              <text x="25" y="90" fill="#94A3B8" fontSize="10" textAnchor="end">1200</text>

              <line x1="35" y1="119" x2="440" y2="119" stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
              <text x="25" y="123" fill="#94A3B8" fontSize="10" textAnchor="end">600</text>

              <line x1="35" y1="152" x2="440" y2="152" stroke="#E2E8F0" strokeWidth="1" />
              <text x="25" y="156" fill="#94A3B8" fontSize="10" textAnchor="end">0</text>

              {/* Month Labels */}
              <text x="65" y="172" fill="#94A3B8" fontSize="11" textAnchor="middle">Feb</text>
              <text x="135" y="172" fill="#94A3B8" fontSize="11" textAnchor="middle">Mar</text>
              <text x="205" y="172" fill="#94A3B8" fontSize="11" textAnchor="middle">Apr</text>
              <text x="275" y="172" fill="#94A3B8" fontSize="11" textAnchor="middle">May</text>
              <text x="345" y="172" fill="#94A3B8" fontSize="11" textAnchor="middle">Jun</text>
              <text x="415" y="172" fill="#94A3B8" fontSize="11" textAnchor="middle">Jul</text>

              {/* Grouped Bars */}
              {/* Feb */}
              <rect x="54" y="105" width="10" height="47" rx="2" fill="#1A6B3C" />
              <rect x="66" y="142" width="10" height="10" rx="2" fill="#D4801A" />

              {/* Mar */}
              <rect x="124" y="92" width="10" height="60" rx="2" fill="#1A6B3C" />
              <rect x="136" y="138" width="10" height="14" rx="2" fill="#D4801A" />

              {/* Apr */}
              <rect x="194" y="80" width="10" height="72" rx="2" fill="#1A6B3C" />
              <rect x="206" y="134" width="10" height="18" rx="2" fill="#D4801A" />

              {/* May */}
              <rect x="264" y="65" width="10" height="87" rx="2" fill="#1A6B3C" />
              <rect x="276" y="130" width="10" height="22" rx="2" fill="#D4801A" />

              {/* Jun */}
              <rect x="334" y="52" width="10" height="100" rx="2" fill="#1A6B3C" />
              <rect x="346" y="126" width="10" height="26" rx="2" fill="#D4801A" />

              {/* Jul */}
              <rect x="404" y="42" width="10" height="110" rx="2" fill="#1A6B3C" />
              <rect x="416" y="120" width="10" height="32" rx="2" fill="#D4801A" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2 Bottom Action Cards - Fills width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 w-full">
        {/* Vetting Queue Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-[#FFF7ED] flex items-center justify-center text-[#EA580C] flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-[#18181B] leading-tight">
                Vetting Queue
              </p>
              <p className="text-xs text-[#71717A] mt-0.5 font-normal">
                {pendingVettingVal} providers awaiting document review
              </p>
              <Link
                href="/admin/providers"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#D4801A] hover:underline mt-2"
              >
                Review now →
              </Link>
            </div>
          </div>
        </div>

        {/* Flagged Content Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#EF4444] flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-[#18181B] leading-tight">
                Flagged Content
              </p>
              <p className="text-xs text-[#71717A] mt-0.5 font-normal">
                {pendingFlagsVal} items pending moderation
              </p>
              <Link
                href="/admin/flags"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#D4801A] hover:underline mt-2"
              >
                Moderate →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Help Button (?) */}
      <button
        type="button"
        onClick={() => setShowHelp(true)}
        className="fixed bottom-6 right-6 w-9 h-9 rounded-full bg-white border border-[#E5E7EB] text-[#71717A] text-sm font-medium shadow-md flex items-center justify-center hover:bg-gray-50 transition-all z-50"
        aria-label="Help"
      >
        ?
      </button>

      {/* Help & Support Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowHelp(false)} />
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative z-10 shadow-2xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#18181B]">Help & Support</h3>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-[#FAFAF9] rounded-xl">
                <div className="w-8 h-8 rounded-full bg-[#EAF5EE] flex items-center justify-center text-[#1A6B3C] flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#18181B]">Email support</p>
                  <p className="text-xs text-[#71717A] mt-0.5">support@sabipro.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#FAFAF9] rounded-xl">
                <div className="w-8 h-8 rounded-full bg-[#E6F1FB] flex items-center justify-center text-[#185FA5] flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#18181B]">Platform guide</p>
                  <p className="text-xs text-[#71717A] mt-0.5">Visit our documentation for admin guides</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="w-full mt-4 py-2.5 text-sm font-semibold text-white bg-[#1A6B3C] rounded-full hover:bg-[#15573A] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


