import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Banknote, Wallet, Zap, ChefHat, Loader2, ShieldCheck, ShoppingBag, WalletCards,
} from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../context/SocketContext';
import { npr } from '../../lib/format';
import { SmartImage, Sheet, EmptyState } from '../../components/ui';

const PAY_METHODS = [
  {
    id: 'pay_after_meal',
    label: 'Pay after your meal',
    sub: 'Settle at the counter with cash, card or POS',
    icon: Banknote,
  },
  {
    id: 'esewa',
    label: 'eSewa',
    sub: 'Pay instantly with your eSewa wallet',
    icon: Wallet,
  },
  {
    id: 'khalti',
    label: 'Khalti',
    sub: 'Khalti wallet, banks & cards',
    icon: WalletCards,
  },
];

export default function CheckoutPage() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const { socket } = useSocket();
  const { session, items, subtotal, discountTotal, tax, serviceCharge, grandTotal, itemCount, clear, busy } = useCart();

  const [method, setMethod] = useState('pay_after_meal');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [pendingDemo, setPendingDemo] = useState(null);

  const orderId = params.get('order');
  const status = params.get('status');

  useEffect(() => {
    if (orderId && status === 'esewa-success') {
      toast.success('eSewa payment received — confirming your order…');
      setParams({}, { replace: true });
    }
  }, [orderId, status, setParams, toast]);

  const canPlace = items?.length > 0 && !placing;

  async function submitOrder() {
    const order = await request(`/api/orders/restaurant/${session.restaurantId}`, {
      method: 'POST',
      body: {
        tableId: session.table?._id || null,
        paymentMethod: method,
        notes,
        customerNote: notes,
        source: 'qr',
      },
    });
    clear();
    return order;
  }

  async function handlePlace() {
    setPlacing(true);
    try {
      if (method === 'pay_after_meal') {
        const order = await submitOrder();
        nav(`/order/${order._id}/track`);
        return;
      }

      if (method === 'esewa') {
        const order = await submitOrder();
        const data = await request(`/api/payments/${order._id}/esewa/start`, { method: 'POST', body: {} });
        if (data.demoMode) {
          setPendingDemo({ type: 'esewa', paymentId: data.paymentId, orderId: order._id });
          setDemoOpen(true);
        } else {
          postEsewaForm(data.fields);
        }
        return;
      }

      if (method === 'khalti') {
        const order = await submitOrder();
        const data = await request(`/api/payments/${order._id}/init`, { method: 'POST', body: { method: 'khalti' } });
        const paymentId = data.payment?._id;
        if (!window.KhaltiCheckout) {
          setPendingDemo({ type: 'khalti', paymentId, orderId: order._id });
          setDemoOpen(true);
        } else {
          openKhaltiWidget(data.payment, order);
        }
        return;
      }
    } catch (e) {
      toast.error(e.message);
      setPlacing(false);
    }
  }

  function postEsewaForm(fields) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
    form.target = '_self';
    Object.entries(fields).forEach(([k, v]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = k;
      input.value = v;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  }

  function openKhaltiWidget(payment, order) {
    const checkout = new window.KhaltiCheckout({
      publicKey: import.meta.env.VITE_KHALTI_PUBLIC_KEY,
      productIdentity: order.orderNumber,
      productName: `HamroMenu order ${order.orderNumber}`,
      productUrl: window.location.origin,
      amount: Math.round(payment.amount * 100),
      eventHandler: {
        onSuccess(payload) {
          request(`/api/payments/${payment._id}/verify/khalti`, { method: 'POST', body: { token: payload.token } })
            .then(() => {
              toast.success('Payment received! Your order is confirmed.');
              nav(`/order/${order._id}/track`);
            })
            .catch(() => toast.error('Khalti verification failed'));
        },
        onError(err) {
          toast.error(err?.message || 'Khalti payment failed — you can retry or pay after your meal');
        },
        onClose() {},
      },
    });
    checkout.show();
  }

  async function completeDemo() {
    const d = pendingDemo;
    setDemoOpen(false);
    setPlacing(false);
    try {
      if (d.type === 'esewa') {
        await request(`/api/payments/${d.paymentId}/verify/esewa`, {
          method: 'POST',
          body: { refId: 'demo', transactionId: 'demo', oid: '1', amt: String(grandTotal), signature: 'demo' },
        });
      } else {
        await request(`/api/payments/${d.paymentId}/verify/khalti`, { method: 'POST', body: { token: 'demo-token' } });
      }
      toast.success('Payment received — order confirmed');
      nav(`/order/${d.orderId}/track`);
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (!session || !items?.length) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <EmptyState
          icon={ShoppingBag}
          title="Nothing to checkout"
          copy="Your cart is empty. Add some dishes first."
          action={<Link to="/" className="btn-primary">Browse menus</Link>}
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-cream-50 pb-32">
      <Helmet><title>Checkout · HamroMenu</title></Helmet>
      <header className="sticky top-0 z-30 border-b border-cream-200 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <button onClick={() => nav(-1)} className="btn-ghost !px-3" aria-label="Back"><ArrowLeft size={18} /></button>
          <h1 className="font-display text-lg font-bold text-ink">Checkout</h1>
          <span className="ml-auto rounded-full bg-clay-50 px-3 py-1 text-[11px] font-bold text-clay-700">
            Table {session?.table?.number || '—'}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-4 sm:px-6">
        <section className="card p-5">
          <h2 className="mb-3 font-display text-[15px] font-bold text-ink">Your order</h2>
          <div className="divide-y divide-cream-100">
            {items.map((it) => (
              <div key={it._id} className="flex items-center gap-3 py-2.5">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                  <SmartImage src={it.imageUrl} alt={it.name} ratio="1/1" rounded="rounded-lg" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-ink">
                    {it.quantity}× {it.name}
                  </p>
                  {it.optionsLabel && <p className="truncate text-[11.5px] text-ink-faint">{it.optionsLabel}</p>}
                </div>
                <span className="text-[13.5px] font-semibold text-ink">{npr(it.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1.5 border-t border-dashed border-cream-200 pt-3 text-[13px]">
            <div className="flex justify-between text-ink-soft"><span>Subtotal</span><span>{npr(subtotal)}</span></div>
            {discountTotal > 0 && <div className="flex justify-between text-leaf-dark"><span>Discount</span><span>− {npr(discountTotal)}</span></div>}
            <div className="flex justify-between text-ink-soft"><span>Tax & service</span><span>{npr(tax + serviceCharge)}</span></div>
            <div className="flex justify-between pt-1 text-[15px] font-bold text-ink"><span>Total</span><span className="font-display text-clay-700">{npr(grandTotal)}</span></div>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-3 font-display text-[15px] font-bold text-ink">How would you like to pay?</h2>
          <div className="space-y-2.5">
            {PAY_METHODS.map((m) => {
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left transition-all ${active ? 'border-clay-600 bg-clay-50' : 'border-cream-200 bg-white hover:border-clay-300'}`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-clay-600 text-white' : 'bg-cream-100 text-ink-soft'}`}>
                    <m.icon size={18} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[14px] font-bold text-ink">{m.label}</span>
                    <span className="block text-[12px] text-ink-faint">{m.sub}</span>
                  </span>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${active ? 'border-clay-600' : 'border-cream-300'}`}>
                    {active && <span className="h-2.5 w-2.5 rounded-full bg-clay-600" />}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <label className="field-label">Notes for the kitchen (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="e.g. Extra napkins, no onion, celebrating a birthday…"
              className="input resize-none"
            />
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-paper/95 px-4 py-3.5 backdrop-blur safe-bottom">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">To pay</p>
              <p className="font-display text-lg font-bold text-ink">{npr(grandTotal)}</p>
            </div>
            <button onClick={handlePlace} disabled={!canPlace} className="btn-primary flex-1 text-[15px]">
              {placing ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
              {placing ? 'Placing order…' : `Place order · ${npr(grandTotal)}`}
            </button>
          </div>
        </div>
      </main>

      {demoOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 p-5 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm rounded-3xl bg-paper p-6 text-center shadow-sheet">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-clay-50 text-clay-600">
              <ChefHat size={26} />
            </div>
            <h3 className="font-display text-lg font-bold text-ink">Sandbox payment mode</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">
              {pendingDemo?.type === 'esewa'
                ? 'No eSewa sandbox credentials are configured, so this demo completes the eSewa flow instantly. Real merchants sign the gateway form and return here.'
                : 'No Khalti credentials are configured. This demo completes the wallet flow instantly.'}
            </p>
            <div className="mt-5 flex gap-2.5">
              <button onClick={() => { setDemoOpen(false); setPlacing(false); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={completeDemo} className="btn-primary flex-1">Complete demo payment</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}