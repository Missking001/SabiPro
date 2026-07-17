'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input, StatusBanner } from '@/components/ui';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface ProviderActionsProps {
  providerId: string;
  providerName?: string;
}

export function ProviderActions({ providerId, providerName }: ProviderActionsProps) {
  const { isAuthenticated, isConsumer, isLoading: authLoading } = useAuth();

  if (authLoading) return null;

  // Show sign-in CTA for unauthenticated or non-consumer users
  if (!isAuthenticated || !isConsumer) {
    return (
      <div className="bg-neutral-0 border border-surface-border rounded-card p-6 md:p-8 mb-6 text-center">
        <p className="text-display mb-2">💬</p>
        <h2 className="text-subhead text-neutral-900 mb-1">
          Want to contact {providerName || 'this provider'}?
        </h2>
        <p className="text-small text-neutral-500 mb-4">
          Sign in to send an inquiry or leave a review.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-block bg-primary-base hover:bg-primary-deep text-white font-medium rounded-component min-h-[44px] px-5 py-3 text-center transition-colors duration-150"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-block border border-primary-base text-primary-base hover:bg-primary-tint font-medium rounded-component min-h-[44px] px-5 py-3 text-center transition-colors duration-150"
          >
            Create an account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-6">
      <InquiryForm providerId={providerId} providerName={providerName} />
      <ReviewForm providerId={providerId} />
    </div>
  );
}

function InquiryForm({ providerId, providerName }: { providerId: string; providerName?: string }) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');
  const [showBookPayModal, setShowBookPayModal] = useState(false);
  const [bookingAmount, setBookingAmount] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [bookingError, setBookingError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus('loading');
    setFeedback('');

    try {
      await api.inquiries.create({ providerId, message });
      setStatus('success');
      setFeedback('Your inquiry has been sent');
      setMessage('');
    } catch (err) {
      setStatus('error');
      if (err instanceof ApiClientError) {
        setFeedback(err.message);
      } else {
        setFeedback('Message failed to send. Please try again');
      }
    }
  }

  async function handleBookAndPay(e: React.FormEvent) {
    e.preventDefault();
    const amountVal = parseFloat(bookingAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setBookingError('Please enter a valid amount');
      return;
    }

    setBookingStatus('loading');
    setBookingError('');

    try {
      // Stored in kobo (integer)
      const amountInKobo = Math.round(amountVal * 100);
      const res = await api.payments.initiate({
        providerId,
        amount: amountInKobo,
      });

      if (res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        throw new Error('No payment URL returned');
      }
    } catch (err) {
      setBookingStatus('error');
      if (err instanceof ApiClientError) {
        setBookingError(err.message);
      } else {
        setBookingError('Payment failed to initiate. Please try again');
      }
    }
  }

  return (
    <div className="bg-neutral-0 border border-surface-border rounded-card p-6 md:p-8">
      <h2 className="text-subhead text-neutral-900 mb-1">
        Send an inquiry{providerName ? ` to ${providerName}` : ''}
      </h2>
      <p className="text-small text-neutral-500 mb-4">
        Describe what you need help with and the provider will get back to you.
      </p>

      {feedback && (
        <StatusBanner variant={status === 'success' ? 'success' : 'error'} className="mb-4">
          {feedback}
        </StatusBanner>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="inquiry-message" className="text-small font-medium text-neutral-700">
            Your message
          </label>
          <textarea
            id="inquiry-message"
            className="w-full bg-neutral-0 border border-surface-input rounded-component px-4 py-3 text-body text-neutral-900 placeholder:text-neutral-500 min-h-[100px] focus:outline-none focus:border-primary-base focus:ring-1 focus:ring-primary-base"
            placeholder="e.g. I need a plumber for a kitchen sink repair in Surulere..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" isLoading={status === 'loading'} variant="secondary">
            <span className="flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Send inquiry
            </span>
          </Button>
          <Button
            type="button"
            onClick={() => setShowBookPayModal(true)}
            variant="primary"
            className="hover:!bg-primary-deep"
            id="provider-book-pay-btn"
          >
            <span className="flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Book & Pay
            </span>
          </Button>
        </div>
      </form>

      {/* Book and Pay Modal */}
      {showBookPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setShowBookPayModal(false)} />
          
          {/* Modal Content */}
          <div className="bg-neutral-0 rounded-card max-w-sm w-full p-6 relative z-10 shadow-2xl border border-surface-border">
            <button 
              onClick={() => setShowBookPayModal(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-900"
              aria-label="Close booking modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <form onSubmit={handleBookAndPay} className="mt-2 space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-secondary-tint text-secondary-deep rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-subhead font-medium text-neutral-900">
                  Book {providerName || 'Provider'}
                </h3>
                <p className="text-caption text-neutral-500 max-w-[240px] mx-auto mt-1">
                  Payments are securely held in escrow until you verify the job is done.
                </p>
              </div>

              {bookingError && (
                <StatusBanner variant="error" className="mb-2">
                  {bookingError}
                </StatusBanner>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="booking-amount" className="text-small font-medium text-neutral-700">
                  Amount to Pay (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">₦</span>
                  <input
                    id="booking-amount"
                    type="number"
                    min="100"
                    step="any"
                    required
                    placeholder="Enter amount (e.g. 5000)"
                    value={bookingAmount}
                    onChange={(e) => setBookingAmount(e.target.value)}
                    className="w-full h-11 pl-8 pr-4 bg-neutral-0 border border-surface-input rounded-component text-body text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-primary-base focus:ring-1 focus:ring-primary-base"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  type="submit" 
                  isLoading={bookingStatus === 'loading'}
                  className="w-full !bg-primary-deep text-white"
                >
                  Proceed to Payment
                </Button>
                <button
                  type="button"
                  onClick={() => setShowBookPayModal(false)}
                  className="w-full h-11 bg-surface-bg hover:bg-surface-bg/80 text-neutral-700 font-medium text-small rounded-component transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewForm({ providerId }: { providerId: string }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setFeedback('Please select a star rating');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setFeedback('');

    try {
      await api.reviews.create({ providerId, rating, comment: comment || undefined });
      setStatus('success');
      setFeedback('Your review has been submitted');
      setComment('');
      setRating(0);
    } catch (err) {
      setStatus('error');
      if (err instanceof ApiClientError) {
        setFeedback(err.message);
      } else {
        setFeedback('Failed to submit review. Please try again');
      }
    }
  }

  return (
    <div className="bg-neutral-0 border border-surface-border rounded-card p-6 md:p-8">
      <h2 className="text-subhead text-neutral-900 mb-4">Leave a review</h2>

      {feedback && (
        <StatusBanner variant={status === 'success' ? 'success' : 'error'} className="mb-4">
          {feedback}
        </StatusBanner>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star rating selector */}
        <div>
          <label className="text-small font-medium text-neutral-700 mb-2 block">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-2xl transition-colors"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                <span className={star <= (hoverRating || rating) ? 'text-secondary-base' : 'text-surface-disabled'}>
                  ★
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="review-comment" className="text-small font-medium text-neutral-700">
            Comment (optional)
          </label>
          <textarea
            id="review-comment"
            className="w-full bg-neutral-0 border border-surface-input rounded-component px-4 py-3 text-body text-neutral-900 placeholder:text-neutral-500 min-h-[80px] focus:outline-none focus:border-primary-base focus:ring-1 focus:ring-primary-base"
            placeholder="Tell others about your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <Button type="submit" isLoading={status === 'loading'}>
          Submit review
        </Button>
      </form>
    </div>
  );
}
