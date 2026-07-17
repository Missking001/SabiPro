'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge, Skeleton, StatusBanner } from '@/components/ui';
import { api, ApiClientError } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await api.admin.users();
      setUsers(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSuspend(id: string) {
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

  if (isLoading) {
    return (
      <div>
        <h1 className="text-heading text-neutral-900 mb-6">Users</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><Skeleton className="h-12 w-full" /></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-heading text-neutral-900 mb-6">Users</h1>

      {feedback && <StatusBanner variant="success" className="mb-4">{feedback}</StatusBanner>}
      {error && <StatusBanner variant="error" className="mb-4">{error}</StatusBanner>}

      {users.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-body text-neutral-500">No users found</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-caption text-neutral-500 uppercase tracking-wide py-3 px-4">Name</th>
                <th className="text-caption text-neutral-500 uppercase tracking-wide py-3 px-4">Email</th>
                <th className="text-caption text-neutral-500 uppercase tracking-wide py-3 px-4">Role</th>
                <th className="text-caption text-neutral-500 uppercase tracking-wide py-3 px-4">Status</th>
                <th className="text-caption text-neutral-500 uppercase tracking-wide py-3 px-4">Joined</th>
                <th className="text-caption text-neutral-500 uppercase tracking-wide py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-surface-border hover:bg-surface-bg transition-colors">
                  <td className="text-small text-neutral-900 py-3 px-4 font-medium">{user.name}</td>
                  <td className="text-small text-neutral-700 py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className="text-caption font-medium text-neutral-700 bg-surface-bg px-2 py-0.5 rounded-pill">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {user.isActive ? (
                      <Badge variant="available">Active</Badge>
                    ) : (
                      <Badge variant="unavailable">Suspended</Badge>
                    )}
                  </td>
                  <td className="text-caption text-neutral-500 py-3 px-4">{formatDate(user.createdAt)}</td>
                  <td className="py-3 px-4">
                    {user.role !== 'ADMIN' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        isLoading={processingId === user.id}
                        onClick={() => handleSuspend(user.id)}
                        className={!user.isActive ? 'text-success-base border-success-base' : 'text-error-base border-error-base'}
                      >
                        {user.isActive ? 'Suspend' : 'Reactivate'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
