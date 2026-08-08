'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import RoleGuard from '@/components/RoleGuard';
import DashboardShell from '@/components/DashboardShell';
import { formatCurrency } from '@/lib/format';

export default function AdminReportsPage() {
  return <RoleGuard roles={['admin']}><Reports /></RoleGuard>;
}

function Reports() {
  const [rid, setRid] = useState(null);
  const [rep, setRep] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/restaurants').then((r) => {
      if (r.data?.length) setRid(r.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!rid) return;
    api.get(`/admin/${rid}/reports`).then((r) => setRep(r.data)).finally(() => setLoading(false));
  }, [rid]);

  return (
    <DashboardShell title="Analytics & reports" subtitle="Revenue, peak hours, turnover" roleColor="text-clay-600">
      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-56" />)}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart data={rep?.revenue?.daily || []} />
            <StatusChart data={rep?.status || []} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <PeakChart data={rep?.peakHours || []} />
            <TurnoverTable turnover={rep?.turnover || []} />
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function RevenueChart({ data }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="card p-5">
      <p className="font-display text-lg font-semibold text-ink-950">Revenue by day</p>
      <div className="mt-6 flex h-48 items-end gap-2">
        {data.length === 0 && <p className="text-sm text-ink-500">No data yet</p>}
        {data.slice(-14).map((d) => (
          <div key={d._id} className="group flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-semibold text-ink-500 opacity-0 transition group-hover:opacity-100">
              {formatCurrency(d.revenue)}
            </span>
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-clay-600 to-gold-500 transition-all group-hover:opacity-80"
              style={{ height: `${Math.max(4, (d.revenue / max) * 100)}%` }}
            />
            <span className="text-[10px] text-ink-400">{d._id.slice(8)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusChart({ data }) {
  const labels = { pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing', ready: 'Ready', served: 'Served', completed: 'Completed', cancelled: 'Cancelled' };
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  return (
    <div className="card p-5">
      <p className="font-display text-lg font-semibold text-ink-950">Order status breakdown</p>
      <div className="mt-6 space-y-3">
        {data.map((d) => (
          <div key={d._id}>
            <div className="flex justify-between text-sm">
              <span className="text-ink-700">{labels[d._id] || d._id}</span>
              <span className="font-semibold text-ink-950">{d.count}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-900/5">
              <div className="h-full rounded-full bg-clay-600" style={{ width: `${(d.count / total) * 100}%` }} />
            </div>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-ink-500">No orders yet</p>}
      </div>
    </div>
  );
}

function PeakChart({ data }) {
  const max = Math.max(...data.map((d) => d.orders), 1);
  return (
    <div className="card p-5">
      <p className="font-display text-lg font-semibold text-ink-950">Peak hours</p>
      <p className="text-xs text-ink-500">Busiest hours of the day</p>
      <div className="mt-6 grid grid-cols-12 h-14 gap-1">
        {Array.from({ length: 24 }).map((_, hour) => {
          const found = data.find((d) => d._id === hour);
          const orders = found?.orders || 0;
          return (
            <div key={hour} className="flex flex-col items-center justify-end gap-0.5" title={`${hour}:00 — ${orders} orders`}>
              <div className="w-full rounded bg-clay-600/70" style={{ height: `${Math.max(4, (orders / max) * 100)}%` }} />
            </div>
          );
        })}
      </div>
      <p className="mt-1 text-center text-[10px] text-ink-400">0h — 23h</p>
    </div>
  );
}

function TurnoverTable({ turnover }) {
  return (
    <div className="card p-5">
      <p className="font-display text-lg font-semibold text-ink-950">Table turnover</p>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-ink-500">
            <th className="pb-2">Table</th>
            <th className="pb-2">Area</th>
            <th className="pb-2 text-right">Orders</th>
            <th className="pb-2 text-right">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {turnover.map((t) => (
            <tr key={t._id} className="border-t border-ink-900/5">
              <td className="py-2 font-semibold text-ink-900">{t.label}</td>
              <td className="py-2 text-ink-500">{t.area}</td>
              <td className="py-2 text-right">{t.turnover}</td>
              <td className="py-2 text-right font-medium">{formatCurrency(t.revenue)}</td>
            </tr>
          ))}
          {turnover.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-ink-500">No data</td></tr>}
        </tbody>
      </table>
    </div>
  );
}