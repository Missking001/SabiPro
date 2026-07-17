'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, StatusBanner } from '@/components/ui';
import { api, ApiClientError } from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');
  const [isReset, setIsReset] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback('');

    if (password !== confirmPassword) {
      setFeedbackType('error');
      setFeedback('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setFeedbackType('error');
      setFeedback('Password must be at least 8 characters');
      return;
    }

    if (!token) {
      setFeedbackType('error');
      setFeedback('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.auth.resetPassword(token, password);
      setFeedbackType('success');
      setFeedback(res.data?.message || 'Your password has been reset. You can now sign in with your new password.');
      setIsReset(true);
    } catch (err) {
      setFeedbackType('error');
      if (err instanceof ApiClientError) {
        setFeedback(err.message);
      } else {
        setFeedback('Something went wrong. Please try again later');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-neutral-0 border border-surface-border rounded-card p-6 md:p-8">
      <h1 className="text-heading text-neutral-900 text-center mb-1">Reset your password</h1>
      <p className="text-small text-neutral-500 text-center mb-6">
        Enter your new password below.
      </p>

      {feedback && (
        <StatusBanner variant={feedbackType} className="mb-4">
          {feedback}
        </StatusBanner>
      )}

      {isReset ? (
        <div className="text-center">
          <Link
            href="/login"
            className="inline-block bg-primary-base hover:bg-primary-deep text-white font-medium rounded-component min-h-[44px] px-5 py-3 transition-colors duration-150"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New password"
            type="password"
            id="reset-password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            id="reset-confirm-password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button type="submit" isLoading={isLoading} className="w-full">
            Reset password
          </Button>
        </form>
      )}

      <div className="mt-6 text-center text-small text-neutral-500">
        <p>
          <Link href="/login" className="text-primary-base hover:text-primary-hover font-medium">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="bg-neutral-0 border border-surface-border rounded-card p-6 md:p-8 text-center text-neutral-500">
            Loading reset password page...
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
