import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, ShoppingBag, Users, UtensilsCrossed, Star, Banknote, RefreshCw, Loader2, Flame } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { npr, nprCompact, cx } from '../../lib/format';
import { Spinner, StatusPill, EmptyState } from '../../components/ui';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const rid = user?.restaurant;
  const [ov, setOv] = useState(null);
  const [rep, setRep] = useState(null);
  const [live, setLive] = useState(null);
  const [recStats, setRecStats] = useState(null);
  const [rebuilding, setRebuilding] = useState(false);

  const load = useCallback(async () => {
    if (!rid) return;
    const [overview, reports, orders, recs] = await Promise.all([
      request(`/api/admin/${rid}/overview`),
      request(`/api/admin/${rid}/reports?range=14d`),
      request(`/api/staff/${rid}/orders?limit=8`),
      request(`/api/admin/${rid}/recommendations/stats`),
    ]);
    setOv(overview);
    setRep(reports);
    setLive(orders.orders);
    setRecStats(recs);
  }, [rid]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await load();
      } catch (_) { /* ignore */ } finally { if (alive) {} }
    })();
    return () => (alive = false);
  }, [load]);

  async function rebuild() {
    setRebuilding(true);
    try {
      const res = await request(`/api/admin/${rid}/recommendations/rebuild`, { method: 'POST' });
      toast.success(`Recommendation matrix rebuilt (${res?.items || 'ok'})`);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRebuilding(false);
    }
  }

  if (!ov) {
    return <div className="flex justify-center py-24"><Spinner /></div>;
  }

  const daily = rep?.revenue?.daily || [];
  const maxDay = Math.max(1, ...daily.map((d) => d.revenue));
  const liveActive = (live || []).filter((o) => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status));

  return (
    <div className="min-h-dvh">
      <Helmet><title>Admin dashboard · HamroMenu</title></Helmet>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Overview</h1>
          <p className="text-[13px] font-medium text-ink-faint">Live KPIs for your restaurant</p>
        </div>
        <button onClick={load} className="btn-ghost"><RefreshCw size={15} /> Refresh</button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={TrendingUp} label="Revenue today" value={npr(ov.revenue.today)} tone="bg-clay-50 text-clay-700" />
        <Kpi icon={ShoppingBag} label="Orders today" value={ov.counts.todayOrders} tone="bg-saffron/10 text-saffron-deep" />
        <Kpi icon={UtensilsCrossed} label="Active orders" value={ov.counts.activeOrders} tone="bg-leaf/10 text-leaf" />
        <Kpi icon={Banknote} label="Total revenue" value={nprCompact(ov.revenue.total)} tone="bg-cream-200 text-ink" />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-bold text-ink">Revenue — last 14 days</h2>
            <span className="text-[12px] font-semibold text-ink-faint">{nprCompact(ov.avgOrderValue)} avg order</span>
          </div>
          <div className="flex h-36 items-end gap-1.5">
            {daily.map((d) => (
              <div key={d._id} className="group relative flex-1">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-clay-600 to-saffron transition-all hover:from-clay-700"
                  style={{ height: `${Math.max(4, (d.revenue / maxDay) * 100)}%` }}
                  title={`${d._id} · ${nprCompact(d.revenue)} · ${d.orders} orders`}
                />
                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-0.5 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                  {nprCompact(d.revenue)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-3 font-display text-[15px] font-bold text-ink">Payment mix</h2>
          {(rep?.revenue?.byMethod || []).map((m) => {
            const total = (rep.revenue.byMethod || []).reduce((s, x) => s + x.revenue, 0) || 1;
            return (
              <div key={m._id || 'none'} className="mb-3">
                <div className="flex justify-between text-[12.5px] font-semibold text-ink-soft">
                  <span className="capitalize">{String(m._id || '—').replace(/_/g, ' ')}</span>
                  <span>{nprCompact(m.revenue)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-cream-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-saffron to-clay-600" style={{ width: `${Math.min(100, (m.revenue / total) * 100)}%` }} />
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card p-5">
          <h2 className="mb-3 font-display text-[15px] font-bold text-ink">Top dishes</h2>
          <ul className="space-y-2.5">
            {(rep?.top || []).slice(0, 6).map((it, i) => (
              <li key={it._id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream-100 text-[11px] font-black text-ink-faint">{i + 1}</span>
                <span className={cx('h-2.5 w-2.5 shrink-0 rounded-full', it.isVeg ? 'bg-leaf' : 'bg-clay-600')} />
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">{it.name}</span>
                <span className="text-[11.5px] font-bold text-ink-faint">{it.orderCount || 0}×</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="mb-3 font-display text-[15px] font-bold text-ink">Peak hours</h2>
          {(rep?.peakHours || []).slice(0, 5).map((h) => (
            <div key={h._id} className="mb-2 flex items-center gap-3">
              <Flame size={14} className="shrink-0 text-saffron-deep" />
              <span className="w-12 text-[13px] font-semibold text-ink">{String(h._id).padStart(2, '0')}:00</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream-100">
                <div className="h-full rounded-full bg-gradient-to-r from-saffron to-clay-600" style={{ width: `${(h.orders / Math.max(1, (rep.peakHours[0]?.orders || 1))) * 100}%` }} />
              </div>
              <span className="w-8 text-right text-[11.5px] font-bold text-ink-faint">{h.orders}</span>
            </div>
          ))}
        </section>

        <section className="card flex flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-bold text-ink">AI recommendations</h2>
            <span className="rounded-full bg-leaf/10 px-2.5 py-1 text-[10.5px] font-bold text-leaf">ON</span>
          </div>
          <p className="text-[12.5px] leading-relaxed text-ink-soft">
            Cosine-similarity engine matching dishes to diners, order co-occurrence boosts, and smart re-ranking per restaurant.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
            <Metric label="Items indexed" value={recStats?.itemCount ?? '—'} />
            <Metric label="Orders learned" value={recStats?.stats?.orders ?? '—'} />
            <Metric label="Diners mapped" value={recStats?.stats?.users ?? '—'} />
            <Metric label="Reviews woven" value={recStats?.stats?.reviews ?? '—'} />
          </div>
          <p className="mt-2 text-[10.5px] text-ink-faint">
            Matrix built {recStats?.computedAt ? new Date(recStats.computedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
          </p>
          <button onClick={rebuild} disabled={rebuilding} className="btn-soft mt-4 w-full">
            {rebuilding ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Rebuild matrix
          </button>
        </section>
      </div>

      <section className="card mt-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[15px] font-bold text-ink">Live orders</h2>
          <Link to="/admin/orders" className="text-[12.5px] font-bold text-clay-700 hover:underline">View all →</Link>
        </div>
        {liveActive.length === 0 ? (
          <EmptyState icon={UtensilsCrossed} title="No active orders" copy="Everything is settled for now." />
        ) : (
          <div className="divide-y divide-cream-100">
            {liveActive.map((o) => (
              <div key={o._id} className="flex flex-wrap items-center gap-2 py-2.5">
                <span className="font-display font-bold text-ink">{o.orderNumber}</span>
                <span className="text-[12px] text-ink-faint">Table {o.table?.number || o.table?.name || '—'}</span>
                <StatusPill status={o.status} />
                <span className="ml-auto font-display font-bold text-clay-700">{npr(o.grandTotal)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }) {
  return (
    <div className="card flex items-center gap-3.5 p-4">
      <span className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', tone)}><Icon size={20} /></span>
      <div className="min-w-0">
        <p className="truncate font-display text-xl font-black text-ink">{value}</p>
        <p className="text-[11.5px] font-bold uppercase tracking-wide text-ink-faint">{label}</p>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-cream-50 px-3 py-2">
      <p className="font-display text-[14px] font-bold text-ink">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  );
}