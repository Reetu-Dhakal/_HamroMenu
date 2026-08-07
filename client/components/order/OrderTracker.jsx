'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Loader2, Receipt, Clock, CheckCircle2 } from 'lucide-react';
import { ORDER_STEPS, ORDER_STATUS_META, formatCurrency, formatDate } from '@/lib/format';
import { useToast } from '@/components/Toast';

const STEP_INDEX = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  served: 4,
  completed: 5,
};

export default function OrderTracker({ order, restaurantId, table, onDone }) {
  const toast = useToast();
  const current = STEP_INDEX[order.status] ?? 0;
  const cancelled = order.status === 'cancelled';
  const currency = order.currency || 'NPR';

  const remaining = order.estimatedReadyAt ? Math.max(0, new Date(order.estimatedReadyAt).getTime() - Date.now()) : 0;

  useEffect(() => {
    if (order.status === 'ready') toast.success('Your order is ready to be served!');
    if (order.status === 'served') toast.info('Enjoy your meal!');
  }, [order.status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 border-b border-ink-900/5 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href={`/order?r=${restaurantId}`} className="btn-ghost p-2"><ArrowLeft className="h-5 w-5" /></Link>
            <div>
              <p className="font-display text-lg font-semibold leading-tight text-ink-950">Order tracking</p>
              <p className="text-xs text-ink-500">{order.orderNumber}</p>
            </div>
          </div>
          <span className={`badge ${cancelled ? 'bg-red-100 text-red-700' : ORDER_STATUS_META[order.status]?.color}`}>
            {cancelled ? 'Cancelled' : ORDER_STATUS_META[order.status]?.label}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {cancelled ? (
          <div className="card p-8 text-center animate-fade-in">
            <p className="font-display text-2xl font-semibold text-ink-950">Order cancelled</p>
            <p className="mt-2 text-sm text-ink-600">{order.cancelReason || 'Your order was cancelled.'}</p>
            <Link href={`/order?r=${restaurantId}`} className="btn-clay mt-6">Order something else</Link>
          </div>
        ) : (
          <>
            {/* Stepper */}
            <div className="card p-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">Live status</p>
                <span className="flex items-center gap-1.5 text-sm font-medium text-clay-600">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-clay-500" /> Updating live
                </span>
              </div>
              <ol className="mt-6 flex">
                {ORDER_STEPS.slice(0, 5).map((step, i) => {
                  const done = i < current;
                  const active = i === current;
                  return (
                    <li key={step} className={`flex flex-1 flex-col items-center ${i === 0 ? '' : ''}`}>
                      <div className="flex w-full items-center">
                        <div className={`h-1 flex-1 rounded ${i === 0 ? 'opacity-0' : done || active ? 'bg-clay-500' : 'bg-ink-900/10'}`} />
                        <div className="relative">
                          {active && <span className="absolute inset-0 animate-ping rounded-full bg-clay-500/40" />}
                          <div
                            className={`relative flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition ${
                              done ? 'bg-clay-600 text-white' : active ? 'bg-ink-950 text-cream' : 'bg-ink-900/10 text-ink-500'
                            }`}
                          >
                            {done ? <Check className="h-4 w-4" /> : <span>{i + 1}</span>}
                          </div>
                          {active && <span className="absolute inset-0 flex items-center justify-center text-clay-600"><Loader2 className="h-4 w-4 animate-spin" /></span>}
                        </div>
                        <div className={`h-1 flex-1 rounded ${i === ORDER_STEPS.length - 2 ? 'opacity-0' : done ? 'bg-clay-500' : 'bg-ink-900/10'}`} />
                      </div>
                      <span className={`mt-2 text-[11px] font-medium uppercase tracking-wide ${active ? 'text-ink-950' : done ? 'text-clay-600' : 'text-ink-400'}`}>
                        {ORDER_STATUS_META[step].label}
                      </span>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-6 flex items-center gap-3 rounded-xl bg-cream p-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-950 text-cream">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-900">
                    {remaining > 0
                      ? `Estimated ${Math.ceil(remaining / 60000)} min remaining`
                      : order.status === 'ready'
                      ? 'Ready to be served'
                      : order.status === 'served'
                      ? 'Enjoy your meal'
                      : 'Almost there'}
                  </p>
                  <p className="text-xs text-ink-500">Estimated ready: {order.estimatedReadyAt ? formatDate(order.estimatedReadyAt) : '—'}</p>
                </div>
              </div>
            </div>

            {/* Order items */}
            <div className="card mt-4 p-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-semibold text-ink-950">Your order</p>
                <Receipt className="h-5 w-5 text-ink-400" />
              </div>
              <ul className="mt-4 space-y-3">
                {order.items.map((it) => (
                  <li key={it._id} className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                      <Image src={it.imageUrl || '/placeholder-dish.jpg'} alt={it.name} fill className="object-cover" sizes="48px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{it.name}</p>
                      {it.optionsLabel && <p className="text-xs text-ink-500">{it.optionsLabel}</p>}
                    </div>
                    <span className="text-xs text-ink-500">×{it.quantity}</span>
                    <span className="text-sm font-semibold text-ink-800">{formatCurrency(it.lineTotal, currency)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-ink-900/5 pt-3 font-display text-lg font-semibold text-ink-950">
                <span>Total</span>
                <span>{formatCurrency(order.grandTotal, currency)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-500">Payment: {order.paymentStatus === 'paid' ? 'Paid' : `Pay ${order.paymentMethod === 'pay_after_meal' ? 'after meal' : 'now'}`}</p>
            </div>

            {/* Done */}
            {order.status === 'completed' && (
              <div className="card mt-4 flex flex-col items-center p-8 text-center animate-pop">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <p className="mt-4 font-display text-xl font-semibold text-ink-950">All done!</p>
                <p className="mt-1 text-sm text-ink-600">We hope you loved your meal. Rate your experience anytime.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link href={`/order?r=${restaurantId}`} className="btn-outline">Order again</Link>
                  <Link href="/account" className="btn-clay">Go to my profile</Link>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}