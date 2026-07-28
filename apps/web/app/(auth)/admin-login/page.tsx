'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button, StatusBanner } from '@/components/ui';
import { api, ApiClientError } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldError, setFieldError] = useState('');

  function validate(): boolean {
    if (!code.trim()) {
      setFieldError('Admin code is required');
      return false;
    }
    if (code.trim().length < 4) {
      setFieldError('Invalid admin code');
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldError('');

    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await api.auth.adminRegister({ code: code.trim() });
      if (res.data?.token) {
        sessionStorage.setItem('sabipro_token', res.data.token);
        if (res.data?.user) {
          sessionStorage.setItem('sabipro_admin_user', JSON.stringify(res.data.user));
        }
      }
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Invalid admin code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-12 bg-surface-bg">
      <Link
        href="/login"
        className="absolute top-6 left-4 md:left-8 w-10 h-10 rounded-full bg-neutral-0 border border-surface-border text-neutral-700 flex items-center justify-center transition-all hover:bg-neutral-50 active:scale-95 shadow-sm"
        aria-label="Back to login"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </Link>

      <Link href="/" className="mb-8 select-none inline-block">
        <Image
          src="/sabipro_logo_v4.png"
          alt="SabiPro"
          width={170}
          height={46}
          className="w-full h-auto"
          priority
        />
      </Link>

      <div className="w-full max-w-[480px]">
        <div className="bg-neutral-0 border border-surface-border rounded-card p-8 shadow-sm">
          <h1 className="text-[28px] font-medium text-neutral-900 text-center mb-1.5">
            Admin sign in
          </h1>
          <p className="text-small text-neutral-500 text-center mb-8">
            Enter your admin code to continue
          </p>

          {error && (
            <StatusBanner variant="error" className="mb-6">{error}</StatusBanner>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-small font-medium text-neutral-700">Admin code</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-neutral-500 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.5V15m0 0l3-3m-3 3l-3-3m3-3a9 9 0 100 18 9 9 0 000-18z" />
                  </svg>
                </div>
                <input
                  type="password"
                  id="admin-code"
                  placeholder="Enter admin code"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setFieldError(''); }}
                  autoComplete="off"
                  required
                  className={`w-full bg-neutral-0 border rounded-[14px] py-3 pl-11 pr-4 text-body text-neutral-900 placeholder:text-neutral-500 min-h-[44px] focus:outline-none focus:ring-1 ${
                    fieldError ? 'border-error-base focus:border-error-base focus:ring-error-base' : 'border-surface-input focus:border-primary-base focus:ring-primary-base'
                  }`}
                />
              </div>
              {fieldError && (
                <p className="text-caption text-error-base mt-0.5">{fieldError}</p>
              )}
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              disabled={!code.trim()}
              className="w-full !bg-primary-base hover:!bg-primary-deep !text-neutral-0 !rounded-[14px] mt-2 disabled:!bg-surface-disabled disabled:!cursor-not-allowed"
            >
              Sign in as admin
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-small text-primary-base hover:text-primary-hover underline"
              >
                Sign in as a user instead
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
