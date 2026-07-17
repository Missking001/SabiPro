'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { api, ApiClientError } from '@/lib/api';
import { StatusBanner } from '@/components/ui';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, mounted: themeMounted } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance'>('profile');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');

  // Security form state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      // In a full implementation this would call an update profile endpoint
      await new Promise((res) => setTimeout(res, 800));
      setFeedback({ type: 'success', msg: 'Profile updated successfully' });
    } catch (err) {
      setFeedback({ type: 'error', msg: err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again later' });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setFeedback({ type: 'error', msg: 'New passwords do not match' });
      return;
    }
    if (newPw.length < 8) {
      setFeedback({ type: 'error', msg: 'Password must be at least 8 characters' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await new Promise((res) => setTimeout(res, 800));
      setFeedback({ type: 'success', msg: 'Password changed successfully' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Something went wrong. Please try again later' });
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'appearance', label: 'Appearance' },
  ] as const;

  const inputCls = 'w-full border border-surface-input bg-neutral-0 dark:bg-surface-bg text-neutral-900 dark:text-neutral-900 rounded-component px-4 py-3 text-small focus:outline-none focus:ring-2 focus:ring-primary-base/30 focus:border-primary-base transition-colors';
  const labelCls = 'block text-caption font-medium text-neutral-700 mb-1.5';

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-full bg-neutral-0 border border-surface-border text-neutral-700 flex items-center justify-center transition-all hover:bg-surface-bg active:scale-95 shadow-sm"
          aria-label="Back to dashboard"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-heading text-neutral-900 font-medium">Account Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-bg border border-surface-border rounded-component p-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setFeedback(null); }}
            className={`flex-1 min-w-max h-9 rounded-[6px] text-small font-medium transition-all whitespace-nowrap px-3 ${
              activeTab === tab.id
                ? 'bg-neutral-0 text-primary-base shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {feedback && (
        <StatusBanner variant={feedback.type} className="mb-4">
          {feedback.msg}
        </StatusBanner>
      )}

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="bg-neutral-0 border border-surface-border rounded-card p-5 md:p-6">
          <h2 className="text-subhead font-medium text-neutral-900 mb-5">Personal information</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className={labelCls} htmlFor="settings-name">Full name</label>
              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="settings-email">Email address</label>
              <input
                id="settings-email"
                type="email"
                value={user?.email || ''}
                disabled
                className={`${inputCls} opacity-60 cursor-not-allowed`}
              />
              <p className="text-caption text-neutral-500 mt-1">Email cannot be changed after registration</p>
            </div>
            <div>
              <label className={labelCls} htmlFor="settings-phone">Phone number</label>
              <input
                id="settings-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
                placeholder="e.g. 08012345678"
              />
            </div>
            <div>
              <label className={labelCls}>Account type</label>
              <div className="flex items-center gap-2 h-12 px-4 border border-surface-border bg-surface-bg rounded-component text-small text-neutral-700">
                <span className="w-2 h-2 rounded-full bg-success-base" />
                {user?.role} Account
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full h-11 bg-primary-base hover:bg-primary-deep text-white text-small font-medium rounded-component transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="bg-neutral-0 border border-surface-border rounded-card p-5 md:p-6">
            <h2 className="text-subhead font-medium text-neutral-900 mb-5">Change password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className={labelCls} htmlFor="settings-current-pw">Current password</label>
                <input id="settings-current-pw" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className={inputCls} placeholder="Enter current password" required />
              </div>
              <div>
                <label className={labelCls} htmlFor="settings-new-pw">New password</label>
                <input id="settings-new-pw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={inputCls} placeholder="Minimum 8 characters" required />
              </div>
              <div>
                <label className={labelCls} htmlFor="settings-confirm-pw">Confirm new password</label>
                <input id="settings-confirm-pw" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={inputCls} placeholder="Repeat new password" required />
              </div>
              <button type="submit" disabled={saving} className="w-full h-11 bg-primary-base hover:bg-primary-deep text-white text-small font-medium rounded-component transition-colors disabled:opacity-60">
                {saving ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </div>

          <div className="bg-error-bg border border-error-border rounded-card p-5">
            <h3 className="text-small font-medium text-error-text mb-2">Danger zone</h3>
            <p className="text-caption text-error-text/70 mb-4">Signing out ends your current session on this device.</p>
            <button
              onClick={logout}
              className="w-full h-11 bg-neutral-0 border border-error-border hover:bg-error-bg text-error-text text-small font-medium rounded-component transition-colors"
            >
              Sign out of all devices
            </button>
          </div>
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === 'notifications' && (
        <div className="bg-neutral-0 border border-surface-border rounded-card p-5 md:p-6">
          <h2 className="text-subhead font-medium text-neutral-900 mb-5">Notification preferences</h2>
          <div className="space-y-5">
            {[
              { id: 'notif-inquiries', label: 'New inquiry responses', description: 'When a provider replies to your inquiry' },
              { id: 'notif-reviews', label: 'Review alerts', description: 'When you receive a new review' },
              { id: 'notif-payments', label: 'Payment updates', description: 'When a payment is confirmed, disputed, or refunded' },
              { id: 'notif-bookings', label: 'Booking reminders', description: 'Reminders about upcoming jobs' },
            ].map(({ id, label, description }) => (
              <label key={id} htmlFor={id} className="flex items-start gap-4 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input id={id} type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-surface-input peer-checked:bg-primary-base rounded-pill transition-colors" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </div>
                <div>
                  <p className="text-small font-medium text-neutral-900">{label}</p>
                  <p className="text-caption text-neutral-500">{description}</p>
                </div>
              </label>
            ))}
          </div>
          <button className="mt-6 w-full h-11 bg-primary-base hover:bg-primary-deep text-white text-small font-medium rounded-component transition-colors">
            Save preferences
          </button>
        </div>
      )}

      {/* Appearance tab */}
      {activeTab === 'appearance' && (
        <div className="bg-neutral-0 border border-surface-border rounded-card p-5 md:p-6">
          <h2 className="text-subhead font-medium text-neutral-900 mb-5">App appearance</h2>
          <p className="text-small text-neutral-500 mb-6">Choose how SabiPro looks on your device.</p>

          {themeMounted && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Light mode card */}
              <button
                onClick={() => !isDark || toggleTheme()}
                className={`p-4 border-2 rounded-card flex flex-col items-center gap-3 transition-all ${!isDark ? 'border-primary-base bg-primary-tint' : 'border-surface-border hover:border-neutral-300'}`}
              >
                <div className="w-14 h-10 bg-white border border-surface-border rounded-component shadow-sm flex items-center justify-center">
                  <svg className="w-5 h-5 text-secondary-base" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className={`text-small font-medium ${!isDark ? 'text-primary-base' : 'text-neutral-700'}`}>Light</span>
              </button>

              {/* Dark mode card */}
              <button
                onClick={() => isDark || toggleTheme()}
                className={`p-4 border-2 rounded-card flex flex-col items-center gap-3 transition-all ${isDark ? 'border-primary-base bg-primary-tint' : 'border-surface-border hover:border-neutral-300'}`}
              >
                <div className="w-14 h-10 bg-neutral-900 border border-neutral-700 rounded-component shadow-sm flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <span className={`text-small font-medium ${isDark ? 'text-primary-base' : 'text-neutral-700'}`}>Dark</span>
              </button>
            </div>
          )}

          <p className="text-caption text-neutral-500 text-center">Your preference is saved automatically and persists across sessions.</p>
        </div>
      )}
    </div>
  );
}
