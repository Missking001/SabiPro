'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Overview', href: '/admin/dashboard' },
  { label: 'Providers', href: '/admin/providers' },
  { label: 'Flagged Content', href: '/admin/flags' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Transactions', href: '/admin/transactions' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-neutral-900 flex-shrink-0 hidden md:block">
      <div className="p-4 border-b border-neutral-700">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-base rounded-lg flex items-center justify-center">
            <span className="text-neutral-0 font-bold text-small">S</span>
          </div>
          <span className="text-small font-medium text-neutral-0">Admin</span>
        </Link>
      </div>
      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-component text-small transition-colors ${
                isActive
                  ? 'bg-primary-tint text-primary-base border-l-2 border-primary-base'
                  : 'text-neutral-500 hover:text-neutral-0 hover:bg-neutral-700'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
