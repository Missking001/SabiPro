'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StatusBanner } from '@/components/ui';

const FAQ_ITEMS = [
  {
    q: 'How do I find a service provider?',
    a: 'Use the search bar on your dashboard or browse service categories to find providers near you. You can filter by trade, location, and ratings.',
  },
  {
    q: 'How does payment work on SabiPro?',
    a: 'When you book a provider, your payment is held securely in escrow. The provider only receives payment after you confirm the job is complete. If there\'s an issue, you can raise a dispute.',
  },
  {
    q: 'What does "In escrow" mean?',
    a: 'Escrow means your money is held safely by SabiPro. The provider cannot access it until you confirm the work is done to your satisfaction. This protects both parties.',
  },
  {
    q: 'How do I raise a dispute?',
    a: 'Go to your Bookings page, find the active booking, and tap "Raise dispute". Our team will review the case within 48 hours and reach out to both parties.',
  },
  {
    q: 'Can I become a provider?',
    a: 'Yes! If you have a trade skill, you can register as a provider. Go to your profile menu and tap "Become a Provider" to get started with the onboarding process.',
  },
  {
    q: 'How are providers verified?',
    a: 'Providers go through an onboarding process. Once they complete their profile, they become active. Our admin team can then verify their identity and credentials, granting them a "Verified" badge.',
  },
  {
    q: 'What if a provider doesn\'t show up?',
    a: 'If you\'ve paid and the provider fails to deliver, raise a dispute from your Bookings page. Your funds remain in escrow and our team will investigate.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Please contact our support team at support@sabipro.com with your registered email address. Account deletions are processed within 48 hours.',
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function toggleFaq(i: number) {
    setOpenIndex(openIndex === i ? null : i);
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    // Simulate sending
    await new Promise((res) => setTimeout(res, 1000));
    setSending(false);
    setSent(true);
    setContactName('');
    setContactEmail('');
    setContactMessage('');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-full bg-neutral-0 border border-surface-border text-neutral-700 flex items-center justify-center transition-all hover:bg-surface-bg active:scale-95 shadow-sm"
          aria-label="Back to dashboard"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-heading text-neutral-900 font-medium">Help & Support</h1>
      </div>

      {/* Quick help cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <a href="mailto:support@sabipro.com" className="bg-neutral-0 border border-surface-border rounded-card p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-neutral-300 transition-all text-center">
          <div className="w-10 h-10 bg-primary-tint text-primary-base rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <span className="text-small font-medium text-neutral-900">Email us</span>
          <span className="text-caption text-neutral-500">support@sabipro.com</span>
        </a>
        <a href="tel:+2348000000000" className="bg-neutral-0 border border-surface-border rounded-card p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-neutral-300 transition-all text-center">
          <div className="w-10 h-10 bg-secondary-tint text-secondary-base rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </div>
          <span className="text-small font-medium text-neutral-900">Call us</span>
          <span className="text-caption text-neutral-500">Mon–Fri, 9am–5pm</span>
        </a>
      </div>

      {/* FAQ Section */}
      <div className="mb-8">
        <h2 className="text-subhead font-medium text-neutral-900 mb-4">Frequently asked questions</h2>
        <div className="bg-neutral-0 border border-surface-border rounded-card overflow-hidden">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border-b border-surface-border last:border-0">
              <button
                onClick={() => toggleFaq(i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-bg/50 transition-colors"
              >
                <span className="text-small font-medium text-neutral-900 pr-4">{item.q}</span>
                <svg
                  className={`w-5 h-5 text-neutral-500 flex-shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-4 pb-4 text-small text-neutral-700 leading-relaxed animate-[fadeIn_0.15s_ease-in]">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact form */}
      <div className="bg-neutral-0 border border-surface-border rounded-card p-5 md:p-6">
        <h2 className="text-subhead font-medium text-neutral-900 mb-1">Still need help?</h2>
        <p className="text-small text-neutral-500 mb-5">Send us a message and we will get back to you within 24 hours.</p>

        {sent ? (
          <StatusBanner variant="success">
            Your message has been sent. We will get back to you shortly.
          </StatusBanner>
        ) : (
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <label className="block text-caption font-medium text-neutral-700 mb-1.5" htmlFor="help-name">Your name</label>
              <input
                id="help-name"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full border border-surface-input bg-neutral-0 text-neutral-900 rounded-component px-4 py-3 text-small focus:outline-none focus:ring-2 focus:ring-primary-base/30 focus:border-primary-base transition-colors"
                placeholder="Enter your name"
                required
              />
            </div>
            <div>
              <label className="block text-caption font-medium text-neutral-700 mb-1.5" htmlFor="help-email">Email address</label>
              <input
                id="help-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full border border-surface-input bg-neutral-0 text-neutral-900 rounded-component px-4 py-3 text-small focus:outline-none focus:ring-2 focus:ring-primary-base/30 focus:border-primary-base transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-caption font-medium text-neutral-700 mb-1.5" htmlFor="help-message">Message</label>
              <textarea
                id="help-message"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={4}
                className="w-full border border-surface-input bg-neutral-0 text-neutral-900 rounded-component px-4 py-3 text-small focus:outline-none focus:ring-2 focus:ring-primary-base/30 focus:border-primary-base transition-colors resize-none"
                placeholder="Describe your issue or question..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full h-11 bg-primary-base hover:bg-primary-deep text-white text-small font-medium rounded-component transition-colors disabled:opacity-60"
            >
              {sending ? 'Sending...' : 'Send message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
