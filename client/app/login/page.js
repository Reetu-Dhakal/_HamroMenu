'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-ink-600">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const { login } = useAuth();
  const toast = useToast();
  const params = useSearchParams();
  const redirect = params.get('next') || '/account';

  const [form, setForm] = useState({ email: 'customer@himalayanflavors.com', password: 'password123' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      window.location.href = roleDashboard(user.role) || redirect;
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="font-display text-2xl font-semibold text-ink-950">HamroMenu</span>
        </Link>
        <div className="card p-8 animate-fade-in">
          <span className="section-eyebrow">Welcome back</span>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950">Sign in to continue</h1>
          <p className="mt-1 text-sm text-ink-600">Access your table, kitchen or management console.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <button className="btn-clay w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-600">
            New here?{' '}
            <Link href="/register" className="font-semibold text-clay-700 hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-ink-900/5 bg-surface p-5 text-center text-xs text-ink-500">
          <p className="mb-3 font-semibold uppercase tracking-wide text-ink-700">Demo accounts</p>
          <div className="grid grid-cols-1 gap-1.5 text-ink-600 sm:grid-cols-2">
            <p><span className="font-semibold">admin</span>@himalayanflavors.com</p>
            <p><span className="font-semibold">staff</span>@himalayanflavors.com</p>
            <p><span className="font-semibold">kitchen</span>@himalayanflavors.com</p>
            <p><span className="font-semibold">customer</span>@himalayanflavors.com</p>
          </div>
          <p className="mt-2 text-ink-400">All passwords: password123</p>
        </div>
      </div>
    </div>
  );
}

export function roleDashboard(role) {
  switch (role) {
    case 'admin': return '/admin';
    case 'staff': return '/staff';
    case 'kitchen': return '/kitchen';
    default: return '/account';
  }
}