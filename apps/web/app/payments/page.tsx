'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const txRef = searchParams.get('tx_ref');
    const transactionId = searchParams.get('transaction_id');
    const flwStatus = searchParams.get('status');

    if (flwStatus === 'successful' || flwStatus === 'completed') {
      setStatus('success');
      setMessage('Payment successful! Your booking is confirmed.');
    } else if (flwStatus === 'failed' || flwStatus === 'cancelled') {
      setStatus('failed');
      setMessage('Payment was not completed. Please try again.');
    } else {
      setStatus('failed');
      setMessage('Payment could not be verified. Please check your bookings.');
    }
  }, [searchParams]);

  return (
    <div className="max-w-md mx-auto px-4 md:px-6 py-12 text-center">
      <div className="bg-neutral-0 border border-surface-border rounded-card p-8 shadow-sm">
        {status === 'processing' && (
          <div className="animate-spin w-12 h-12 border-4 border-primary-base border-t-transparent rounded-full mx-auto mb-4" />
        )}
        {status === 'success' && (
          <div className="w-16 h-16 bg-success-bg text-success-base rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {status === 'failed' && (
          <div className="w-16 h-16 bg-error-bg text-error-base rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
        <h2 className="text-subhead font-medium text-neutral-900 mb-2">
          {status === 'processing' ? 'Processing...' : status === 'success' ? 'Payment Complete' : 'Payment Failed'}
        </h2>
        <p className="text-small text-neutral-500 mb-6">{message}</p>
        <Link
          href={status === 'success' ? '/bookings' : '/dashboard'}
          className="inline-block bg-primary-base hover:bg-primary-deep text-white px-6 py-2.5 rounded-component font-medium transition-colors"
        >
          {status === 'success' ? 'View My Bookings' : 'Browse Services'}
        </Link>
      </div>
    </div>
  );
}

export default function PaymentRedirectPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto px-4 md:px-6 py-12 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary-base border-t-transparent rounded-full mx-auto" />
      </div>
    }>
      <PaymentStatusContent />
    </Suspense>
  );
}
