'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Input, StatusBanner, Skeleton } from '@/components/ui';
import { api, ApiClientError } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import type { MyProviderProfile } from '@/types';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE = 1 * 1024 * 1024;
const MAX_PORTFOLIO_SIZE = 2 * 1024 * 1024;
const MAX_PORTFOLIO_COUNT = 6;

export default function ProviderProfilePage() {
  const [provider, setProvider] = useState<MyProviderProfile | null>(null);
  const [bio, setBio] = useState('');
  const [tradeCategory, setTradeCategory] = useState('');
  const [location, setLocation] = useState('');
  const [priceRangeMin, setPriceRangeMin] = useState('');
  const [priceRangeMax, setPriceRangeMax] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [providerId, setProviderId] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.providers.me();
        const profile = res.data;
        if (profile) {
          setProvider(profile);
          setProviderId(profile.id);
          setBio(profile.bio || '');
          setTradeCategory(profile.tradeCategory || '');
          setLocation(profile.location || '');
          setIsAvailable(profile.isAvailable ?? true);
          setPortfolioUrls(profile.portfolioUrls || []);
          if (profile.priceRangeMin != null) setPriceRangeMin(String(profile.priceRangeMin / 100));
          if (profile.priceRangeMax != null) setPriceRangeMax(String(profile.priceRangeMax / 100));
        }
      } catch {
      } finally {
        setIsFetching(false);
      }
    }
    loadProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const minKobo = priceRangeMin ? Math.round(parseFloat(priceRangeMin) * 100) : undefined;
    const maxKobo = priceRangeMax ? Math.round(parseFloat(priceRangeMax) * 100) : undefined;

    try {
      if (providerId) {
        const updatedRes = await api.providers.update(providerId, {
          bio,
          tradeCategory,
          location,
          priceRangeMin: minKobo,
          priceRangeMax: maxKobo,
          isAvailable,
          portfolioUrls,
        });
        if (updatedRes.data) setProvider(updatedRes.data);
        setSuccess('Profile updated successfully');
      } else {
        const res = await api.providers.create({
          bio,
          tradeCategory,
          location,
          priceRangeMin: minKobo,
          priceRangeMax: maxKobo,
          portfolioUrls,
        });
        setProviderId(res.data?.id || '');
        setSuccess('Profile created successfully');
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Failed to save profile');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function validateFile(file: File, maxSize: number, label: string): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${label} must be JPG, PNG, or WebP`;
    }
    if (file.size > maxSize) {
      const mb = maxSize / (1024 * 1024);
      return `${label} must be under ${mb}MB`;
    }
    return null;
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file, MAX_AVATAR_SIZE, 'Avatar');
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploadingAvatar(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.uploads.avatar(file);
      const avatarUrl = res.data?.url;
      if (avatarUrl) {
        setProvider((prev) => prev ? { ...prev, user: { ...prev.user, avatarUrl } } : prev);
      }
      setSuccess('Profile photo updated');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Failed to upload photo');
      }
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }

  async function handlePortfolioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = MAX_PORTFOLIO_COUNT - portfolioUrls.length;
    if (files.length > remaining) {
      setError(`You can add at most ${remaining} more photo${remaining === 1 ? '' : 's'}`);
      return;
    }

    for (const file of Array.from(files)) {
      const validationError = validateFile(file, MAX_PORTFOLIO_SIZE, 'Portfolio photo');
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setUploadingPortfolio(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.uploads.portfolio(Array.from(files));
      const newUrls = res.data?.urls || [];
      setPortfolioUrls((prev) => [...prev, ...newUrls]);
      setSuccess(`${newUrls.length} photo${newUrls.length === 1 ? '' : 's'} added`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Failed to upload photos');
      }
    } finally {
      setUploadingPortfolio(false);
      if (portfolioInputRef.current) portfolioInputRef.current.value = '';
    }
  }

  function removePortfolio(index: number) {
    setPortfolioUrls((prev) => prev.filter((_, i) => i !== index));
  }

  if (isFetching) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] py-8 px-4 md:px-6">
        <div className="max-w-xl mx-auto space-y-4">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-28 w-full rounded-card" />
          <Skeleton className="h-36 w-full rounded-card" />
          <Skeleton className="h-24 w-full rounded-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] py-6 px-4 md:px-6 pb-24">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-2">
          <Link
            href="/provider/dashboard"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-neutral-900 hover:text-primary-base transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Edit Profile
          </Link>
        </div>

        {error && <StatusBanner variant="error">{error}</StatusBanner>}
        {success && <StatusBanner variant="success">{success}</StatusBanner>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Photo Card */}
          <div className="bg-white rounded-card border border-surface-border p-4 shadow-xs">
            <h2 className="text-small font-semibold text-neutral-900 mb-3">Profile photo</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-neutral-800 text-white flex items-center justify-center font-bold text-lg overflow-hidden relative border border-surface-border flex-shrink-0">
                {provider?.user?.avatarUrl ? (
                  <Image
                    src={provider.user.avatarUrl}
                    alt={provider.user.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  getInitials(provider?.user?.name || 'Provider')
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-surface-border text-neutral-700 text-small font-medium rounded-component hover:bg-neutral-50 transition-colors shadow-2xs disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <span className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                )}
                {uploadingAvatar ? 'Uploading...' : 'Change photo'}
              </button>
            </div>
          </div>

          {/* Trade Category & Location Card */}
          <div className="bg-white rounded-card border border-surface-border p-4 shadow-xs space-y-3">
            <Input
              label="Trade category"
              placeholder="e.g. Electrician, Plumber, Tailor"
              value={tradeCategory}
              onChange={(e) => setTradeCategory(e.target.value)}
              required
            />
            <Input
              label="Location"
              placeholder="e.g. Ikeja, Lagos"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          {/* Bio Card */}
          <div className="bg-white rounded-card border border-surface-border p-4 shadow-xs">
            <label htmlFor="bio-input" className="block text-small font-semibold text-neutral-900 mb-2">
              Bio
            </label>
            <textarea
              id="bio-input"
              rows={4}
              maxLength={500}
              placeholder="Tell customers about your skills, certifications, and work experience..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-white border border-surface-input rounded-component p-3 text-small text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-base focus:ring-1 focus:ring-primary-base leading-relaxed"
            />
            <div className="text-right mt-1">
              <span className="text-caption text-neutral-400">{bio.length}/500 characters</span>
            </div>
          </div>

          {/* Price Range Card */}
          <div className="bg-white rounded-card border border-surface-border p-4 shadow-xs">
            <h2 className="text-small font-semibold text-neutral-900 mb-2">Price range</h2>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Min. price (₦)"
                type="number"
                placeholder="5,000"
                value={priceRangeMin}
                onChange={(e) => setPriceRangeMin(e.target.value)}
              />
              <Input
                label="Max. price (₦)"
                type="number"
                placeholder="25,000"
                value={priceRangeMax}
                onChange={(e) => setPriceRangeMax(e.target.value)}
              />
            </div>
          </div>

          {/* Available for work Toggle Card */}
          <div className="bg-white rounded-card border border-surface-border p-4 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-small font-semibold text-neutral-900">Available for work</h2>
              <p className="text-caption text-neutral-400 mt-0.5">
                Shown as green indicator on your profile
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none ${
                isAvailable ? 'bg-[#1A6B3C]' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`w-5 h-5 bg-white rounded-full shadow-xs block transition-transform ${
                  isAvailable ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Portfolio Photos Card */}
          <div className="bg-white rounded-card border border-surface-border p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-small font-semibold text-neutral-900">Portfolio photos</h2>
              <span className="text-caption text-neutral-400 font-medium">
                {portfolioUrls.length}/{MAX_PORTFOLIO_COUNT} photos
              </span>
            </div>

            <input
              ref={portfolioInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handlePortfolioChange}
            />

            <div className="grid grid-cols-3 gap-3">
              {portfolioUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-component overflow-hidden group border border-surface-border">
                  <Image
                    src={url}
                    alt={`Portfolio ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePortfolio(idx)}
                    className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <span className="text-white text-xs bg-black/60 px-2 py-1 rounded font-semibold">Remove</span>
                  </button>
                </div>
              ))}

              {portfolioUrls.length < MAX_PORTFOLIO_COUNT && (
                <button
                  type="button"
                  disabled={uploadingPortfolio}
                  onClick={() => portfolioInputRef.current?.click()}
                  className="aspect-square rounded-component border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-400 hover:border-primary-base hover:text-primary-base transition-colors bg-neutral-50/50 disabled:opacity-50"
                >
                  {uploadingPortfolio ? (
                    <span className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="text-xl font-light">+</span>
                      <span className="text-caption font-medium mt-0.5">Add photo</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Vetting Status Card */}
          <div className="bg-[#FFFDF7] border border-amber-200 rounded-card p-4 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-800">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0110.43-3.296A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
              <h3 className="text-small font-semibold text-amber-900">Vetting Status</h3>
            </div>
            <p className="text-caption text-amber-900/80 leading-relaxed">
              {provider?.isVerified
                ? 'You currently hold an ID + Credential badge, issued by the SabiPro ops team.'
                : 'Your profile is active. Submit credentials to the admin team to get the Verified badge.'}
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                {provider?.isVerified ? 'ID + Credential' : 'Registered Provider'}
              </span>
            </div>
          </div>

          {/* Save Changes Button */}
          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full bg-[#1A6B3C] hover:bg-[#155630] text-white py-3.5 text-body font-semibold rounded-component shadow-sm transition-colors"
          >
            Save changes
          </Button>
        </form>
      </div>
    </div>
  );
}
