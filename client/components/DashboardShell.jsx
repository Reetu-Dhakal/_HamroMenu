'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Menu as MenuIcon, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { initials, classNames } from '@/lib/format';

import { roleNav } from '@/lib/nav';

export default function DashboardShell({ title, subtitle, nav, roleColor, children }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const resolvedNav = nav || roleNav(user?.role);
  const active = (href) => href === pathname || pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink-900/5 bg-cream/90 px-4 backdrop-blur-md lg:hidden">
        <button className="btn-ghost p-2" onClick={() => setOpen(true)} aria-label="Menu">
          <MenuIcon className="h-5 w-5" />
        </button>
        <span className="font-display text-lg font-semibold text-ink-950">{title}</span>
        <UserAvatar />
      </header>

      <div className="mx-auto flex w-full max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-900/5 bg-surface lg:flex">
          <Sidebar roleColor={roleColor} onNavigate={() => setOpen(false)} />
        </aside>

        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" />
            <aside className="relative h-full w-72 bg-surface shadow-lift" onClick={(e) => e.stopPropagation()}>
              <button
                className="btn-ghost absolute right-3 top-4 p-2"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <XIcon />
              </button>
              <Sidebar roleColor={roleColor} onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 hidden lg:block">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-950">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-ink-600">{subtitle}</p>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ roleColor, onNavigate }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const nav = roleNav(user?.role);

  return (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-2.5 px-5 py-6" onClick={onNavigate}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-950">
          <span className="font-display text-sm font-bold text-cream">HM</span>
        </div>
        <div>
          <p className="font-display text-lg font-semibold leading-tight text-ink-950">HamroMenu</p>
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${roleColor || 'text-clay-600'}`}>{user?.role}</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const isActive = item.href === pathname || (item.href !== '/' && pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={classNames(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive ? 'bg-ink-950 text-cream shadow-soft' : 'text-ink-600 hover:bg-ink-900/5 hover:text-ink-950'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-900/5 p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-100 text-sm font-bold text-clay-700">
            {initials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
            <p className="truncate text-xs text-ink-500">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

function UserAvatar() {
  const { user } = useAuth();
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-100 text-sm font-bold text-clay-700">
      {initials(user?.name)}
    </div>
  );
}

function XIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>;
}