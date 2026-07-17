'use client';

import { useState, useEffect } from 'react';
import { Button, Input, StatusBanner, Card, Skeleton } from '@/components/ui';
import { api, ApiClientError } from '@/lib/api';

export default function ProviderProfilePage() {
  const [bio, setBio] = useState('');
  const [tradeCategory, setTradeCategory] = useState('');
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [providerId, setProviderId] = useState('');

  // Pre-populate form with existing profile data
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.providers.me();
        const profile = res.data;
        if (profile) {
          setProviderId(profile.id);
          setBio(profile.bio || '');
          setTradeCategory(profile.tradeCategory);
          setLocation(profile.location);
          setPriceRange(profile.priceRange || '');
        }
      } catch {
        // No existing profile — form starts empty (create mode)
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

    try {
      if (providerId) {
        await api.providers.update(providerId, { bio, tradeCategory, location, priceRange });
        setSuccess('Profile updated');
      } else {
        const res = await api.providers.create({ bio, tradeCategory, location, priceRange });
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

  if (isFetching) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <h1 className="text-heading text-neutral-900 mb-6">Provider profile</h1>
        <Card>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <h1 className="text-heading text-neutral-900 mb-1">
        {providerId ? 'Edit your profile' : 'Create your provider profile'}
      </h1>
      <p className="text-small text-neutral-500 mb-6">
        {providerId
          ? 'Update your details so customers can find you'
          : 'Fill in your details to start receiving inquiries'}
      </p>

      {error && <StatusBanner variant="error" className="mb-4">{error}</StatusBanner>}
      {success && <StatusBanner variant="success" className="mb-4">{success}</StatusBanner>}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Trade category"
            id="provider-trade"
            placeholder="e.g. Plumber, Electrician, Mechanic"
            value={tradeCategory}
            onChange={(e) => setTradeCategory(e.target.value)}
            required
          />
          <Input
            label="Location"
            id="provider-location"
            placeholder="e.g. Surulere, Lagos"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
          <Input
            label="Price range"
            id="provider-price"
            placeholder="e.g. ₦5,000 - ₦20,000"
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="provider-bio" className="text-small font-medium text-neutral-700">
              Bio
            </label>
            <textarea
              id="provider-bio"
              className="w-full bg-neutral-0 border border-surface-input rounded-component px-4 py-3 text-body text-neutral-900 placeholder:text-neutral-500 min-h-[100px] focus:outline-none focus:border-primary-base focus:ring-1 focus:ring-primary-base"
              placeholder="Tell customers about your services and experience"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <Button type="submit" isLoading={isLoading} className="w-full">
            {providerId ? 'Save changes' : 'Create profile'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
