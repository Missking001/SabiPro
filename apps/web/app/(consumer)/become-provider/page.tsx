'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const STEPS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    title: 'Create your profile',
    description: 'Tell us about your trade, experience, and location. Add a bio that showcases your expertise.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    ),
    title: 'Upload your portfolio',
    description: 'Show off your best work. Upload up to 6 photos of completed projects to build trust with customers.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    title: 'Get verified',
    description: 'Our team reviews your profile and credentials. Verified providers get a trust badge and more visibility.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Start earning',
    description: 'Receive inquiries from customers in your area. Payments are secured via escrow for your protection.',
  },
];

const BENEFITS = [
  { stat: '10,000+', label: 'Active consumers searching' },
  { stat: '₦0', label: 'To create your profile' },
  { stat: '24hrs', label: 'Average first inquiry time' },
  { stat: '100%', label: 'Secure escrow payments' },
];

const TRADE_CATEGORIES = [
  'Plumber', 'Electrician', 'Tailor', 'Carpenter', 'Mechanic', 'Cleaner',
  'Painter', 'Barber', 'Hairdresser', 'Generator Repairer', 'Bricklayer',
  'Tiler', 'Welder', 'AC Technician', 'Photographer', 'Caterer',
];

export default function BecomeProviderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedTrade, setSelectedTrade] = useState('');

  return (
    <div className="min-h-screen bg-surface-bg pb-24">
      {/* Hero section */}
      <div className="bg-primary-base text-neutral-0">
        <div className="max-w-2xl mx-auto px-4 md:px-6 pt-6 pb-12">
          <div className="flex items-center gap-3 mb-8">
            <Link
              href="/dashboard"
              className="w-10 h-10 rounded-full bg-neutral-0/15 hover:bg-neutral-0/25 text-neutral-0 flex items-center justify-center transition-colors"
              aria-label="Back to dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
          </div>

          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-secondary-base/20 text-secondary-hover text-caption font-medium rounded-pill mb-4">
              Join 2,500+ providers
            </span>
            <h1 className="text-display text-neutral-0 mb-3">
              Turn your skills into income
            </h1>
            <p className="text-body text-neutral-0/70 max-w-md mx-auto">
              Thousands of Nigerians are searching for skilled tradespeople on SabiPro. List your service and start getting paid.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 -mt-6 relative z-10">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {BENEFITS.map((b, i) => (
            <div key={i} className="bg-neutral-0 border border-surface-border rounded-card p-4 text-center">
              <p className="text-heading text-primary-base font-medium">{b.stat}</p>
              <p className="text-caption text-neutral-500 mt-0.5">{b.label}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-neutral-0 border border-surface-border rounded-card p-5 md:p-6 mb-6">
          <h2 className="text-subhead font-medium text-neutral-900 mb-6">How it works</h2>
          <div className="space-y-6">
            {STEPS.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full bg-primary-tint text-primary-base flex items-center justify-center flex-shrink-0">
                    {step.icon}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-px h-full bg-surface-border mt-2 min-h-[16px]" />
                  )}
                </div>
                <div className="pb-2">
                  <p className="text-small font-medium text-neutral-900">{step.title}</p>
                  <p className="text-caption text-neutral-500 mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trade selection */}
        <div className="bg-neutral-0 border border-surface-border rounded-card p-5 md:p-6 mb-6">
          <h2 className="text-subhead font-medium text-neutral-900 mb-2">What is your trade?</h2>
          <p className="text-small text-neutral-500 mb-5">Select a category that best describes your service.</p>
          <div className="flex flex-wrap gap-2">
            {TRADE_CATEGORIES.map((trade) => (
              <button
                key={trade}
                onClick={() => setSelectedTrade(trade)}
                className={`px-3.5 py-2 rounded-pill text-small border transition-all ${
                  selectedTrade === trade
                    ? 'bg-primary-base text-white border-primary-base shadow-sm'
                    : 'bg-neutral-0 text-neutral-700 border-surface-border hover:border-neutral-300 hover:bg-surface-bg'
                }`}
              >
                {trade}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary-tint border border-primary-base/20 rounded-card p-5 md:p-6 text-center">
          <h3 className="text-subhead font-medium text-neutral-900 mb-2">Ready to get started?</h3>
          <p className="text-small text-neutral-500 mb-5">Create your provider profile today — it only takes 5 minutes.</p>
          <button
            onClick={() => router.push('/register?role=provider')}
            className="w-full h-12 bg-primary-base hover:bg-primary-deep text-white text-body font-medium rounded-component transition-colors shadow-sm"
          >
            Register as a provider
          </button>
          <p className="text-caption text-neutral-500 mt-3">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-base hover:text-primary-hover underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
