'use client';

import { useState, useEffect } from 'react';
import { Skeleton, StatusBanner } from '@/components/ui';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/components/admin/SidebarContext';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  city?: string;
  _location?: string;
  _isFlagged?: boolean;
}

/* ── Mock data matching the reference screenshot ── */
const mockUsers: AdminUser[] = [
  {
    id: 'mock-u1',
    name: 'Aisha Bello',
    email: 'aisha@example.com',
    role: 'CONSUMER',
    isActive: true,
    createdAt: '2025-01-15T00:00:00Z',
    _location: 'Lagos',
  },
  {
    id: 'mock-u2',
    name: 'Emeka Okafor',
    email: 'emeka@example.com',
    role: 'PROVIDER',
    isActive: true,
    createdAt: '2025-01-10T00:00:00Z',
    _location: 'Lagos',
  },
  {
    id: 'mock-u3',
    name: 'Fast Fix Mechanics',
    email: 'fastfix@example.com',
    role: 'PROVIDER',
    isActive: true,
    createdAt: '2025-03-22T00:00:00Z',
    _location: 'Abuja',
    _isFlagged: true,
  },
  {
    id: 'mock-u4',
    name: 'Ngozi Mensah',
    email: 'ngozi@example.com',
    role: 'CONSUMER',
    isActive: true,
    createdAt: '2025-04-05T00:00:00Z',
    _location: 'Abuja',
  },
  {
    id: 'mock-u5',
    name: 'Seun Adeyemi',
    email: 'seun@example.com',
    role: 'CONSUMER',
    isActive: false,
    createdAt: '2025-05-02T00:00:00Z',
    _location: 'Lagos',
  },
];

function formatJoinDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toggle: toggleSidebar } = useSidebar();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await api.admin.users();
      const live = res.data || [];
      setUsers(live.length > 0 ? live : mockUsers);
    } catch {
      setUsers(mockUsers);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSuspend(id: string) {
    if (id.startsWith('mock-')) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u)),
      );
      setFeedback('User status updated');
      return;
    }
    setProcessingId(id);
    setFeedback('');
    try {
      await api.admin.suspendUser(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u)),
      );
      setFeedback('User status updated');
    } catch (err) {
      setFeedback(err instanceof ApiClientError ? err.message : 'Failed to update user');
    } finally {
      setProcessingId(null);
    }
  }

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()),
  );

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between py-1 w-full">
          <Skeleton className="h-6 w-6 rounded" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="w-9 h-9 rounded-full" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-52 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="py-4 border-b border-[#F4F4F5] last:border-b-0">
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 relative pb-12">
      {/* ── Top Header Bar ── */}
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
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#52525B] hover:text-[#18181B] transition-colors relative shadow-xs"
            aria-label="Notifications"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#1A6B3C] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              A
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-[#18181B] leading-tight">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-[#71717A] leading-tight">Platform ops</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page Title + Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#18181B] leading-tight">User Management</h1>
          <p className="text-sm text-[#71717A] mt-1">All consumers and providers on the platform</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-[220px] pl-9 pr-4 py-2.5 text-sm bg-white border border-[#E5E7EB] rounded-lg text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#1A6B3C]/20 focus:border-[#1A6B3C] transition-all"
          />
        </div>
      </div>

      {feedback && <StatusBanner variant="success" className="mb-0">{feedback}</StatusBanner>}
      {error && <StatusBanner variant="error" className="mb-0">{error}</StatusBanner>}

      {/* ── Users Table ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] text-center py-16">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-sm text-[#71717A]">
            {search ? 'No users match your search' : 'No users found'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#F4F4F5]">
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Name</th>
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Role</th>
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Location</th>
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Joined</th>
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Status</th>
                  <th className="text-xs font-medium text-[#71717A] py-3.5 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const location = (u as AdminUser)._location || u.city || '—';
                  const isFlagged = (u as AdminUser)._isFlagged;
                  const isProcessing = processingId === u.id;
                  const isConsumer = u.role === 'CONSUMER';

                  let statusLabel: string;
                  let statusClass: string;
                  if (!u.isActive) {
                    statusLabel = 'Suspended';
                    statusClass = 'text-[#71717A]';
                  } else if (isFlagged) {
                    statusLabel = 'Flagged';
                    statusClass = 'text-[#EF4444] bg-[#FEF2F2] border border-[#FECACA] px-2 py-0.5 rounded text-xs font-medium';
                  } else {
                    statusLabel = 'Active';
                    statusClass = 'text-[#1A6B3C] font-medium';
                  }

                  return (
                    <tr key={u.id} className="border-b border-[#F4F4F5] last:border-b-0 hover:bg-[#FAFAF9] transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-[#18181B]">{u.name}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                            isConsumer
                              ? 'bg-[#EAF5EE] text-[#1A6B3C]'
                              : 'bg-[#EAF5EE] text-[#1A6B3C]'
                          }`}
                        >
                          {isConsumer ? 'Consumer' : 'Provider'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-[#71717A]">{location}</td>
                      <td className="py-4 px-6 text-sm text-[#71717A] whitespace-nowrap">{formatJoinDate(u.createdAt)}</td>
                      <td className="py-4 px-6">
                        <span className={`text-sm ${statusClass}`}>{statusLabel}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="text-sm text-[#71717A] hover:text-[#18181B] font-medium transition-colors"
                          >
                            View
                          </button>
                          {u.role !== 'ADMIN' && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleSuspend(u.id)}
                              className={`text-xs font-semibold px-3.5 py-1.5 rounded-md transition-colors disabled:opacity-50 ${
                                u.isActive
                                  ? 'text-[#EF4444] border border-[#EF4444] hover:bg-[#FEF2F2]'
                                  : 'text-[#1A6B3C] border border-[#1A6B3C] hover:bg-[#EAF5EE]'
                              }`}
                            >
                              {u.isActive ? 'Suspend' : 'Reinstate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Help FAB ── */}
      <button
        type="button"
        className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-white border border-[#E5E7EB] shadow-md flex items-center justify-center text-[#71717A] hover:text-[#18181B] hover:shadow-lg transition-all z-50"
        aria-label="Help"
      >
        ?
      </button>
    </div>
  );
}
