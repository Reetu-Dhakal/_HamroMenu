import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Clock, Star, Receipt, CheckCircle2, UtensilsCrossed, BellRing, RefreshCw,
} from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { npr, formatTime } from '../../lib/format';
import OrderTimeline from '../../components/order/OrderTimeline';
import { SmartImage, StatusPill, PageLoader, EmptyState } from '../../components/ui';

function tableLabel(order) {
  const t = order?.table;
  if (!t) return '—';
  if (typeof t === 'object' && t.number) return `Table ${t.number}`;
  return '—';
}

function taxRateOf(order) {
  if (!order?.subtotal) return 13;
  return Math.round((order.tax / order.subtotal) * 100);
}

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { socket, join } = useSocket();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  const prevStatus = useRef('');

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await request(`/api/orders/${orderId}`);
      setOrder(data);
      setLoading(false);
      join(data.restaurant, user?._id || null);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }, [orderId, user?._id, join]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await request(`/api/orders/${orderId}`);
        if (!alive) return;
        setOrder(data);
        join(data.restaurant?._id || data.restaurant, user?._id || null);
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, [orderId, user?._id, join]);

  useEffect(() => {
    if (!socket || !orderId) return;
    const onStatus = (payload) => {
      if (payload.orderId !== orderId) return;
      load();
    };
    const onItemStatus = (payload) => {
      if (payload.orderId !== orderId) return;
      load();
    };
    socket.on('order:status', onStatus);
    socket.on('order:item-status', onItemStatus);
    return () => {
      socket.off('order:status', onStatus);
      socket.off('order:item-status', onItemStatus);
    };
  }, [socket, orderId, load]);

  useEffect(() => {
    if (!order) return;
    if (prevStatus.current !== order.status) {
      const prev = prevStatus.current;
      prevStatus.current = order.status;
      if (prev && order.status === 'ready') toast.success(`${order.orderNumber} is ready — enjoy!`, undefined);
      if (prev && order.status === 'served') toast.success('Food served — bon appétit!');
      if (prev && order.status === 'confirmed') toast.success('Order confirmed by the restaurant');
      if (prev && order.status === 'preparing') toast.info('The kitchen has started cooking');
    }
  }, [order, toast]);

  const etaMinutes = useMemo(() => {
    if (!order?.estimatedReadyAt) return null;
    return Math.max(0, Math.ceil((new Date(order.estimatedReadyAt).getTime() - now) / 60000));
  }, [order, now]);

  if (loading) return <PageLoader label="Loading your order…" />;

  if (error && !order) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <EmptyState
          icon={Receipt}
          title="Order not found"
          copy={user ? error : 'Sign in to view your order.'}
          action={
            user ? (
              <Link to="/order-history" className="btn-primary">Order history</Link>
            ) : (
              <Link to="/login" className="btn-primary">Sign in</Link>
            )
          }
        />
      </div>
    );
  }

  const done = ['served', 'completed', 'cancelled'].includes(order.status);

  return (
    <div className="min-h-dvh bg-cream-50 pb-16">
      <Helmet><title>Order {order?.orderNumber} · Track · HamroMenu</title></Helmet>
      <header className="sticky top-0 z-30 border-b border-cream-200 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
          <button onClick={() => nav(-1)} className="btn-ghost !px-3" aria-label="Back"><ArrowLeft size={18} /></button>
          <div className="flex-1">
<h1 className="font-display text-lg font-bold text-ink">Order {order?.orderNumber}</h1>
            <p className="text-[12px] font-medium text-ink-faint">
              Placed {order?.placedAt ? formatTime(order.placedAt) : ''} · {tableLabel(order)}
            </p>
          </div>
          <StatusPill status={order.status} />
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5 sm:px-6">
        {!done && (
          <div className="card overflow-hidden">
            <div className="relative px-5 pb-5 pt-6">
              <OrderTimeline status={order.status} cancelledAt={order.cancelledAt} />
            </div>
            <div className="flex items-center justify-between border-t border-cream-100 bg-cream-50 px-5 py-3">
              <span className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-soft">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf" />
                </span>
                Updating live
              </span>
              {etaMinutes != null && (
                <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-ink-soft">
                  <Clock size={13} className="text-clay-600" />
                  {etaMinutes === 0 ? 'Any moment now' : `≈ ${etaMinutes} min left`}
                </span>
              )}
            </div>
          </div>
        )}

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-bold text-ink">Items</h2>
            <span className="text-[12px] font-semibold text-ink-faint">{order.items?.length} item{order.items?.length > 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-cream-100">
            {order.items.map((it) => (
              <div key={it._id} className="flex items-start gap-3 py-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                  <SmartImage src={it.imageUrl} alt={it.name} ratio="1/1" rounded="rounded-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[14px] font-semibold text-ink">{it.quantity}× {it.name}</p>
                    <span className="text-[13px] font-semibold text-ink">{npr(it.lineTotal)}</span>
                  </div>
                  {it.optionsLabel && <p className="text-[12px] text-ink-faint">{it.optionsLabel}</p>}
                  {it.specialInstructions && <p className="mt-0.5 text-[12px] italic text-clay-700">“{it.specialInstructions}”</p>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 space-y-1.5 border-t border-dashed border-cream-200 pt-3 text-[13px]">
            <div className="flex justify-between text-ink-soft"><span>Subtotal</span><span>{npr(order.subtotal)}</span></div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between text-leaf-dark"><span>{order.couponCode ? `${order.couponCode} discount` : 'Discount'}</span><span>− {npr(order.discountTotal)}</span></div>
            )}
            <div className="flex justify-between text-ink-soft"><span>Tax ({taxRateOf(order)}%)</span><span>{npr(order.tax)}</span></div>
            <div className="flex justify-between text-ink-soft"><span>Service charge</span><span>{npr(order.serviceCharge)}</span></div>
            <div className="flex justify-between pt-1.5 text-[15px] font-bold text-ink">
              <span>Total</span>
              <span className="font-display text-clay-700">{npr(order.grandTotal)}</span>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-between rounded-2xl bg-paper px-5 py-4 shadow-card">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Payment</p>
            <p className="mt-0.5 text-[14px] font-bold text-ink">
              {order.paymentStatus === 'paid' ? 'Paid' : 'Due at the table'}
              <span className="ml-2 text-[11px] font-semibold text-ink-faint capitalize">{order.paymentMethod?.replace(/_/g, ' ')}</span>
            </p>
          </div>
          {order.paymentStatus === 'paid' ? (
            <CheckCircle2 size={22} className="text-leaf" />
          ) : (
            <BellRing size={20} className="text-saffron-deep" />
          )}
        </section>

        {order.status === 'completed' && (
          <div className="card p-5 text-center">
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-leaf/15 text-leaf">
              <UtensilsCrossed size={22} />
            </motion.div>
            <h3 className="font-display text-lg font-bold text-ink">Hope it was delicious!</h3>
            <p className="mx-auto mt-1 max-w-xs text-[13px] text-ink-soft">Help other diners pick their favourites — rate the dishes you ordered.</p>
            <div className="mt-4 flex justify-center gap-2.5">
              <Link to={`/reviews?order=${order._id}`} className="btn-primary">
                <Star size={16} className="fill-saffron text-saffron" /> Rate your food
              </Link>
              <button onClick={() => nav(`/menu/table/${order.table?.number || '1'}?r=${order.restaurant}`)} className="btn-ghost">
                <RefreshCw size={15} /> Order again
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}