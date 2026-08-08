'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Wallet, ClipboardList, Users, TrendingUp, Receipt, Star } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import RoleGuard from '@/components/RoleGuard';
import DashboardShell from '@/components/DashboardShell';
import { formatCurrency, orderStatusMeta } from '@/lib/format';

export default function AdminPage() {
  const { user } = useAuth();
  return (
    <RoleGuard roles={['admin']}>
      <AdminInner user={user} />
    </RoleGuard>
  );
}

function AdminInner({ user }) {
  const [restaurants, setRestaurants] = useState([]);
  const [rid, setRid] = useState(null);
  const [overview, setOverview] = useState(null);
  const [top, setTop] = useState([]);
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRestaurants = useCallback(async () => {
    try {
      const res = await api.get('/admin/restaurants');
      setRestaurants(res.data || []);
      if (res.data?.length) setRid((prev) => prev || res.data[0]._id);
    } catch (err) {
      setRestaurants([]);
    }
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const loadData = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const [ov, rep, ord] = await Promise.all([
        api.get(`/admin/${id}/overview`),
        api.get(`/admin/${id}/reports`),
        api.get(`/staff/${id}/orders?limit=6`),
      ]);
      setOverview(ov.data);
      setTop(rep.data?.top || []);
      setLatest(ord.data?.orders || []);
    } catch (err) {
      setOverview(null);
      setTop([]);
      setLatest([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (rid) loadData(rid);
  }, [rid, loadData]);

  const stats = [
    { label: 'Total revenue', value: overview ? fmt(overview.revenue?.total) : '—', icon: TrendingUp, tone: 'text-clay-600' },
    { label: 'Today revenue', value: overview ? fmt(overview.revenue?.today) : '—', icon: Wallet, tone: 'text-emerald-600' },
    { label: 'Total orders', value: overview?.counts?.totalOrders ?? '—', icon: ClipboardList, tone: 'text-sky-600' },
    { label: 'Active orders', value: overview?.counts?.activeOrders ?? '—', icon: Receipt, tone: 'text-amber-600' },
    { label: 'Customers', value: overview?.counts?.totalCustomers ?? '—', icon: Users, tone: 'text-indigo-600' },
    { label: 'Avg rating', value: overview?.avgRating != null ? overview.avgRating + ' ★' : '—', icon: Star, tone: 'text-gold-600' },
  ];

  return (
    <DashboardShell title="Admin" subtitle="Restaurant analytics & management" roleColor="text-clay-600">
      {restaurants.length > 1 && (
        <div className="mb-6">
          <label className="label">Restaurant</label>
          <select className="input max-w-xs" value={rid || ''} onChange={(e) => setRid(e.target.value)}>
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-28" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="card flex items-center gap-4 p-5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900/5 ${s.tone}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-ink-500">{s.label}</p>
                  <p className="font-display text-2xl font-semibold text-ink-950">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-ink-950">Top items</h3>
                <Link href="/admin/reports" className="text-sm font-semibold text-clay-700 hover:underline">Reports →</Link>
              </div>
              <ul className="mt-4 divide-y divide-ink-900/5">
                {top.map((it, i) => (
                  <li key={it._id} className="flex items-center gap-4 py-3">
                    <span className="w-6 text-center font-display text-lg font-bold text-ink-300">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{it.name}</p>
                      <p className="text-xs text-ink-500">{it.orderCount} orders</p>
                    </div>
                    {it.isVeg && <span className="badge bg-emerald-100 text-emerald-700">Veg</span>}
                  </li>
                ))}
                {top.length === 0 && <li className="py-6 text-center text-sm text-ink-500">No orders yet</li>}
              </ul>
            </div>

            <div className="card p-5">
              <h3 className="font-display text-lg font-semibold text-ink-950">Latest orders</h3>
              <ul className="mt-4 space-y-3">
                {latest.map((o) => {
                  const meta = orderStatusMeta(o.status);
                  return (
                    <li key={o._id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-900">{o.orderNumber}</p>
                        <p className="text-xs text-ink-500">Table {o.table?.label || '—'}</p>
                      </div>
                      <span className={`badge shrink-0 ${meta.color}`}>{meta.label}</span>
                    </li>
                  );
                })}
                {latest.length === 0 && <li className="py-6 text-center text-sm text-ink-500">No orders yet</li>}
              </ul>
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function fmt(v) {
  return formatCurrency(v);
}