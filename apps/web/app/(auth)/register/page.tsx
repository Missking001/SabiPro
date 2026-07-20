'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button, StatusBanner } from '@/components/ui';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const CITIES = ['Lagos', 'Abuja'];

interface FieldErrors {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  terms?: string;
}

function validateName(name: string): string | undefined {
  if (!name.trim()) return 'Full name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  return undefined;
}

function validatePhone(phone: string): string | undefined {
  if (!phone.trim()) return 'Phone number is required';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return 'Please enter a valid phone number';
  return undefined;
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {
      name: validateName(name),
      phone: validatePhone(phone),
      email: validateEmail(email),
      terms: agreedToTerms ? undefined : 'Please agree to the terms of service and privacy policy',
    };
    setFieldErrors(errors);
    return !errors.name && !errors.phone && !errors.email && !errors.terms;
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
      const password = 'TempPass123!';
      await api.auth.register({ name: name.trim(), email: email.trim(), password, role, phone: phone.trim(), city });

      const loginResult = await login(email.trim(), password);
      if (loginResult?.ok) {
        router.push('/dashboard');
        router.refresh();
        return;
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
              <input
                type="tel"
                placeholder="+234 XXX XXX XXXX"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); clearFieldError('phone'); }}
                required
                className={`w-full bg-neutral-0 border rounded-component py-3 px-4 text-body text-neutral-900 placeholder:text-neutral-500 min-h-[44px] focus:outline-none focus:ring-1 ${
                  fieldErrors.phone ? 'border-error-base focus:border-error-base focus:ring-error-base' : 'border-surface-input focus:border-primary-base focus:ring-primary-base'
                }`}
              />
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
              className="w-full !bg-primary-base hover:!bg-primary-deep !text-neutral-0 !rounded-[14px]"
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