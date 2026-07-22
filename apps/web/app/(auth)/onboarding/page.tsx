'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui';

const TRADE_CATEGORIES = [
  'Plumber', 'Electrician', 'Tailor', 'Carpenter', 'Mechanic', 'Cleaner',
  'Painter', 'Barber', 'Hairdresser', 'Generator Repairer', 'Bricklayer',
  'Tiler', 'Welder', 'AC Technician', 'Photographer', 'Caterer',
];

const CONSUMER_INTERESTS = [
  'Home repairs', 'Cleaning', 'Personal care', 'Fashion & tailoring',
  'Automotive', 'Photography', 'Catering & events', 'Electrical work',
];

const CITIES = ['Lagos', 'Abuja'];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(session?.user?.name || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('Lagos');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const role = (session?.user as any)?.role || 'CONSUMER';

  function goToDashboard() {
    if (avatar) {
      localStorage.setItem('sabipro_avatar', avatar);
    }
    router.push('/dashboard');
    router.refresh();
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  function toggleInterest(interest: string) {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  }

  function handleNext() {
    if (step < 3) setStep((s) => s + 1);
  }

  function handleBack() {
    if (step > 1) setStep((s) => s - 1);
  }

  async function handleFinish() {
    goToDashboard();
  }

  const progress = (step / 3) * 100;

  return (
    <div className="relative min-h-screen flex flex-col items-center px-4 py-8 bg-surface-bg">
      <Link href="/" className="mb-8 select-none inline-block">
        <Image
          src="/sabipro_logo_v4.png"
          alt="SabiPro"
          width={150}
          height={40}
          className="w-full h-auto"
          priority
        />
      </Link>

      <div className="w-full max-w-md">
        <div className="bg-neutral-0 border border-surface-border rounded-card p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-base rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-caption text-neutral-500 font-medium tabular-nums">{step}/3</span>
          </div>

          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-small font-medium transition-all ${
                    s < step
                      ? 'bg-primary-base text-neutral-0'
                      : s === step
                        ? 'bg-primary-tint text-primary-base border-2 border-primary-base'
                        : 'bg-surface-bg text-neutral-500 border border-surface-border'
                  }`}
                >
                  {s < step ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    s
                  )}
                </div>
                <span className={`text-caption font-medium hidden sm:inline ${s === step ? 'text-primary-base' : 'text-neutral-500'}`}>
                  {s === 1 ? 'Profile' : s === 2 ? (role === 'PROVIDER' ? 'Services' : 'Interests') : 'Preferences'}
                </span>
                {s < 3 && <div className="w-8 h-px bg-surface-border hidden sm:block" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-medium text-neutral-900">Welcome to SabiPro</h2>
                <p className="text-small text-neutral-500 mt-1">Let&apos;s personalise your profile</p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-full border-2 border-dashed border-surface-input hover:border-primary-base transition-colors flex items-center justify-center overflow-hidden bg-surface-bg group cursor-pointer"
                >
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-neutral-500 group-hover:text-primary-base transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.16a15.53 15.53 0 01-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <p className="text-caption text-neutral-500">Tap to upload a profile photo (optional)</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-small font-medium text-neutral-700">Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-neutral-0 border border-surface-input rounded-component py-3 px-4 text-body text-neutral-900 placeholder:text-neutral-500 min-h-[44px] focus:outline-none focus:ring-1 focus:border-primary-base focus:ring-primary-base"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-medium text-neutral-900">
                  {role === 'PROVIDER' ? 'What do you do?' : 'What are you interested in?'}
                </h2>
                <p className="text-small text-neutral-500 mt-1">
                  {role === 'PROVIDER' ? 'Select your trade category' : 'Pick the services you care about'}
                </p>
              </div>

              {role === 'PROVIDER' ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-small font-medium text-neutral-700">Trade category</label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {TRADE_CATEGORIES.map((trade) => (
                      <button
                        key={trade}
                        type="button"
                        onClick={() => setSelectedInterests([trade])}
                        className={`p-3 rounded-card border-2 text-small text-left transition-all ${
                          selectedInterests.includes(trade)
                            ? 'border-primary-base bg-primary-tint text-primary-base font-medium'
                            : 'border-surface-border text-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        {trade}
                      </button>
                    ))}
                  </div>
                  {selectedInterests.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-4">
                      <label className="text-small font-medium text-neutral-700">Short bio (optional)</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell potential clients about your experience..."
                        rows={3}
                        className="w-full bg-neutral-0 border border-surface-input rounded-component py-3 px-4 text-body text-neutral-900 placeholder:text-neutral-500 min-h-[88px] focus:outline-none focus:ring-1 focus:border-primary-base focus:ring-primary-base resize-none"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-small text-neutral-700">Select all that apply:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CONSUMER_INTERESTS.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`p-3 rounded-card border-2 text-small text-left transition-all ${
                          selectedInterests.includes(interest)
                            ? 'border-primary-base bg-primary-tint text-primary-base font-medium'
                            : 'border-surface-border text-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-medium text-neutral-900">You&apos;re almost there</h2>
                <p className="text-small text-neutral-500 mt-1">Set your location and preferences</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-small font-medium text-neutral-700">Your city</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCityDropdown(!showCityDropdown)}
                    className="w-full bg-neutral-0 border border-surface-input rounded-component py-3 px-4 text-body text-left min-h-[44px] focus:outline-none focus:border-primary-base focus:ring-1 focus:ring-primary-base flex items-center justify-between"
                  >
                    <span className={city ? 'text-neutral-900' : 'text-neutral-500'}>{city || 'Select city'}</span>
                    <svg className={`w-4 h-4 text-neutral-500 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {showCityDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCityDropdown(false)} />
                      <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-neutral-0 border border-surface-border rounded-component shadow-lg overflow-hidden">
                        {CITIES.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => { setCity(c); setShowCityDropdown(false); }}
                            className={`w-full text-left px-4 py-3 text-body transition-colors ${
                              city === c ? 'bg-primary-tint text-primary-base font-medium' : 'text-neutral-700 hover:bg-surface-bg'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-small font-medium text-neutral-900">Email notifications</p>
                  <p className="text-caption text-neutral-500">Receive updates about inquiries and bookings</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    emailNotifications ? 'bg-primary-base' : 'bg-surface-disabled'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-neutral-0 shadow-sm transition-transform ${
                      emailNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-border">
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-small font-medium text-neutral-700 hover:text-neutral-900 px-4 py-2 min-h-[44px] min-w-[44px] flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                  Back
                </button>
              ) : (
                <div />
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goToDashboard}
                className="text-small text-neutral-500 hover:text-neutral-700 px-4 py-2 min-h-[44px] transition-colors"
              >
                Skip
              </button>
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="!bg-primary-base hover:!bg-primary-deep !text-neutral-0 !rounded-[14px]"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleFinish}
                  className="!bg-primary-base hover:!bg-primary-deep !text-neutral-0 !rounded-[14px]"
                >
                  Go to dashboard
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
