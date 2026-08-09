import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ChefHat, CheckCircle2, Timer, Loader2, Flame } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { cx, elapsedLabel } from '../../lib/format';
import { Spinner, EmptyState } from '../../components/ui';

export default function KitchenDashboardPage() {
  const { user } = useAuth();
  const { socket, join } = useSocket();
  const toast = useToast();
  const rid = user?.restaurant;

  const [queue, setQueue] = useState(null);
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    if (!rid) return;
    const [q, s] = await Promise.all([
      request(`/api/kitchen/${rid}/queue`),
      request(`/api/kitchen/${rid}/stats`),
    ]);
    setQueue(Array.isArray(q) ? q : []);
    setStats(s);
  }, [rid]);

  useEffect(() => { if (rid) join(rid, null); }, [rid, join]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!rid) return;
        const [q, s] = await Promise.all([
          request(`/api/kitchen/${rid}/queue`),
          request(`/api/kitchen/${rid}/stats`),
        ]);
        if (!alive) return;
        setQueue(Array.isArray(q) ? q : []);
        setStats(s);
      } catch (_) { /* ignore */ }
    })();
    return () => (alive = false);
  }, [rid]);

  useEffect(() => {
    if (!socket) return;
    socket.on('order:new', load);
    socket.on('order:status', load);
    socket.on('order:item-status', load);
    return () => {
      socket.off('order:new', load);
      socket.off('order:status', load);
      socket.off('order:item-status', load);
    };
  }, [socket, load]);

  async function run(path, label) {
    setBusy(path);
    try {
      await request(path, { method: 'POST' });
      toast.success(label);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy('');
    }
  }

  const sorted = (queue || []).sort((a, b) => {
    const order = { pending: 0, confirmed: 1, preparing: 2, ready: 3 };
    return (order[a.status] ?? 0) - (order[b.status] ?? 0) || new Date(a.placedAt) - new Date(b.placedAt);
  });

  return (
    <div className="min-h-dvh bg-cream-50 pb-20">
      <Helmet><title>Kitchen display · HamroMenu</title></Helmet>
      <header className="sticky top-0 z-30 border-b border-cream-200 bg-cream-50/95 px-4 py-3 backdrop-blur sm:px-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-ink"><ChefHat size={18} className="mr-2 inline text-clay-600" />Kitchen queue</h1>
          <div className="flex gap-2">
            <StatPill value={stats?.pending ?? 0} label="New" tone="text-red-600 bg-red-50" />
            <StatPill value={stats?.preparing ?? 0} label="Cooking" tone="text-saffron-deep bg-saffron/10" />
            <StatPill value={stats?.ready ?? 0} label="Ready" tone="text-leaf bg-leaf/10" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        {!queue && <div className="flex justify-center py-24"><Spinner /></div>}
        {queue?.length === 0 && (
          <div className="pt-16">
            <EmptyState icon={ChefHat} title="Kitchen is quiet" copy="Incoming orders will appear here as tickets." />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((o) => {
            const overdue = o.waitMinutes > (o.prepTimeTotal || 20) + 5 && ['pending', 'confirmed', 'preparing'].includes(o.status);
            return (
              <motion.article
                key={o._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cx('card overflow-hidden', o.status === 'ready' && 'ring-2 ring-leaf/40')}
              >
                <div className={cx('border-b-2 px-4 py-2.5', o.status === 'ready' ? 'border-leaf bg-leaf/10' : overdue ? 'border-red-400 bg-red-50' : 'border-cream-200 bg-cream-50')}>
                  <div className="flex items-center justify-between">
                    <p className="font-display text-[15px] font-black text-ink">{o.orderNumber}</p>
                    <span className={cx('text-[11.5px] font-bold', overdue ? 'text-red-600' : 'text-ink-faint')}>
                      {elapsedLabel(o.placedAt)} in queue
                    </span>
                  </div>
                  <p className="text-[11.5px] text-ink-faint">
                    Table {o.table?.name || o.table?.number || '—'} · {o.items?.length} items · τ {o.prepTimeTotal || '?'} min
                  </p>
                </div>

                <ul className="space-y-2 px-4 py-3">
                  {o.items.map((it) => (
                    <li key={it._id} className="flex items-center gap-2.5 text-[13.5px]">
                      <span className={cx('h-2 w-2 shrink-0 rounded-full', it.status === 'ready' ? 'bg-leaf' : 'bg-saffron')} />
                      <span className="font-bold text-ink">{it.quantity}×</span>
                      <span className="font-semibold text-ink">{it.name}</span>
                      {it.optionsLabel && <span className="truncate text-[11px] text-ink-faint">{it.optionsLabel}</span>}
                      <button
                        disabled={it.status === 'ready' || busy === `item-${it._id}`}
                        onClick={() => run(`/api/kitchen/orders/${o._id}/items/${it._id}/ready`, 'Item ready')}
                        className="ml-auto shrink-0 text-[12px] font-bold text-leaf disabled:opacity-30"
                        aria-label="Mark item ready"
                      >
                        {it.status === 'ready' ? '✓' : busy === `item-${it._id}` ? '…' : 'Ready'}
                      </button>
                    </li>
                  ))}
                </ul>
                {o.specialRequests && <p className="mx-4 mb-2 rounded-lg bg-saffron/10 px-3 py-1.5 text-[12px] italic text-saffron-deep">{o.specialRequests}</p>}

                <div className="border-t border-dashed border-cream-200 px-4 py-3">
                  {o.status === 'pending' || o.status === 'confirmed' ? (
                    <button onClick={() => run(`/api/kitchen/orders/${o._id}/accept`, 'Accepted — started cooking')} className="btn-primary w-full" disabled={busy === `accept-${o._id}`}>
                      {busy === `accept-${o._id}` ? <Loader2 size={15} className="animate-spin" /> : <Flame size={15} />} Accept & start
                    </button>
                  ) : o.status === 'preparing' ? (
                    <button onClick={() => run(`/api/kitchen/orders/${o._id}/ready`, 'Order ready')} className="btn-leaf w-full" disabled={busy === `ready-${o._id}`}>
                      {busy === `ready-${o._id}` ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Mark order ready
                    </button>
                  ) : (
                    <button onClick={() => run(`/api/kitchen/orders/${o._id}/ready`, 'Re-ready')} className="btn-ghost w-full">
                      <CheckCircle2 size={15} /> Ready — awaiting pickup
                    </button>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function StatPill({ value, label, tone }) {
  return (
    <span className={cx('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold', tone)}>
      {value} {label}
    </span>
  );
}