'use client';

import { useState, useEffect } from 'react';
import { Skeleton, StatusBanner } from '@/components/ui';
import { api, ApiClientError } from '@/lib/api';
import { AdminHeader, FloatingHelpButton } from '@/components/admin/AdminHeader';

interface UserItem {
  id: string;
  name: string;
  role: 'Consumer' | 'Provider' | 'Admin';
  location: string;
  joined: string;
  status: 'Active' | 'Flagged' | 'Suspended';
}

const fallbackUsers: UserItem[] = [
  {
    id: 'u-1',
    name: 'Aisha Bello',
    role: 'Consumer',
    location: 'Lagos',
    joined: '15 Jan 2025',
    status: 'Active',
  },
  {
    id: 'u-2',
    name: 'Emeka Okafor',
    role: 'Provider',
    location: 'Lagos',
    joined: '10 Jan 2025',
    status: 'Active',
  },
  {
    id: 'u-3',
    name: 'Fast Fix Mechanics',
    role: 'Provider',
    location: 'Abuja',
    joined: '22 Mar 2025',
    status: 'Flagged',
  },
  {
    id: 'u-4',
    name: 'Ngozi Mensah',
    role: 'Consumer',
    location: 'Abuja',
    joined: '5 Apr 2025',
    status: 'Active',
  },
  {
    id: 'u-5',
    name: 'Seun Adeyemi',
    role: 'Consumer',
    location: 'Lagos',
    joined: '2 May 2025',
    status: 'Suspended',
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>(fallbackUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.admin.users();
        if (res.data && res.data.length > 0) {
          const mapped: UserItem[] = res.data.map((u) => ({
            id: u.id,
            name: u.name,
            role: u.role === 'PROVIDER' ? 'Provider' : 'Consumer',
            location: 'Lagos',
            joined: new Date(u.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            status: !u.isActive ? 'Suspended' : 'Active',
          }));
          setUsers(mapped);
        }
      } catch (err: any) {
        // Fallback for preview
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function handleToggleSuspend(id: string, currentStatus: string) {
    setProcessingId(id);
    setFeedback('');
    try {
      if (!id.startsWith('u-')) {
        await api.admin.suspendUser(id);
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, status: currentStatus === 'Suspended' ? 'Active' : 'Suspended' }
            : u
        )
      );
      setFeedback(`User ${currentStatus === 'Suspended' ? 'reinstated' : 'suspended'} successfully`);
    } catch (err) {
      setFeedback(err instanceof ApiClientError ? err.message : 'Failed to update user status');
    } finally {
      setProcessingId(null);
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="w-full">
        <AdminHeader />
        <div className="mb-6">
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs w-full space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 relative pb-12">
      <AdminHeader />

      {/* Title + Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#18181B] tracking-tight">
            User Management
          </h1>
          <p className="text-sm text-[#71717A] mt-0.5">
            All consumers and providers on the platform
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <svg
            className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2"
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E5E7EB] rounded-full pl-10 pr-4 py-2 text-sm text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#1A6B3C] shadow-2xs transition-colors"
          />
        </div>
      </div>

      {feedback && <StatusBanner variant="success" className="my-2">{feedback}</StatusBanner>}
      {error && <StatusBanner variant="error" className="my-2">{error}</StatusBanner>}

      {/* Users Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-xs overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F4F4F5] bg-[#F9F9F8]">
                <th className="py-3.5 px-6 text-xs font-semibold text-[#71717A]">Name</th>
                <th className="py-3.5 px-6 text-xs font-semibold text-[#71717A]">Role</th>
                <th className="py-3.5 px-6 text-xs font-semibold text-[#71717A]">Location</th>
                <th className="py-3.5 px-6 text-xs font-semibold text-[#71717A]">Joined</th>
                <th className="py-3.5 px-6 text-xs font-semibold text-[#71717A]">Status</th>
                <th className="py-3.5 px-6 text-xs font-semibold text-[#71717A]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F5]">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-4 px-6 text-sm font-semibold text-[#18181B]">
                    {user.name}
                  </td>
                  <td className="py-4 px-6">
                    {user.role === 'Consumer' ? (
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                        Consumer
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                        Provider
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-sm text-[#52525B]">
                    {user.location}
                  </td>
                  <td className="py-4 px-6 text-sm text-[#71717A]">
                    {user.joined}
                  </td>
                  <td className="py-4 px-6">
                    {user.status === 'Active' && (
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#15803D]">
                        Active
                      </span>
                    )}
                    {user.status === 'Flagged' && (
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#B91C1C]">
                        Flagged
                      </span>
                    )}
                    {user.status === 'Suspended' && (
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-[#F3F4F6] text-[#4B5563]">
                        Suspended
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#374151] text-xs font-semibold px-3 py-1 rounded-full transition-colors"
                      >
                        View
                      </button>

                      {user.status === 'Suspended' ? (
                        <button
                          type="button"
                          disabled={processingId === user.id}
                          onClick={() => handleToggleSuspend(user.id, user.status)}
                          className="border border-[#86EFAC] bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#166534] text-xs font-semibold px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                        >
                          Reinstate
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={processingId === user.id}
                          onClick={() => handleToggleSuspend(user.id, user.status)}
                          className="border border-[#FCA5A5] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FloatingHelpButton />
    </div>
  );
}
