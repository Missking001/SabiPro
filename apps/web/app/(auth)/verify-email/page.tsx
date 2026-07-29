'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const verifiedRef = useRef(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken && !verifiedRef.current) {
      setToken(urlToken);
      handleVerify(urlToken);
    }
  }, []);

  async function handleVerify(tokenToVerify: string) {
    if (isVerifying || verifiedRef.current) return;
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
        verifiedRef.current = true;
        setMessage('Email verified successfully! Redirecting to login...');
        setIsError(false);
        setTimeout(() => {
          router.push('/login?verified=true');
        }, 2000);
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

  return (
    <div className="bg-neutral-0 border border-surface-border rounded-card p-6 md:p-8 text-center">
      {!verifiedRef.current && !message && (
        <>
          <h1 className="text-heading text-neutral-900 mb-1">Verify your email</h1>
          <p className="text-small text-neutral-500 mb-6">Verifying your account...</p>
          {isVerifying && (
            <div className="flex justify-center">
              <div className="w-8 h-8 border-2 border-primary-base border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </>
      )}
      {message && (
        <>
          {!isError && (
            <div className="w-14 h-14 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-success-base" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          )}
          <p className={`text-body mb-4 ${isError ? 'text-error-base' : 'text-neutral-900'}`}>{message}</p>
          {!isError && (
            <p className="text-caption text-neutral-500">You will be redirected to the login page shortly.</p>
          )}
        </>
      )}
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
