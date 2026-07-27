'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton, Card } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { AdminHelpButton } from '@/components/admin/AdminHelpButton';
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

interface ChartData {
  revenue: { month: string; revenue: number }[];
  signups: { month: string; consumers: number; providers: number }[];
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { toggle: toggleSidebar } = useSidebar();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, chartsRes] = await Promise.all([
          api.admin.dashboard(),
          api.admin.charts(),
        ]);
        if (statsRes.data) setStats(statsRes.data);
        if (chartsRes.data) setChartData(chartsRes.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const totalUsersVal = stats?.totalUsers ?? 0;
  const activeProvidersVal = stats?.activeProviders ?? 0;
  const activeBookingsVal = stats?.totalInquiries ?? 0;
  const revenueDisplay = stats?.platformRevenue ? `₦${(stats.platformRevenue / 100).toLocaleString('en-NG')}` : '₦0';
  const pendingVettingVal = stats?.pendingVetting ?? 0;
  const pendingFlagsVal = stats?.pendingFlags ?? 0;

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
            Monthly Revenue (₦)
          </h2>
          <div className="h-60 w-full pt-2">
            {chartData?.revenue && chartData.revenue.some((d) => d.revenue > 0) ? (
              <svg className="w-full h-full" viewBox="0 0 450 180" preserveAspectRatio="none">
                {(() => {
                  const data = chartData.revenue;
                  const maxVal = Math.max(...data.map((d) => d.revenue), 1);
                  const chartH = 140;
                  const padL = 50;
                  const padR = 10;
                  const gap = (450 - padL - padR) / (data.length - 1 || 1);
                  const toY = (v: number) => 160 - (v / maxVal) * chartH;
                  const points = data.map((d, i) => ({ x: padL + i * gap, y: toY(d.revenue) }));
                  const pathD = points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `C ${points[i-1].x + gap/2} ${points[i-1].y}, ${p.x - gap/2} ${p.y}, ${p.x} ${p.y}`).join(' ');
                  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ y: 160 - f * chartH, label: Math.round(maxVal * (1 - f)) }));
                  return (
                    <>
                      {gridLines.map((gl, i) => (
                        <g key={i}>
                          <line x1={padL} y1={gl.y} x2={440} y2={gl.y} stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
                          <text x={padL - 8} y={gl.y + 4} fill="#94A3B8" fontSize="10" textAnchor="end">
                            {gl.label.toLocaleString()}
                          </text>
                        </g>
                      ))}
                      <path d={pathD} fill="none" stroke="#1A6B3C" strokeWidth="2.5" strokeLinecap="round" />
                      {points.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="4" fill="#1A6B3C" stroke="#FFFFFF" strokeWidth="2" />
                          <text x={p.x} y={175} fill="#94A3B8" fontSize="10" textAnchor="middle">{data[i].month}</text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-[#71717A]">
                No revenue data yet
              </div>
            )}
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
            {chartData?.signups && chartData.signups.some((d) => d.consumers > 0 || d.providers > 0) ? (
              <svg className="w-full h-full" viewBox="0 0 450 180" preserveAspectRatio="none">
                {(() => {
                  const data = chartData.signups;
                  const maxVal = Math.max(...data.map((d) => Math.max(d.consumers, d.providers)), 1);
                  const chartH = 132;
                  const padL = 40;
                  const barGroupW = 65;
                  const barW = 10;
                  const baseY = 152;
                  const toY = (v: number) => baseY - (v / maxVal) * chartH;
                  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => baseY - f * chartH);
                  const gridLabels = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxVal * f));
                  return (
                    <>
                      {gridLines.map((y, i) => (
                        <g key={i}>
                          <line x1={padL} y1={y} x2={440} y2={y} stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
                          <text x={padL - 6} y={y + 4} fill="#94A3B8" fontSize="9" textAnchor="end">{gridLabels[i]}</text>
                        </g>
                      ))}
                      {data.map((d, i) => {
                        const cx = padL + 15 + i * barGroupW;
                        const cH = (d.consumers / maxVal) * chartH;
                        const pH = (d.providers / maxVal) * chartH;
                        return (
                          <g key={i}>
                            <rect x={cx} y={toY(d.consumers)} width={barW} height={cH} rx="2" fill="#1A6B3C" />
                            <rect x={cx + barW + 3} y={toY(d.providers)} width={barW} height={pH} rx="2" fill="#D4801A" />
                            <text x={cx + barW + 1} y={172} fill="#94A3B8" fontSize="10" textAnchor="middle">{d.month}</text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-[#71717A]">
                No signup data yet
              </div>
            )}
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

      <AdminHelpButton />
    </div>
  );
}


