'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { X, Minus, Plus, Trash2, Ticket, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/components/Toast';

export default function CartSheet({ open, onClose, cart, restaurant, onCheckout }) {
  const toast = useToast();
  const [couponCode, setCouponCode] = useState('');

  if (!open) return null;

  const items = cart.cart?.items || [];
  const currency = restaurant?.currency || 'NPR';

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const res = await cart.applyCoupon(couponCode.trim());
    if (res?.error) toast.error(res.error);
    else toast.success('Coupon applied');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-950/50 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-md animate-slide-up flex-col bg-surface shadow-lift sm:animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-ink-900/5 px-5 py-4">
          <h2 className="font-display text-xl font-semibold text-ink-950">Your cart</h2>
          <button className="btn-ghost p-2" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-clay-50">
                <Ticket className="h-7 w-7 text-clay-500" />
              </div>
              <p className="font-display text-lg font-semibold text-ink-900">Your cart is empty</p>
              <p className="text-sm text-ink-600">Explore the menu and add something delicious.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((it) => (
                <li key={it._id} className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <Image src={it.imageUrl || '/placeholder-dish.jpg'} alt={it.name} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-ink-950">{it.name}</p>
                      <p className="text-sm font-bold text-clay-600">{formatCurrency(it.lineTotal, currency)}</p>
                    </div>
                    {it.optionsLabel && <p className="text-xs text-ink-500">{it.optionsLabel}</p>}
                    {it.specialInstructions && <p className="mt-0.5 line-clamp-1 text-xs italic text-ink-400">“{it.specialInstructions}”</p>}
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-full border border-ink-900/10 bg-white p-0.5">
                        <button className="rounded-full p-1.5 hover:bg-ink-900/5" onClick={() => cart.updateQty(it._id, it.quantity - 1)} aria-label="Decrease">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold">{it.quantity}</span>
                        <button className="rounded-full p-1.5 hover:bg-ink-900/5" onClick={() => cart.updateQty(it._id, it.quantity + 1)} aria-label="Increase">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button className="p-1 text-ink-400 hover:text-red-600" onClick={() => cart.removeItem(it._id)} aria-label="Remove">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-ink-900/5 bg-surface px-5 pb-6 pt-4">
            {!cart.cart?.appliedCoupon?.code && (
              <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                  <Ticket className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    className="input pl-9"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                </div>
                <button className="btn-outline" onClick={applyCoupon}>Apply</button>
              </div>
            )}
            {cart.cart?.appliedCoupon?.code && (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> {cart.cart.appliedCoupon.code}</span>
                <button className="font-semibold text-emerald-700 hover:underline" onClick={() => cart.removeCoupon()}>Remove</button>
              </div>
            )}

            <div className="space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatCurrency(cart.cart.subtotal, currency)} />
              {cart.cart.discountTotal > 0 && (
                <Row label="Discount" value={`− ${formatCurrency(cart.cart.discountTotal, currency)}`} negative />
              )}
              <Row label={`Tax (${Math.round((restaurant?.taxRate || 0) * 100)}%)`} value={formatCurrency(cart.cart.tax, currency)} />
              <Row label={`Service (${Math.round((restaurant?.serviceChargeRate || 0) * 100)}%)`} value={formatCurrency(cart.cart.serviceCharge, currency)} />
              <div className="flex items-center justify-between border-t border-ink-900/5 pt-2.5 font-display text-lg font-semibold text-ink-950">
                <span>Total</span>
                <span>{formatCurrency(cart.cart.grandTotal, currency)}</span>
              </div>
            </div>

            <button className="btn-clay mt-4 w-full" onClick={onCheckout}>
              Proceed to checkout
            </button>
            <p className="mt-2 text-center text-xs text-ink-500">Pay online or after your meal — you decide at the table.</p>
          </footer>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value, negative }) {
  return (
    <div className="flex items-center justify-between text-ink-600">
      <span>{label}</span>
      <span className={negative ? 'text-emerald-600 font-medium' : ''}>{value}</span>
    </div>
  );
}