'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function Footer() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Always show footer on the landing page, hide on other pages when authenticated
  if (isAuthenticated && pathname !== '/') return null;

  return (
    <footer className="bg-black text-neutral-500">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Image
              src="/sabipro_logo_v5.png"
              alt="SabiPro"
              width={120}
              height={32}
              className="h-8 w-auto mb-3"
            />
            <p className="text-small leading-relaxed">
              Connecting you with trusted local service providers across Nigeria.
              Maximum trust, maximum discoverability, minimum friction.
            </p>
          </div>
          <div>
            <h4 className="text-small font-medium text-neutral-0 mb-3">For consumers</h4>
            <ul className="space-y-2">
              <li><Link href="/search" className="text-small hover:text-neutral-0 transition-colors">Find providers</Link></li>
              <li><Link href="/register" className="text-small hover:text-neutral-0 transition-colors">Create account</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-small font-medium text-neutral-0 mb-3">For providers</h4>
            <ul className="space-y-2">
              <li><Link href="/register" className="text-small hover:text-neutral-0 transition-colors">List your service</Link></li>
              <li><Link href="/login" className="text-small hover:text-neutral-0 transition-colors">Provider sign in</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-neutral-700 mt-8 pt-8 text-center text-caption">
          &copy; {new Date().getFullYear()} SabiPro. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
