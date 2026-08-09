import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { BarChart3, TrendingUp, Users, Clock, Star } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { npr, nprCompact, cx } from '../../lib/format';
import { Spinner } from '../../components/ui';

const RANGES = [
  { key: '7d', label: '7 days' },
  { key: '14d', label: '14 days' },
  { key: '30d', label: '30 days' },
  { key: 'quarter', label: '90 days' },
];

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const rid = user?.restaurant;
  const [range, setRange] = useState('14d');
  const [rep, setRep] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await request(`/api/admin/${rid}/reports?range=${range}`);
        if (alive) setRep(data);
      } catch (_) { /* ignore */ }
    })();
    return () => (alive = false);
  }, [rid, range]);

  const daily = rep?.revenue?.daily || [];
  const maxDay = Math.max(1, ...daily.map((d) => d.revenue));
  const byMethod = rep?.revenue?.byMethod || [];
  const methodTotal = byMethod.reduce((s, m) => s + m.revenue, 0) || 1;
  const peak = rep?.peakHours || [];
  const turnover = rep?.turnover || [];
  const status = rep?.status || [];
  const statusMax = Math.max(1, ...status.map((s) => s.count || 0));

  if (!rep) return <div className="flex justify-center py-24"><Spinner /></div>;

  return (
    <div className="min-h-dvh">
      <Helmet><title>Analytics · HamroMenu</title></Helmet>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Analytics</h1>
          <p className="text-[13px] font-medium text-ink-faint">Performance deep-dive</p>
        </div>
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <button key={r.key} onClick={() => setRange(r.key)} className={cx('chip', range === r.key && 'bg-ink text-white ring-ink')}>{r.label}</button>
          ))}
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Revenue" value={npr(rep.overview.revenue.total)} icon={TrendingUp} />
        <Kpi label="Avg. order value" value={npr(rep.overview.avgOrderValue)} icon={BarChart3} />
        <Kpi label="Avg. rating" value={rep.overview.avgRating ? `${rep.overview.avgRating} / 5` : '—'} icon={Star} />
        <Kpi label="Customers" value={rep.overview.counts.totalCustomers} icon={Users} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-1 font-display text-[15px] font-bold text-ink">Daily revenue</h2>
          <p className="mb-4 text-[12px] text-ink-faint">{nprCompact(methodTotal)} tracked</p>
          <div className="flex h-44 items-end gap-1">
            {daily.map((d) => (
              <div key={d._id} className="group relative flex-1">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-clay-600 to-saffron transition hover:from-clay-700"
                  style={{ height: `${Math.max(4, (d.revenue / maxDay) * 100)}%` }}
                  title={`${d._id} · ${nprCompact(d.revenue)}`}
                />
                <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                  {nprCompact(d.revenue)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-display text-[15px] font-bold text-ink">Order status distribution</h2>
          <div className="space-y-3">
            {status.map((s) => (
              <div key={s._id}>
                <div className="flex justify-between text-[12.5px] font-semibold text-ink-soft">
                  <span className="capitalize">{String(s._id || '—').replace(/_/g, ' ')}</span>
                  <span>{s.count} orders</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-cream-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-saffron to-clay-600" style={{ width: `${(s.count / statusMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <h2 className="mb-3 mt-6 font-display text-[15px] font-bold text-ink">By payment method</h2>
          {byMethod.map((m) => (
            <div key={m._id} className="mb-2.5">
              <div className="flex justify-between text-[12.5px] font-semibold text-ink-soft">
                <span className="capitalize">{String(m._id || '—').replace(/_/g, ' ')}</span>
                <span>{nprCompact(m.revenue)}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-cream-100">
                <div className="h-full rounded-full bg-leaf/70" style={{ width: `${Math.min(100, (m.revenue / methodTotal) * 100)}%` }} />
              </div>
            </div>
          ))}
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-[15px] font-bold text-ink"><Clock size={15} className="text-clay-600" /> Peak hours</h2>
          <div className="flex h-40 items-end gap-1">
            {Array.from({ length: 24 }, (_, h) => {
              const found = peakMap(peak)[h] || 0;
              const maxP = Math.max(1, ...Object.values(peakMap(peak)));
              return (
                <div key={h} className="group relative flex-1" title={`${String(h).padStart(2, '0')}:00 · ${found} orders`}>
                  <div className={cx('w-full rounded-t-md', found ? 'bg-gradient-to-t from-clay-600 to-saffron' : 'bg-cream-100')} style={{ height: `${found ? Math.max(6, (found / maxP) * 100) : 4}%` }} />
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">Busiest hour: {String(busiestHour(peak)).padStart(2, '0')}:00</p>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-display text-[15px] font-bold text-ink">Table turnover</h2>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-ink-faint">
                  <th className="pb-2 pr-2">Table</th>
                  <th className="pb-2 pr-2">Area</th>
                  <th className="pb-2 pr-2">Orders</th>
                  <th className="pb-2 pr-2">Status</th>
                  <th className="pb-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(turnover || []).map((t) => (
                  <tr key={t._id} className="border-t border-cream-100">
                    <td className="py-2.5 pr-2 font-bold text-ink">{t.label || t.name || `Table ${t.number}`}</td>
                    <td className="py-2.5 pr-2 text-ink-soft">{t.area || '—'}</td>
                    <td className="py-2.5 pr-2 text-ink">{t.turnover || 0}</td>
                    <td className="py-2.5 pr-2">
                      <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-bold', t.status === 'occupied' ? 'bg-clay-600/15 text-clay-700' : 'bg-leaf/10 text-leaf')}>{t.status || 'free'}</span>
                    </td>
                    <td className="py-2.5 text-right font-bold text-ink">{npr(t.revenue || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function peakMap(entries) {
  const m = {};
  (entries || []).forEach((h) => { m[h._id] = h.orders; });
  return m;
}

function busiestHour(entries) {
  let best = 0;
  (entries || []).forEach((h) => {
    if (h.orders >= best) best = h.orders;
  });
  const found = (entries || []).find((h) => h.orders === best);
  return found ? found._id : 0;
}

function Kpi({ label, value, icon: Icon }) {
  return (
    <div className="card flex items-center gap-3.5 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-clay-50 text-clay-700"><Icon size={20} /></span>
      <div className="min-w-0">
        <p className="truncate font-display text-xl font-black text-ink">{value}</p>
        <p className="text-[11.5px] font-bold uppercase tracking-wide text-ink-faint">{label}</p>
      </div>
    </div>
  );
}