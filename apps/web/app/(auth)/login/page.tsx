'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button, StatusBanner } from '@/components/ui';
import { getSession } from 'next-auth/react';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface FieldErrors {
  email?: string;
  password?: string;
}

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Email address is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address';
  return undefined;
}

function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return undefined;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [registeredMsg, setRegisteredMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === 'true') {
      setRegisteredMsg('Account created successfully! Verify your email to log in.');
    }
  }, []);

  function validate(): boolean {
    const errors: FieldErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setFieldErrors(errors);
    return !errors.email && !errors.password;
  }

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsUnverified(false);
    setResendMsg('');

    if (!validate()) return;

    setIsLoading(true);

    try {
      const result = await login(email.trim(), password);

      if (result?.error) {
        const msg = result.error;
        if (msg.includes('verify your email')) setIsUnverified(true);
        setError(msg);
        return;
      }

      // Wait for the session to be established before navigating
      const session = await getSession();
      if (!session?.user) {
        setError('Session could not be established. Please try again.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleQuickLogin(roleEmail: string) {
    setEmail(roleEmail);
    setPassword('Password123!');
    setError('');
    setIsUnverified(false);
    setResendMsg('');
    setIsLoading(true);

    try {
      const result = await login(roleEmail, 'Password123!');

      if (result?.error) {
        const msg = result.error;
        if (msg.includes('verify your email')) setIsUnverified(true);
        setError(msg);
        return;
      }

      // Wait for the session to be established before navigating
      const session = await getSession();
      if (!session?.user) {
        setError('Session could not be established. Please try again.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setResendMsg('');
    try {
      const res = await api.auth.resendVerification(email);
      setResendMsg(res.data?.message || 'Verification email sent');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setResendMsg(err.message);
      } else {
        setResendMsg('Something went wrong. Please try again later');
      }
    }
  }

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-12 bg-surface-bg">
      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-6 left-4 md:left-8 w-10 h-10 rounded-full bg-neutral-0 border border-surface-border text-neutral-700 flex items-center justify-center transition-all hover:bg-neutral-50 active:scale-95 shadow-sm"
        aria-label="Back to home"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </Link>

      {/* SabiPro Logo */}
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
        {/* Login Card */}
        <div className="bg-neutral-0 border border-surface-border rounded-card p-8 shadow-sm">
          <h1 className="text-[28px] font-medium text-neutral-900 text-center mb-1.5">Welcome back</h1>
          <p className="text-small text-neutral-500 text-center mb-8">Log in to your SabiPro account</p>

          {registeredMsg && (
            <StatusBanner variant="success" className="mb-6">{registeredMsg}</StatusBanner>
          )}

          {error && (
            <StatusBanner variant="error" className="mb-6">
              {error}
              {isUnverified && (
                <div className="mt-3 space-y-2">
                  <Link href="/verify-email" className="block text-small text-primary-base hover:text-primary-hover underline">
                    Enter verification token
                  </Link>
                  <button
                    type="button"
                    onClick={handleResend}
                    className="block text-small text-primary-base hover:text-primary-hover underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    Resend verification email
                  </button>
                </div>
              )}
            </StatusBanner>
          )}

          {resendMsg && (
            <StatusBanner variant="success" className="mb-6">{resendMsg}</StatusBanner>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field with Icon */}
            <div className="flex flex-col gap-1.5">
              <label className="text-small font-medium text-neutral-700">Email address</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-neutral-500 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <input
                  type="email"
                  id="login-email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                  required
                  className={`w-full bg-neutral-0 border rounded-[14px] py-3 pl-11 pr-4 text-body text-neutral-900 placeholder:text-neutral-500 min-h-[44px] focus:outline-none focus:ring-1 disabled:bg-surface-bg disabled:cursor-not-allowed ${
                    fieldErrors.email ? 'border-error-base focus:border-error-base focus:ring-error-base' : 'border-surface-input focus:border-primary-base focus:ring-primary-base'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-caption text-error-base mt-0.5">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Field with Icon */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-small font-medium text-neutral-700">Password</label>
                <Link href="/forgot-password" className="text-small font-medium text-primary-base hover:text-primary-hover">
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-neutral-500 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                  required
                  className={`w-full bg-neutral-0 border rounded-[14px] py-3 pl-11 pr-11 text-body text-neutral-900 placeholder:text-neutral-500 min-h-[44px] focus:outline-none focus:ring-1 disabled:bg-surface-bg disabled:cursor-not-allowed ${
                    fieldErrors.password ? 'border-error-base focus:border-error-base focus:ring-error-base' : 'border-surface-input focus:border-primary-base focus:ring-primary-base'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-neutral-500 hover:text-neutral-700 min-h-[44px] flex items-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-caption text-error-base mt-0.5">{fieldErrors.password}</p>
              )}
            </div>

            {/* Log in Button */}
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={!email.trim() || !password}
              className="w-full !bg-primary-base hover:!bg-primary-deep !text-neutral-0 !rounded-[14px] mt-2 disabled:!bg-surface-disabled disabled:!cursor-not-allowed"
            >
              Log in
            </Button>

            {/* Role Selection Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => handleQuickLogin('chioma@sabipro.com')}
                className="flex-1 text-center py-2.5 border border-surface-input hover:bg-surface-bg rounded-[14px] text-small font-medium text-neutral-900 transition-colors"
              >
                Consumer
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('emeka@sabipro.com')}
                className="flex-1 text-center py-2.5 border border-surface-input hover:bg-surface-bg rounded-[14px] text-small font-medium text-neutral-900 transition-colors"
              >
                Provider
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@sabipro.com')}
                className="flex-1 text-center py-2.5 border border-surface-input hover:bg-surface-bg rounded-[14px] text-small font-medium text-neutral-900 transition-colors"
              >
                Admin
              </button>
            </div>
            <p className="text-caption text-neutral-500 text-center mt-3">
              Click any role above to explore as that user type
            </p>
          </form>
        </div>

        {/* Footer Link */}
        <div className="mt-8 text-center text-body">
          <span className="text-neutral-700">New to SabiPro? </span>
          <Link href="/register" className="text-primary-base hover:text-primary-hover font-semibold">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
