'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const FALLBACK_LOGO = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop&auto=format&q=70';

export default function SiteNav({ restaurant, activePage = '' }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const links = [
    { key: 'menu', label: 'Menu', href: restaurant ? `/order?r=${restaurant._id}` : '/#menu' },
    { key: 'about', label: 'How it works', href: '/#how' },
    { key: 'reviews', label: 'Reviews', href: '/#reviews' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-900/5 bg-cream/80 backdrop-blur-md">
      <div className="container-px flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl shadow-soft">
            <Image src={restaurant?.logoUrl || FALLBACK_LOGO} alt="logo" fill className="object-cover" sizes="36px" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-ink-950">
            {restaurant?.name || 'HamroMenu'}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activePage === l.key ? 'text-clay-700' : 'text-ink-700 hover:text-ink-950'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            className="btn-ghost hidden md:inline-flex"
            onClick={() => setOpen(true)}
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          {user ? (
            <Link href={dashboardHref(user.role)} className="btn-primary hidden md:inline-flex">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="btn-primary hidden md:inline-flex">
              Sign in
            </Link>
          )}
          <button
            className="btn-ghost md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink-900/5 bg-cream md:hidden">
          <nav className="container-px flex flex-col gap-1 py-4">
            {links.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-800 hover:bg-ink-900/5"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={user ? dashboardHref(user.role) : '/login'}
              onClick={() => setOpen(false)}
              className="btn-primary mt-2"
            >
              {user ? 'Go to dashboard' : 'Sign in'}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export function dashboardHref(role) {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'staff':
      return '/staff';
    case 'kitchen':
      return '/kitchen';
    default:
      return '/account';
  }
}

export { FALLBACK_LOGO };