'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

export function HeroSearch() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      router.push('/login');
    },
    [router],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row items-stretch sm:items-center bg-neutral-0 rounded-component max-w-xl overflow-hidden shadow-lg"
    >
      <div className="flex items-center gap-3 flex-1 px-4 py-3">
        <svg className="w-5 h-5 text-neutral-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What service do you need?"
          className="w-full bg-transparent text-body text-neutral-900 placeholder:text-neutral-500 border-none outline-none focus:ring-0 min-h-[44px]"
        />
      </div>
      <Button
        type="submit"
        size="md"
        className="sm:m-1.5 !bg-secondary-base hover:!bg-secondary-hover !text-neutral-900 !rounded-component !font-medium !px-6"
      >
        Find a Pro
      </Button>
    </form>
  );
}
