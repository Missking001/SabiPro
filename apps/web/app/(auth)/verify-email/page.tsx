'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Input, StatusBanner } from '@/components/ui';
import Link from 'next/link';

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken && !message) {
      setToken(urlToken);
      handleVerify(urlToken);
    }
  }, []);

  async function handleVerify(tokenToVerify: string) {
    if (isVerifying) return;
    setIsVerifying(true);
    setMessage('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToVerify }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.data?.message || 'Email verified successfully. You can now log in.');
        setIsError(false);
      } else {
        setMessage(data.error?.message || 'Verification failed');
        setIsError(true);
      }
    } catch {
      setMessage('Something went wrong. Please try again later');
      setIsError(true);
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleVerify(token);
  }

  return (
    <div className="bg-neutral-0 border border-surface-border rounded-card p-6 md:p-8">
      <h1 className="text-heading text-neutral-900 text-center mb-1">Verify your email</h1>
      <p className="text-small text-neutral-500 text-center mb-6">
        Enter the verification token sent to your email
      </p>

      {message && (
        <StatusBanner variant={isError ? 'error' : 'success'} className="mb-4">
          {message}
        </StatusBanner>
      )}

      {isVerifying && !message && (
        <div className="text-center text-neutral-500 mb-4">Verifying your email...</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Verification token"
          placeholder="Paste your verification token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={isVerifying}>
          {isVerifying ? 'Verifying...' : 'Verify email'}
        </Button>
      </form>

      <div className="mt-6 text-center text-small text-neutral-500">
        <Link href="/login" className="text-primary-base hover:text-primary-hover font-medium">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="bg-neutral-0 border border-surface-border rounded-card p-6 md:p-8 text-center text-neutral-500">
            Loading verification page...
          </div>
        }>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}
