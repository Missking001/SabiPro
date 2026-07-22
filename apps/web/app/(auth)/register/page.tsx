'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getSession } from 'next-auth/react';
import { Button, StatusBanner } from '@/components/ui';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const CITIES = ['Lagos', 'Abuja'];

interface FieldErrors {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  password?: string;
  terms?: string;
}

const PASSWORD_ORDER = [
  { key: 'uppercase', label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { key: 'lowercase', label: 'One lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
  { key: 'number', label: 'One number', test: (pw: string) => /\d/.test(pw) },
  { key: 'special', label: 'One special character', test: (pw: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw) },
] as const;

function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
  if (!/\d/.test(password)) return 'Password must contain a number';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) return 'Password must contain a special character';
  return undefined;
}

function getVisibleRequirements(password: string) {
  const result: { key: string; label: string; met: boolean }[] = [];
  if (!password) return result;

  let showNext = true;
  for (const req of PASSWORD_ORDER) {
    if (!showNext) break;
    const met = req.test(password);
    result.push({ key: req.key, label: req.label, met });
    showNext = met;
  }

  return result;
}

function validateName(name: string): string | undefined {
  if (!name.trim()) return 'Full name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  return undefined;
}

function validatePhone(phone: string): string | undefined {
  if (!phone) return 'Phone number is required';
  if (phone.length < 10 || phone.length > 11) return 'Please enter a valid phone number';
  return undefined;
}

