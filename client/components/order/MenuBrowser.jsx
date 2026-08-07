'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useRef, useState, useEffect } from 'react';
import { Search, Plus, Minus, ShoppingBag, Leaf, Flame, X, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/components/Toast';

export default function MenuBrowser({ restaurant, menu, cart, onOpenCart, onCheckout, onAdd, activeOrder }) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState(null);
  const [vegOnly, setVegOnly] = useState(false);
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [options, setOptions] = useState({});
  const sectionRefs = useRef({});

  const items = menu.data?.items || [];
  const categories = menu.data?.categories || [];

  const filtered = useMemo(() => {
    let list = items.filter((i) => i.isAvailable !== false);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.description || '').toLowerCase().includes(q) ||
          (i.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    if (vegOnly) list = list.filter((i) => i.isVeg);
    return list;
  }, [items, query, vegOnly]);

  const grouped = useMemo(() => {
    if (!query && !vegOnly) {
      return categories
        .map((c) => ({ ...c, items: items.filter((i) => i.category === c._id) }))
        .filter((c) => c.items.length);
    }
    return [{ _id: 'search', name: query ? `Results for “${query}”` : 'Veg picks', items: filtered, displayOrder: 0 }];
  }, [categories, items, filtered, query, vegOnly]);

  useEffect(() => {
    if (grouped.length && !activeCat) setActiveCat(grouped[0]._id);
  }, [grouped, activeCat]);

  const scrollToCat = (id) => {
    setActiveCat(id);
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onIntersect = (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) setActiveCat(e.target.dataset.cat);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(onIntersect, { rootMargin: '-40% 0px -50% 0px' });
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grouped.length]);

  const openItem = (item) => {
    setSelected(item);
    setQty(1);
    setInstructions('');
    setOptions({});
  };

  const addSelected = async () => {
    const item = selected;
    const missing = (item.options || []).filter((g) => g.required && !options[g.title]);
    if (missing.length) {
      toast.error(`Please choose: ${missing[0].title}`);
      return;
    }
    await onAdd(item, { quantity: qty, options, specialInstructions: instructions });
    toast.success(`${item.name} added`);
    setSelected(null);
  };

  const quickAdd = async (item, e) => {
    e.stopPropagation();
    if ((item.options || []).some((g) => g.required)) return openItem(item);
    await onAdd(item, { quantity: 1 });
    toast.success(`${item.name} added`);
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-ink-900/5 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-2xl items-center gap-3 px-4">
          <Link href="/" className="btn-ghost -ml-2 p-2"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-semibold leading-tight text-ink-950">
              {restaurant?.name || 'Our menu'}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-ink-500">
              <span className={`h-2 w-2 rounded-full ${restaurant?.isOpen ? 'bg-emerald-500' : 'bg-stone-300'}`} />
              {restaurant?.isOpen ? 'Open now' : 'Closed'} · Table {activeOrder?.table ? '' : ''}
              {restaurant?.address?.city ? ` · ${restaurant.address.city}` : ''}
            </p>
          </div>
          <button onClick={onOpenCart} className="relative rounded-full bg-ink-950 p-2.5 text-cream shadow-soft" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {cart.itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-clay-600 px-1 text-[11px] font-bold text-white animate-pop">
                {cart.itemCount}
              </span>
            )}
          </button>
        </div>
        {/* Search */}
        <div className="mx-auto max-w-2xl px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-10 pr-20"
              placeholder="Search dishes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                vegOnly ? 'bg-emerald-600 text-white' : 'bg-ink-900/5 text-ink-600'
              }`}
            >
              <Leaf className="h-3.5 w-3.5" /> Veg
            </button>
          </div>
        </div>
        {/* Category chips */}
        <div className="hide-scrollbar mx-auto max-w-2xl overflow-x-auto px-4 pb-3">
          <div className="flex gap-2">
            {grouped.map((c) => (
              <button
                key={c._id}
                onClick={() => scrollToCat(c._id)}
                className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  activeCat === c._id
                    ? 'border-ink-950 bg-ink-950 text-cream'
                    : 'border-ink-900/10 bg-white text-ink-700'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Items */}
      <main className="mx-auto max-w-2xl px-4 pb-44">
        {menu.loading && <MenuSkeleton />}
        {!menu.loading && grouped.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-display text-xl font-semibold text-ink-900">No dishes found</p>
            <p className="mt-2 text-sm text-ink-600">Try a different search or reset your filters.</p>
          </div>
        )}
        {grouped.map((cat) => (
          <section
            key={cat._id}
            ref={(el) => { sectionRefs.current[cat._id] = el; }}
            data-cat={cat._id}
            className="scroll-mt-44 pt-6"
          >
            <h2 className="flex items-baseline gap-3 font-display text-xl font-semibold text-ink-950">
              {cat.name}
              <span className="text-xs font-sans font-medium text-ink-400">{cat.items.length}</span>
            </h2>
            <div className="mt-4 space-y-3">
              {cat.items.map((item) => (
                <ItemCard
                  key={item._id}
                  item={item}
                  currency={restaurant?.currency}
                  onOpen={() => openItem(item)}
                  onQuickAdd={(e) => quickAdd(item, e)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Bottom cart bar */}
      {cart.itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-4">
          <div className="mx-auto max-w-2xl">
            <button
              onClick={onCheckout}
              className="flex w-full items-center justify-between rounded-2xl bg-ink-950 px-5 py-4 text-cream shadow-lift transition hover:bg-ink-800 animate-slide-up"
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-clay-600 text-sm font-bold">
                  {cart.itemCount}
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold">View cart</p>
                  <p className="text-xs text-ink-300">{cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-lg font-semibold">{formatCurrency(cart.grandTotal, restaurant?.currency)}</p>
                <p className="text-xs text-ink-300">Checkout →</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Item modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/60 backdrop-blur-sm sm:items-center" onClick={() => setSelected(null)}>
          <div
            className="max-h-[92vh] w-full max-w-md animate-slide-up overflow-y-auto rounded-t-3xl bg-surface p-6 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-24 w-24 overflow-hidden rounded-2xl">
                <Image src={selected.imageUrl || '/placeholder-dish.jpg'} alt={selected.name} width={96} height={96} className="object-cover" />
              </div>
              <button className="btn-ghost p-2" onClick={() => setSelected(null)}><X className="h-5 w-5" /></button>
            </div>
            <h3 className="mt-4 font-display text-2xl font-semibold text-ink-950">{selected.name}</h3>
            <p className="mt-1 text-lg font-bold text-clay-600">{formatCurrency(selected.price, restaurant?.currency)}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{selected.description}</p>

            {selected.isVeg && <span className="chip mt-3 text-emerald-700"><Leaf className="h-3.5 w-3.5" /> Vegetarian</span>}
            {selected.spiceLevel === 'hot' && <span className="chip mt-3 ml-2 text-red-600"><Flame className="h-3.5 w-3.5" /> Spicy</span>}

            {(selected.options || []).map((group) => (
              <div key={group.title} className="mt-6">
                <p className="label">
                  {group.title} {group.required && <span className="text-clay-600">· required</span>}
                </p>
                <div className="space-y-2">
                  {group.choices.map((choice) => {
                    const active = options[group.title] === choice.label;
                    return (
                      <button
                        key={choice.label}
                        onClick={() => setOptions({ ...options, [group.title]: choice.label })}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition ${
                          active ? 'border-clay-600 bg-clay-50 text-clay-800' : 'border-ink-900/10 bg-white text-ink-800'
                        }`}
                      >
                        <span>{choice.label}</span>
                        {choice.priceDelta ? <span className="text-ink-500">+{formatCurrency(choice.priceDelta, restaurant?.currency)}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="mt-6">
              <label className="label">Special instructions</label>
              <textarea
                className="input min-h-20"
                placeholder="e.g. no onion, extra spicy…"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-1 rounded-full border border-ink-900/10 bg-white p-1">
                <button className="rounded-full p-2.5 hover:bg-ink-900/5 disabled:opacity-40" disabled={qty <= 1} onClick={() => setQty(qty - 1)} aria-label="Decrease">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-bold">{qty}</span>
                <button className="rounded-full p-2.5 hover:bg-ink-900/5" onClick={() => setQty(qty + 1)} aria-label="Increase">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button className="btn-clay flex-1 ml-4" onClick={addSelected}>
                Add {qty > 1 ? `(${qty})` : ''} · {formatCurrency((selected.price || 0) * qty, restaurant?.currency)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemCard({ item, currency, onOpen, onQuickAdd }) {
  return (
    <button onClick={onOpen} className="group flex w-full items-center gap-4 rounded-2xl border border-ink-900/5 bg-surface p-3.5 text-left shadow-soft transition hover:shadow-lift animate-fade-in">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
        <Image src={item.imageUrl || '/placeholder-dish.jpg'} alt={item.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="80px" />
        {item.isVeg && (
          <span className="absolute left-1 top-1 rounded-md bg-emerald-600 px-1 py-0.5 text-[9px] font-bold uppercase text-white">Veg</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold leading-snug text-ink-950">{item.name}</h3>
          <p className="whitespace-nowrap text-base font-bold text-clay-600">{formatCurrency(item.price, currency)}</p>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-600">{item.description}</p>
        <div className="mt-1.5 flex items-center gap-2">
          {item.isPopular && <span className="badge bg-gold-500/15 text-ink-700">Popular</span>}
          {(item.options || []).some((g) => g.required) && <span className="text-[11px] text-ink-400">Customizable</span>}
        </div>
      </div>
      <button
        onClick={onQuickAdd}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay-600 text-white shadow-sm transition hover:bg-clay-700 hover:shadow-glow"
        aria-label={`Add ${item.name}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </button>
  );
}

function MenuSkeleton() {
  return (
    <div className="space-y-4 pt-6">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-4 rounded-2xl border border-ink-900/5 bg-surface p-3.5">
          <div className="skeleton h-20 w-20 shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}