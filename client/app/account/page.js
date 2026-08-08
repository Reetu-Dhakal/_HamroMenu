'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Star, Package, MessageSquare, LogOut, User } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import RoleGuard from '@/components/RoleGuard';
import DashboardShell from '@/components/DashboardShell';
import { formatCurrency, formatDate, orderStatusMeta, initials } from '@/lib/format';

export default function AccountPage() {
  const { user, logout } = useAuth();
  return (
    <RoleGuard>
      <AccountInner user={user} onLogout={logout} />
    </RoleGuard>
  );
}

function AccountInner({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('orders');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/orders/my?limit=20');
      setOrders(res.data?.orders || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardShell title="My account" subtitle={`Welcome back, ${user?.name?.split(' ')[0] || 'guest'}`}>
      {/* Profile card */}
      <div className="card mb-6 flex flex-wrap items-center gap-5 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-clay-100 text-2xl font-bold text-clay-700">
          {initials(user?.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-semibold text-ink-950">{user?.name}</p>
          <p className="text-sm text-ink-500">{user?.email}{user?.phone ? ` · ${user.phone}` : ''}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/account/profile" className="btn-outline"><User className="h-4 w-4" /> Edit</Link>
          <button onClick={onLogout} className="btn-ghost text-red-600"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        {[
          { key: 'orders', label: 'Orders', icon: Package },
          { key: 'favorites', label: 'Favorites', icon: Star },
          { key: 'reviews', label: 'Reviews', icon: MessageSquare },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
              tab === t.key ? 'bg-ink-950 text-cream' : 'bg-white text-ink-600 border border-ink-900/10'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
        ) : orders.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="font-display text-lg font-semibold text-ink-900">No orders yet</p>
            <p className="mt-1 text-sm text-ink-500">Your order history will show up here.</p>
            <Link href="/" className="btn-clay mt-5">Browse a menu</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const meta = orderStatusMeta(o.status);
              return (
                <Link key={o._id} href={`/order?r=${o.restaurant}`} className="card block p-5 transition hover:shadow-lift">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-display text-lg font-semibold text-ink-950">{o.orderNumber}</p>
                      <p className="text-xs text-ink-500">{formatDate(o.placedAt)}</p>
                    </div>
                    <span className={`badge ${meta.color}`}>{meta.label}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between border-t border-ink-900/5 pt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {o.items.map((it) => (
                        <span key={it._id} className="chip">{it.quantity}× {it.name}</span>
                      ))}
                    </div>
                    <span className="font-display text-lg font-bold text-ink-950">{formatCurrency(o.grandTotal)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}

      {tab === 'favorites' && <FavoritesTab />}
      {tab === 'reviews' && <ReviewsTab />}
    </DashboardShell>
  );
}

function FavoritesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/profile/favorites').then((res) => setItems(res.data || [])).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20" />)}</div>;
  if (items.length === 0) return <div className="card p-10 text-center text-sm text-ink-500">No favorites yet.</div>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <div key={it._id} className="card p-4">
          <p className="font-display text-lg font-semibold text-ink-950">{it.name}</p>
          <p className="text-sm text-ink-600">{formatCurrency(it.price)}</p>
        </div>
      ))}
    </div>
  );
}

function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/profile/reviews').then((res) => setReviews(res.data || [])).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-20" />)}</div>;
  if (reviews.length === 0) return <div className="card p-10 text-center text-sm text-ink-500">No reviews yet — rate your next meal!</div>;
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r._id} className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gold-600">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            <span className="text-xs text-ink-400">{formatDate(r.createdAt)}</span>
          </div>
          {r.title && <p className="mt-2 font-semibold text-ink-900">{r.title}</p>}
          {r.comment && <p className="mt-1 text-sm text-ink-600">{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}