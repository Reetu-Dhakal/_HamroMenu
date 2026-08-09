import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Clock, BellRing, UtensilsCrossed, CheckCircle2, Banknote, Loader2, Receipt, ChefHat, RefreshCw } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { npr, elapsedLabel, cx, formatTime } from '../../lib/format';
import { StatusPill, Spinner, Sheet, SmartImage, EmptyState } from '../../components/ui';

const TABS = [
  { key: 'pending', label: 'New' },
  { key: 'confirming', label: 'Confirmed' },
  { key: 'preparing', label: 'Cooking' },
  { key: 'ready', label: 'Ready' },
];

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const { socket, join } = useSocket();
  const toast = useToast();
  const rid = user?.restaurant;
  const rids = rid?.toString();

  const [counts, setCounts] = useState(null);
  const [orders, setOrders] = useState(null);
  const [tab, setTab] = useState('pending');
  const [billOrder, setBillOrder] = useState(null);
  const [bill, setBill] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [collecting, setCollecting] = useState(false);

  const loadAll = useCallback(async () => {
    if (!rid) return;
    const [d, o] = await Promise.all([
      request(`/api/staff/${rid}/dashboard`),
      request(`/api/staff/${rid}/orders?limit=60`),
    ]);
    setCounts(d.counts);
    setOrders(o.orders);
  }, [rid]);

  useEffect(() => {
    if (rid) join(rid, null);
  }, [rid, join]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [d, o] = await Promise.all([
          request(`/api/staff/${rid}/dashboard`),
          request(`/api/staff/${rid}/orders?limit=60`),
        ]);
        if (!alive) return;
        setCounts(d.counts);
        setOrders(o.orders);
      } catch (_) { /* ignore */ }
    })();
    return () => (alive = false);
  }, [rid]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => loadAll();
    socket.on('order:new', refresh);
    socket.on('order:status', refresh);
    socket.on('order:item-status', refresh);
    socket.on('payment:success', refresh);
    return () => {
      socket.off('order:new', refresh);
      socket.off('order:status', refresh);
      socket.off('order:item-status', refresh);
      socket.off('payment:success', refresh);
    };
  }, [socket, loadAll]);

  async function act(type, orderId) {
    setBusyId(orderId);
    try {
      await request(`/api/staff/orders/${orderId}/${type}`, { method: 'POST' });
      toast.success(type === 'send-to-kitchen' ? 'Sent to kitchen' : type === 'serve' ? 'Order served' : 'Done');
      loadAll();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId('');
    }
  }

  async function openBill(order) {
    setBillOrder(order);
    setBill(null);
    try {
      const data = await request(`/api/staff/orders/${order._id}/bill`);
      setBill(data);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function collectCash() {
    setCollecting(true);
    try {
      await request(`/api/staff/orders/${billOrder._id}/collect-cash`, { method: 'POST' });
      toast.success('Payment collected — order completed');
      setBillOrder(null);
      setBill(null);
      loadAll();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCollecting(false);
    }
  }

  const filtered = (orders || []).filter((o) => {
    if (tab === 'pending') return o.status === 'pending';
    if (tab === 'confirming') return o.status === 'confirmed';
    if (tab === 'preparing') return o.status === 'preparing';
    return o.status === 'ready';
  });

  return (
    <div className="min-h-dvh bg-cream-50 pb-20">
      <Helmet><title>Staff dashboard · HamroMenu</title></Helmet>
      <header className="sticky top-0 z-30 border-b border-cream-200 bg-cream-50/95 px-4 py-3 backdrop-blur sm:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-ink">Live floor</h1>
            <p className="text-[12.5px] font-medium text-ink-faint">Welcome, {user?.name?.split(' ')[0]} — floor status updates in real time</p>
          </div>
          <button onClick={loadAll} title="Refresh" className="btn-ghost !px-3"><RefreshCw size={16} /></button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          <StatCard label="New" value={counts?.newOrders ?? '–'} icon={BellRing} tone="text-clay-700 bg-clay-50" />
          <StatCard label="Cooking" value={counts?.preparing ?? '–'} icon={Clock} tone="text-saffron-deep bg-saffron/10" />
          <StatCard label="Ready" value={counts?.ready ?? '–'} icon={CheckCircle2} tone="text-leaf bg-leaf/10" />
          <StatCard label="Unpaid" value={counts?.unpaid ?? '–'} icon={Banknote} tone="text-ink bg-cream-200" />
          <StatCard label="Today" value={counts?.completedToday ?? '–'} icon={UtensilsCrossed} tone="text-clay-700 bg-clay-50" />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={cx('chip whitespace-nowrap', tab === t.key && 'bg-ink text-white ring-ink')}>
              {t.label}
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-[10px] font-bold">{t.key === 'pending' ? counts?.newOrders ?? 0 : t.key === 'ready' ? counts?.ready ?? 0 : t.key === 'preparing' ? counts?.preparing ?? 0 : filtered.length}</span>
            </button>
          ))}
        </div>

        {!orders && <div className="flex justify-center py-20"><Spinner /></div>}
        {orders?.length === 0 && <EmptyState icon={Receipt} title="No orders yet" copy="New orders from the menu app will appear here instantly." />}
        {filtered.map((o) => (
          <motion.article key={o._id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-[16px] font-bold text-ink">{o.orderNumber}</p>
              <StatusPill status={o.status} />
              <span className="ml-auto text-[12px] font-semibold text-ink-faint">
                {o.table?.name ? `Table ${o.table.name}` : `Table ${o.table?.number || '—'}`} · {elapsedLabel(o.placedAt)}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {o.items.map((it) => (
                <div key={it._id} className="flex items-center gap-2.5">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                    <SmartImage src={it.imageUrl} alt="" ratio="1/1" rounded="rounded-lg" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink">{it.quantity}× {it.name}</p>
                    {it.optionsLabel && <p className="truncate text-[11px] text-ink-faint">{it.optionsLabel}</p>}
                  </div>
                </div>
              ))}
            </div>
            {o.specialRequests && <p className="mt-2 rounded-lg bg-saffron/10 px-3 py-1.5 text-[12.5px] italic text-saffron-deep">{o.specialRequests}</p>}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-cream-200 pt-3">
              <span className="font-display text-[17px] font-bold text-clay-700">{npr(o.grandTotal)} {o.paymentMethod === 'pay_after_meal' && <span className="text-[11px] font-semibold text-ink-faint">· pay at table</span>}</span>
              <div className="flex gap-2">
                {o.status === 'pending' || o.status === 'confirmed' ? (
                  <button onClick={() => act('send-to-kitchen', o._id)} disabled={busyId === o._id} className="btn-primary">
                    {busyId === o._id ? <Loader2 size={15} className="animate-spin" /> : <ChefHat size={15} />} Send to kitchen
                  </button>
                ) : null}
                {o.status === 'ready' && (
                  <button onClick={() => act('serve', o._id)} disabled={busyId === o._id} className="btn-leaf">
                    {busyId === o._id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Serve
                  </button>
                )}
                {(o.status === 'served' || o.status === 'completed') && o.paymentStatus === 'unpaid' && (
                  <button onClick={() => openBill(o)} className="btn-soft">
                    <Banknote size={15} /> Bill
                  </button>
                )}
              </div>
            </div>
          </motion.article>
        ))}
      </main>

      <Sheet open={!!billOrder} onClose={() => { setBillOrder(null); setBill(null); }} title={`Bill · ${bill?.['orderNumber'] || ''}`}>
        {!bill ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl bg-cream-50 px-4 py-3 text-[13px] text-ink-soft">
              {bill.restaurantName || ''} · Table {bill.table?.number || '—'} · {bill.placedAt ? formatTime(bill.placedAt) : ''}
            </div>
            {bill.items.map((it) => (
              <div key={it._id} className="flex justify-between text-[13.5px]">
                <span className="text-ink-soft">{it.quantity}× {it.name}</span>
                <span className="font-semibold text-ink">{npr(it.lineTotal)}</span>
              </div>
            ))}
            <div className="space-y-1.5 border-t border-dashed border-cream-200 pt-3 text-[13px]">
              <div className="flex justify-between text-ink-soft"><span>Subtotal</span><span>{npr(bill.subtotal)}</span></div>
              {bill.discountTotal > 0 && <div className="flex justify-between text-leaf-dark"><span>Discount</span><span>− {npr(bill.discountTotal)}</span></div>}
              <div className="flex justify-between text-ink-soft"><span>Tax</span><span>{npr(bill.tax)}</span></div>
              <div className="flex justify-between text-ink-soft"><span>Service</span><span>{npr(bill.serviceCharge)}</span></div>
              <div className="flex justify-between pt-2 text-[16px] font-bold text-ink"><span>Total due</span><span className="font-display text-clay-700">{npr(bill.grandTotal)}</span></div>
            </div>
            <button onClick={collectCash} disabled={collecting} className="btn-ink w-full">
              {collecting ? <Loader2 size={15} className="animate-spin" /> : <Banknote size={15} />} Collect cash
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }) {
  return (
    <div className="card flex items-center gap-3 p-3.5">
      <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', tone)}><Icon size={17} /></span>
      <div>
        <p className="font-display text-lg font-black leading-none text-ink">{value}</p>
        <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">{label}</p>
      </div>
    </div>
  );
}