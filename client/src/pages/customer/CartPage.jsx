import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ShoppingBag, Trash2, Sparkles, Tag } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { npr } from '../../lib/format';
import { SmartImage, EmptyState, QuantityStepper } from '../../components/ui';

export default function CartPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const {
    session, items, itemCount, subtotal, discountTotal, tax, serviceCharge, grandTotal,
    updateItem, removeItem, clear, mode, applyCoupon, removeCoupon, appliedCoupon, addItem, busy,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [companions, setCompanions] = useState([]);
  const [loadingCompanions, setLoadingCompanions] = useState(false);

  useEffect(() => {
    if (!session?.restaurantId || !items?.length || mode !== 'local') return;
    let alive = true;
    setLoadingCompanions(true);
    const ids = items.map((i) => i.menuItem).join(',');
    request(`/api/restaurants/${session.restaurantId}/recommendations/companions?items=${ids}&limit=5`)
      .then((d) => alive && setCompanions(d.items || []))
      .catch(() => {})
      .finally(() => alive && setLoadingCompanions(false));
    return () => (alive = false);
  }, [session?.restaurantId, items, mode]);

  const checkout = () => {
    if (!user) {
      nav('/login', { state: { from: '/checkout' } });
      return;
    }
    nav('/checkout');
  };

  function handleCoupon() {
    if (!couponCode.trim()) return;
    applyCoupon(couponCode.trim())
      .then((res) => {
        if (res?.guest) toast.info('Sign in to apply a coupon');
        else toast.success('Coupon applied 🎉');
        setCouponCode('');
      })
      .catch((e) => toast.error(e.message));
  }

  function quickAddItem(it) {
    if ((it.options || []).length) {
      toast.info('Customize this dish from the menu');
      return;
    }
    addItem(it, { quantity: 1 });
    toast.success(`${it.name} added to your order`);
  }

  if (!session) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          copy="Scan the QR code on your restaurant table to see the menu and start your order."
          action={
            <Link to="/" className="btn-primary">
              Find a restaurant
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-cream-50 pb-32">
      <Helmet><title>Your order · HamroMenu</title></Helmet>
      <header className="sticky top-0 z-30 border-b border-cream-200 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
          <button onClick={() => nav(-1)} className="btn-ghost !px-3" aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold leading-tight text-ink">Your order</h1>
            <p className="text-[12px] font-medium text-ink-faint">
              {session?.restaurant?.name} · Table {session?.table?.number || '—'}
            </p>
          </div>
          <button onClick={() => clear()} className="btn-ghost !px-3 text-red-600" aria-label="Clear cart">
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        {!items?.length ? (
          <EmptyState
            icon={ShoppingBag}
            title="Nothing here yet"
            copy="Hungry? Head back to the menu and pick something delicious."
            action={
              <Link to={`/menu/table/${session?.table?.number}?r=${session?.restaurantId}`} className="btn-primary">
                Browse the menu
              </Link>
            }
          />
        ) : (
          <>
            <div className="divide-y divide-cream-100">
              <AnimatePresence initial={false}>
                {items.map((it) => (
                  <motion.div
                    key={it._id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    className="flex gap-3 py-4"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                      <SmartImage src={it.imageUrl} alt={it.name} ratio="1/1" rounded="rounded-xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-[14.5px] font-semibold text-ink">{it.name}</h3>
                          {it.optionsLabel && <p className="truncate text-[12px] text-ink-faint">{it.optionsLabel}</p>}
                          {it.specialInstructions && (
                            <p className="mt-0.5 line-clamp-1 text-[11.5px] italic text-clay-700">“{it.specialInstructions}”</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(it._id)}
                          className="text-ink-faint transition-colors hover:text-red-500"
                          aria-label={`Remove ${it.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <QuantityStepper small quantity={it.quantity} onChange={(q) => updateItem(it._id, { quantity: q })} />
                        <span className="font-display text-[15px] font-bold text-ink">{npr(it.lineTotal)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Coupon */}
              <div className="py-4">
                {mode === 'server' ? (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Coupon code, e.g. WELCOME10"
                        className="input pl-10"
                      />
                    </div>
                    <button onClick={handleCoupon} className="btn-ghost" disabled={busy}>
                      {busy ? '…' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-[12px] font-medium text-ink-faint">
                    Sign in at checkout to apply coupons like <span className="font-bold text-clay-700">WELCOME10</span>
                  </p>
                )}
                {appliedCoupon && (
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-leaf/10 px-4 py-2.5">
                    <span className="flex items-center gap-2 text-[13px] font-bold text-leaf-dark">
                      <Tag size={14} /> {appliedCoupon.code} applied
                    </span>
                    <button onClick={removeCoupon} className="text-[12px] font-semibold text-leaf-dark underline">
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Frequently ordered together */}
              {(companions.length > 0 || loadingCompanions) && (
                <section className="py-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles size={14} className="text-saffron-deep" />
                    <h2 className="font-display text-[15px] font-bold text-ink">Frequently ordered together</h2>
                  </div>
                  <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
                    {loadingCompanions
                      ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-40 w-32 shrink-0" />)
                      : companions.map((it) => (
                          <div key={it._id} className="w-32 shrink-0">
                            <button onClick={() => quickAddItem(it)} className="relative w-full text-left">
                              <SmartImage src={it.imageUrl} alt={it.name} ratio="4/3" />
                              <span className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-clay-600 text-white shadow-float">
                                +
                              </span>
                            </button>
                            <h3 className="mt-1.5 line-clamp-1 text-[12.5px] font-semibold text-ink">{it.name}</h3>
                            <p className="text-[12px] font-bold text-clay-700">{npr(it.price)}</p>
                          </div>
                        ))}
                  </div>
                </section>
              )}

              {/* Bill */}
              <div className="rounded-2xl bg-paper p-5 shadow-card">
                <div className="space-y-2.5 text-[14px]">
                  <Row label={`Subtotal (${itemCount} items)`} value={npr(subtotal)} />
                  {subtotal > 0 && (
                    <>
                      <Row label="Tax (13%)" value={npr(tax)} />
                      <Row label="Service charge (10%)" value={npr(serviceCharge)} />
                    </>
                  )}
                  {discountTotal > 0 && <Row label="Discount" value={`− ${npr(discountTotal)}`} accent="text-leaf-dark" />}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-dashed border-cream-200 pt-4">
                  <span className="text-[15px] font-bold text-ink">Total</span>
                  <span className="font-display text-xl font-bold text-clay-700">{npr(grandTotal)}</span>
                </div>
              </div>
            </>
          )}
      </main>

      {items?.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-paper/95 px-4 py-3.5 backdrop-blur safe-bottom">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Total</p>
              <p className="font-display text-lg font-bold text-ink">{npr(grandTotal)}</p>
            </div>
            <button onClick={checkout} className="btn-primary flex-1 text-[15px]">
              {user ? 'Checkout' : 'Sign in to order'}
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-soft">{label}</span>
      <span className={`font-semibold ${accent ? 'text-leaf-dark' : 'text-ink'}`}>{value}</span>
    </div>
  );
}