import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import type { ProviderProfile } from '@/types';
import { ProviderActions } from '@/components/provider/ProviderActions';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getProvider(slug: string): Promise<ProviderProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/api/providers/${slug}`, { cache: 'no-store' });
    const json = await res.json();
    if (!json.success || !json.data) return null;
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const provider = await getProvider(params.slug);
  if (!provider) return { title: 'Provider not found | SabiPro' };
  const name = provider.user?.name || 'Provider';
  const title = `${name} — ${provider.tradeCategory} in ${provider.location} | SabiPro`;
  return {
    title,
    description: provider.bio?.slice(0, 160) || `${name} is a ${provider.tradeCategory} on SabiPro`,
    openGraph: {
      title,
      description: provider.bio?.slice(0, 160) || `${name} is a ${provider.tradeCategory} on SabiPro`,
      images: provider.portfolioUrls?.[0] ? [provider.portfolioUrls[0]] : [],
      url: `https://sabipro.com/providers/${provider.slug}`,
    },
  };
}

export default async function ProviderProfilePage({ params }: { params: { slug: string } }) {
  const provider = await getProvider(params.slug);
  if (!provider) notFound();

  const starString = (rating: number) => '⭐'.repeat(Math.min(rating, 5));

  return (
    <div className="min-h-screen bg-surface-bg pb-20">
      {/* ─── Green top header section ─── */}
      <div className="bg-primary-base text-neutral-0">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pt-8 pb-10">
          {/* Back button */}
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-full bg-neutral-0/15 hover:bg-neutral-0/25 active:bg-neutral-0/35 text-neutral-0 flex items-center justify-center transition-colors mb-6 shadow-sm"
            aria-label="Back to home"
            id="provider-back-btn"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>

          {/* Provider details */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            {provider.user.avatarUrl ? (
              <div className="w-24 h-24 relative rounded-full overflow-hidden flex-shrink-0 border-2 border-neutral-0/30">
                <Image
                  src={provider.user.avatarUrl}
                  alt={provider.user.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 bg-neutral-0/20 text-neutral-0 rounded-full flex items-center justify-center text-heading font-medium flex-shrink-0 border-2 border-neutral-0/30">
                {provider.user?.name?.charAt(0) || 'P'}
              </div>
            )}

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-heading text-neutral-0 font-medium">{provider.user?.name || 'Provider'}</h1>
                {provider.isVerified && (
                  <span className="inline-flex items-center gap-0.5 bg-secondary-tint text-secondary-deep text-[10px] font-medium px-2 py-0.5 rounded-pill">
                    Verified
                  </span>
                )}
                {provider.isAvailable ? (
                  <span className="inline-flex items-center gap-0.5 bg-[#EAF5EE] text-[#0f6e56] text-[10px] font-medium px-2 py-0.5 rounded-pill">
                    Available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 bg-neutral-200 text-neutral-600 text-[10px] font-medium px-2 py-0.5 rounded-pill">
                    Unavailable
                  </span>
                )}
              </div>
              <p className="text-body text-neutral-0/80 mb-1">{provider.tradeCategory}</p>
              <p className="text-small text-neutral-0/60 mb-3">📍 {provider.location}</p>
              <div className="flex items-center gap-4 text-small text-neutral-0/70">
                <span>⭐ {provider.averageRating.toFixed(1)} ({provider.totalReviews} reviews)</span>
                {provider.priceRangeMin != null && provider.priceRangeMax != null && (
                  <span>💰 ₦{(provider.priceRangeMin / 100).toLocaleString('en-NG')} – ₦{(provider.priceRangeMax / 100).toLocaleString('en-NG')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main content section ─── */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Profile Card (About + Portfolio) */}
        <div className="bg-neutral-0 border border-surface-border rounded-card p-6 md:p-8 mb-6">
          {provider.bio && (
            <div className="mb-6 pb-6 border-b border-surface-border">
              <h2 className="text-subhead text-neutral-900 mb-2 font-medium">About</h2>
              <p className="text-body text-neutral-700 leading-relaxed">{provider.bio}</p>
            </div>
          )}

          <div>
            <h2 className="text-subhead text-neutral-900 mb-3 font-medium">Portfolio</h2>
            {provider.portfolioUrls && provider.portfolioUrls.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {provider.portfolioUrls.map((url, i) => (
                  <div key={i} className="relative h-32 rounded-component overflow-hidden">
                    <Image
                      src={url}
                      alt={`Portfolio ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 border border-dashed border-surface-disabled rounded-component flex flex-col items-center justify-center bg-surface-bg text-neutral-500">
                    <svg className="w-6 h-6 text-neutral-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <span className="text-caption text-neutral-500">No photo uploaded</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Inquiry + Review (auth-aware client component) */}
      <ProviderActions providerId={provider.id} providerName={provider.user?.name} />

      {/* Reviews */}
      {provider.reviews && provider.reviews.length > 0 ? (
        <div className="bg-neutral-0 border border-surface-border rounded-card p-6 md:p-8">
          <h2 className="text-subhead text-neutral-900 mb-4">Reviews ({provider.totalReviews})</h2>
          <div className="space-y-4">
            {provider.reviews.map((review) => (
              <div key={review.id} className="pb-4 border-b border-surface-border last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-primary-tint text-primary-deep rounded-full flex items-center justify-center text-caption font-medium">
                    {review.consumer?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-small font-medium text-neutral-900">
                    {review.consumer?.name || 'Anonymous'}
                  </span>
                  <span className="text-caption text-neutral-500">{starString(review.rating)}</span>
                </div>
                {review.comment && (
                  <p className="text-small text-neutral-700 ml-10">{review.comment}</p>
                )}
                <p className="text-caption text-neutral-500 ml-10 mt-1">
                  {formatRelativeTime(review.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-neutral-0 border border-surface-border rounded-card p-8 text-center">
          <p className="text-display mb-2">⭐</p>
          <p className="text-small text-neutral-500">No reviews yet. Be the first to leave a review.</p>
        </div>
      )}
      </div>
    </div>
  );
}
