'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input, StatusBanner } from '@/components/ui';
import { api, ApiClientError } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setFeedback('');

    try {
      const res = await api.auth.forgotPassword(email);
      setFeedbackType('success');
      setFeedback(res.data?.message || 'If an account with that email exists, a password reset link has been sent.');
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
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-neutral-0 border border-surface-border rounded-card p-6 md:p-8">
          <h1 className="text-heading text-neutral-900 text-center mb-1">Forgot password</h1>
          <p className="text-small text-neutral-500 text-center mb-6">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          {feedback && (
            <StatusBanner variant={feedbackType} className="mb-4">
              {feedback}
            </StatusBanner>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              id="forgot-email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" isLoading={isLoading} className="w-full">
              Send reset link
            </Button>
          </form>

          <div className="mt-6 text-center text-small text-neutral-500">
            <p>
              Remembered your password?{' '}
              <Link href="/login" className="text-primary-base hover:text-primary-hover font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
