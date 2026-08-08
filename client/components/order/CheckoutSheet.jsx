'use client';

import Link from 'next/link';
import { useState } from 'react';
import { X, CreditCard, Banknote, Wallet, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/components/Toast';

const PAYMENT_METHODS = [
  { key: 'pay_after_meal', label: 'Pay after meal', desc: 'Settle at the counter when you leave', icon: Clock },
  { key: 'esewa', label: 'eSewa', desc: 'Pay instantly with eSewa wallet', icon: Wallet },
  { key: 'khalti', label: 'Khalti', desc: 'Pay with your Khalti wallet', icon: CreditCard },
  { key: 'cash', label: 'Cash', desc: 'Cash at the table or counter', icon: Banknote },
];

export default function CheckoutSheet({ open, onClose, cart, restaurant, tableId, user, onPlaced, onPlace }) {
  const toast = useToast();
  const [method, setMethod] = useState('pay_after_meal');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  if (!open) return null;

  const currency = restaurant?.currency || 'NPR';

  const place = async () => {
    if (!user) {
      toast.error('Please sign in to place your order');
      return;
    }
    setPlacing(true);
    try {
      const order = await onPlace({ paymentMethod: method, tableId, notes, customerNote: notes });
      if (order) {
        toast.success(`Order ${order.orderNumber} placed`);
        onPlaced(order._id);
      }
    } catch (err) {
      toast.error(err.message || 'Could not place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-950/50 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-md animate-slide-up flex-col bg-surface shadow-lift sm:animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-ink-900/5 px-5 py-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-950">Checkout</h2>
            <p className="text-xs text-ink-500">{restaurant?.name}</p>
          </div>
          <button className="btn-ghost p-2" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Summary */}
          <div className="rounded-2xl border border-ink-900/5 bg-cream p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-600">Order summary</p>
            <ul className="space-y-2.5">
              {(cart.cart?.items || []).map((it) => (
                <li key={it._id} className="flex items-center gap-3 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-950 text-xs font-bold text-cream">{it.quantity}</span>
                  <span className="flex-1 truncate text-ink-800">{it.name}</span>
                  <span className="font-medium text-ink-700">{formatCurrency(it.lineTotal, currency)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-ink-900/5 pt-3 text-sm">
              <div className="flex justify-between text-ink-600"><span>Subtotal</span><span>{formatCurrency(cart.cart?.subtotal, currency)}</span></div>
              {cart.cart?.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Discount</span><span>− {formatCurrency(cart.cart.discountTotal, currency)}</span></div>
              )}
              <div className="flex justify-between text-ink-600"><span>Tax & service</span><span>{formatCurrency((cart.cart?.tax || 0) + (cart.cart?.serviceCharge || 0), currency)}</span></div>
              <div className="flex justify-between pt-1 font-display text-lg font-semibold text-ink-950"><span>Total</span><span>{formatCurrency(cart.cart?.grandTotal, currency)}</span></div>
            </div>
          </div>

          {/* Payment method */}
          <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-wide text-ink-600">Payment method</p>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((m) => {
              const Icon = m.icon;
              const active = method === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                    active ? 'border-clay-600 bg-clay-50' : 'border-ink-900/10 bg-white hover:border-ink-900/20'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-clay-600 text-white' : 'bg-ink-900/5 text-ink-600'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900">{m.label}</p>
                    <p className="text-xs text-ink-500">{m.desc}</p>
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 ${active ? 'border-clay-600 bg-clay-600' : 'border-ink-300'}`}>
                    {active && <div className="m-auto mt-[1px] h-2 w-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Notes */}
          <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-wide text-ink-600">Notes for the kitchen</p>
          <textarea
            className="input min-h-20"
            placeholder="Allergies, preferences, anything we should know…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* Auth gate */}
          {!user && (
            <div className="mt-6 rounded-2xl border border-clay-200 bg-clay-50 p-4 text-sm text-clay-800">
              <p className="font-semibold">One last step — sign in to place your order.</p>
              <p className="mt-1 text-xs">Save favorites, track live and revisit your order history.</p>
              <div className="mt-3 flex gap-2">
                <Link href="/login" className="btn-clay flex-1">Sign in</Link>
                <Link href="/register" className="btn-outline flex-1">Create account</Link>
              </div>
            </div>
          )}
        </div>

        <footer className="border-t border-ink-900/5 bg-surface px-5 pb-6 pt-4">
          <button className="btn-clay w-full" onClick={place} disabled={placing || !user}>
            {placing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Placing order…</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" /> Place order · {formatCurrency(cart.cart?.grandTotal, currency)}</>
            )}
          </button>
        </footer>
      </aside>
    </div>
  );
}