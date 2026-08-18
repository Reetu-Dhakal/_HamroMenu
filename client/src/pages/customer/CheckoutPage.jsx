import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft, Banknote, Wallet, ChefHat, Loader2, ShieldCheck, ShoppingBag, WalletCards,
} from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { npr } from '../../lib/format';
import { SmartImage, Sheet, EmptyState } from '../../components/ui';

export default function CheckoutPage() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const { session, items, subtotal, discountTotal, tax, serviceCharge, grandTotal, clear } = useCart();

  const [method, setMethod] = useState('pay_after_meal');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [payments, setPayments] = useState(null);

  const orderId = params.get('order');
  const status = params.get('status');

  useEffect(() => {
    request('/api/payments/availability')
      .then(setPayments)
      .catch(() => setPayments({ esewa: { enabled: false }, khalti: { enabled: false } }));
  }, []);

  useEffect(() => {
    if (orderId && status === 'esewa-success') {
      toast.success('eSewa payment received — confirming your order…');
      setParams({}, { replace: true });
    }
  }, [orderId, status, setParams, toast]);

  const walletOn = (id) => id === 'esewa' ? payments?.esewa?.enabled === true : payments?.khalti?.enabled === true;

  let payMethods = [
    {
      id: 'pay_after_meal',
      label: 'Pay after your meal',
      sub: 'Settle at the counter with cash, card or POS',
      icon: Banknote,
    },
    {
      id: 'esewa',
      label: 'eSewa',
      sub: walletOn('esewa')
        ? `Pay instantly with eSewa (${payments?.esewa?.environment === 'production' ? 'live' : 'sandbox'})`
        : 'Not enabled by this restaurant yet · pay at the counter',
      icon: Wallet,
      enabled: walletOn('esewa'),
    },
    {
      id: 'khalti',
      label: 'Khalti',
      sub: walletOn('khalti')
        ? 'Khalti wallet, banks & cards'
        : 'Not enabled by this restaurant yet · pay at the counter',
      icon: WalletCards,
      enabled: walletOn('khalti'),
    },
  ];

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

  function fallbackToCounter(order, walletName) {
    toast.info(`${walletName} isn't configured for this restaurant — you can pay at the counter after your meal.`);
    nav(`/order/${order._id}/track`);
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
          fallbackToCounter(order, 'eSewa');
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
          fallbackToCounter(order, 'Khalti');
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
            {payMethods.map((m) => {
              const active = method === m.id;
              const disabled = m.enabled === false;
              return (
                <button
                  key={m.id}
                  onClick={() => !disabled && setMethod(m.id)}
                  disabled={disabled}
                  aria-disabled={disabled}
                  className={`flex w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left transition-all ${active ? 'border-clay-600 bg-clay-50' : 'border-cream-200 bg-white hover:border-clay-300'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-clay-600 text-white' : 'bg-cream-100 text-ink-soft'}`}>
                    <m.icon size={18} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[14px] font-bold text-ink">{m.label}</span>
                    <span className="block text-[12px] text-ink-faint">{m.sub}</span>
                  </span>
                  {!disabled && (
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${active ? 'border-clay-600' : 'border-cream-300'}`}>
                      {active && <span className="h-2.5 w-2.5 rounded-full bg-clay-600" />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {payMethods.filter((m) => m.enabled === false).length > 0 && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-cream-100 px-3.5 py-2.5 text-[12px] leading-relaxed text-ink-soft">
              <ChefHat size={14} className="mt-0.5 shrink-0 text-ink-faint" />
              Online wallets appear once this restaurant enables them — until then, settle at the counter after your meal.
            </p>
          )}

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
    </div>
  );
}