function formatPhone(digits: string): string {
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 3));
  if (digits.length > 3) parts.push(digits.slice(3, 7));
  if (digits.length > 7) parts.push(digits.slice(7, 11));
  return parts.join(' ');
}

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Email address is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address';
  return undefined;
}

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Lagos');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [role, setRole] = useState<'CONSUMER' | 'PROVIDER'>('CONSUMER');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const visibleRequirements = getVisibleRequirements(password);

  function validate(): boolean {
    const errors: FieldErrors = {
      name: validateName(name),
      phone: validatePhone(phone),
      email: validateEmail(email),
      password: validatePassword(password),
      terms: agreedToTerms ? undefined : 'Please agree to the terms of service and privacy policy',
    };
    setFieldErrors(errors);
    return !errors.name && !errors.phone && !errors.email && !errors.password && !errors.terms;
  }

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setIsLoading(true);

    try {
      await api.auth.register({ name: name.trim(), email: email.trim(), password, role, phone: `+234${phone}`, city });

      const loginResult = await login(email.trim(), password);
      if (loginResult?.ok) {
        const session = await getSession();
        if (session?.user) {
          router.push('/onboarding');
          router.refresh();
          return;
        }
      }

      router.push('/login?registered=true');
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center px-4 py-8 bg-surface-bg">
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
      <Link href="/" className="mt-12 mb-6 select-none inline-block">
        <Image
          src="/sabipro_logo_v4.png"
          alt="SabiPro"
          width={170}
          height={46}
          className="w-full h-auto"
          priority
        />
      </Link>

      <div className="w-full max-w-md">
        <div className="bg-neutral-0 border border-surface-border rounded-card p-6 md:p-8">
          {error && <StatusBanner variant="error" className="mb-4">{error}</StatusBanner>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* I WANT TO... */}
            <div className="flex flex-col gap-1.5">
              <label className="text-small font-medium text-neutral-700">I WANT TO...</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRole('CONSUMER')}
                  className={`flex-1 p-4 rounded-card border-2 flex flex-col items-center gap-2 transition-all ${
                    role === 'CONSUMER'
                      ? 'border-primary-base bg-primary-tint'
                      : 'border-surface-border hover:border-neutral-300'
                  }`}
                >
                  <svg className={`w-8 h-8 ${role === 'CONSUMER' ? 'text-primary-base' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <div className="text-center">
                    <p className={`text-small font-medium ${role === 'CONSUMER' ? 'text-primary-base' : 'text-neutral-900'}`}>
                      Find a Pro
                    </p>
                    <p className="text-caption text-neutral-500 leading-tight mt-0.5">
                      Hire skilled tradespeople
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('PROVIDER')}
                  className={`flex-1 p-4 rounded-card border-2 flex flex-col items-center gap-2 transition-all ${
                    role === 'PROVIDER'
                      ? 'border-primary-base bg-primary-tint'
                      : 'border-surface-border hover:border-neutral-300'
                  }`}
                >
                  <svg className={`w-8 h-8 ${role === 'PROVIDER' ? 'text-primary-base' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                  <div className="text-center">
                    <p className={`text-small font-medium ${role === 'PROVIDER' ? 'text-primary-base' : 'text-neutral-900'}`}>
                      Offer services
                    </p>
                    <p className="text-caption text-neutral-500 leading-tight mt-0.5">
                      List my skills & get hired
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Full name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-small font-medium text-neutral-700">Full name</label>
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => { setName(e.target.value); clearFieldError('name'); }}
                required
                className={`w-full bg-neutral-0 border rounded-component py-3 px-4 text-body text-neutral-900 placeholder:text-neutral-500 min-h-[44px] focus:outline-none focus:ring-1 ${
                  fieldErrors.name ? 'border-error-base focus:border-error-base focus:ring-error-base' : 'border-surface-input focus:border-primary-base focus:ring-primary-base'
                }`}
              />
              {fieldErrors.name && (
                <p className="text-caption text-error-base mt-0.5">{fieldErrors.name}</p>
              )}
            </div>

            {/* Phone number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-small font-medium text-neutral-700">Phone number</label>
              <div className={`flex items-center bg-neutral-0 border rounded-component min-h-[44px] focus-within:outline-none focus-within:ring-1 ${
                fieldErrors.phone ? 'border-error-base focus-within:border-error-base focus-within:ring-error-base' : 'border-surface-input focus-within:border-primary-base focus-within:ring-primary-base'
              }`}>
                <span className="pl-4 text-body text-neutral-900 font-medium select-none">+234 </span>
                <input
                  type="tel"
                  placeholder="XXX XXXX XXX"
                  value={formatPhone(phone)}
                  onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); if (val.length <= 11) setPhone(val); clearFieldError('phone'); }}
                  required
                  className="flex-1 bg-transparent border-none py-3 pr-4 text-body text-neutral-900 placeholder:text-neutral-500 min-h-[44px] focus:outline-none"
                />
              </div>
              {fieldErrors.phone && (
                <p className="text-caption text-error-base mt-0.5">{fieldErrors.phone}</p>
              )}
            </div>

            {/* Email address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-small font-medium text-neutral-700">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                required
                className={`w-full bg-neutral-0 border rounded-component py-3 px-4 text-body text-neutral-900 placeholder:text-neutral-500 min-h-[44px] focus:outline-none focus:ring-1 ${
                  fieldErrors.email ? 'border-error-base focus:border-error-base focus:ring-error-base' : 'border-surface-input focus:border-primary-base focus:ring-primary-base'
                }`}
              />
              {fieldErrors.email && (
                <p className="text-caption text-error-base mt-0.5">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-small font-medium text-neutral-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                  required
                  className={`w-full bg-neutral-0 border rounded-component py-3 px-4 pr-12 text-body text-neutral-900 placeholder:text-neutral-500 min-h-[44px] focus:outline-none focus:ring-1 ${
                    fieldErrors.password ? 'border-error-base focus:border-error-base focus:ring-error-base' : 'border-surface-input focus:border-primary-base focus:ring-primary-base'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {visibleRequirements.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  {visibleRequirements.map((req) => (
                    <span
                      key={req.key}
                      className={`text-caption flex items-center gap-1 ${
                        req.met ? 'text-success-base' : 'text-neutral-500'
                      }`}
                    >
                      <svg className={`w-3 h-3 ${req.met ? 'text-success-base' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        {req.met ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        )}
                      </svg>
                      {req.label}
                    </span>
                  ))}
                </div>
              )}
              {fieldErrors.password && (
                <p className="text-caption text-error-base mt-0.5">{fieldErrors.password}</p>
              )}
            </div>

            {/* City */}
            <div className="flex flex-col gap-1.5">
              <label className="text-small font-medium text-neutral-700">City</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCityDropdown(!showCityDropdown)}
                  className="w-full bg-neutral-0 border border-surface-input rounded-component py-3 px-4 text-body text-left min-h-[44px] focus:outline-none focus:border-primary-base focus:ring-1 focus:ring-primary-base flex items-center justify-between"
                >
                  <span className={city ? 'text-neutral-900' : 'text-neutral-500'}>{city || 'Select city'}</span>
                  <svg className={`w-4 h-4 text-neutral-500 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {showCityDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowCityDropdown(false)} />
                    <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-neutral-0 border border-surface-border rounded-component shadow-lg overflow-hidden">
                      {CITIES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setCity(c); setShowCityDropdown(false); }}
                          className={`w-full text-left px-4 py-3 text-body transition-colors ${
                            city === c ? 'bg-primary-tint text-primary-base font-medium' : 'text-neutral-700 hover:bg-surface-bg'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Agree to terms */}
            <div className="flex flex-col gap-1">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => { setAgreedToTerms(e.target.checked); clearFieldError('terms'); }}
                  className="mt-1 w-4 h-4 border-surface-input rounded accent-primary-base"
                />
                <label htmlFor="terms" className="text-small text-neutral-700 leading-relaxed">
                  I agree to{' '}
                  <Link href="/terms" className="text-primary-base hover:text-primary-hover underline">SabiPro terms of service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-primary-base hover:text-primary-hover underline">privacy policy</Link>
                </label>
              </div>
              {fieldErrors.terms && (
                <p className="text-caption text-error-base ml-7">{fieldErrors.terms}</p>
              )}
            </div>

            {/* Create account button */}
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={!agreedToTerms}
              className="w-full !bg-primary-base hover:!bg-primary-deep !text-neutral-0 !rounded-[14px] disabled:!bg-surface-disabled disabled:!cursor-not-allowed"
            >
              Create account
            </Button>
          </form>

          <div className="mt-6 text-center text-small text-neutral-500">
            <p>
              Already have an account?{' '}
              <Link href="/login" className="text-primary-base hover:text-primary-hover font-medium">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
