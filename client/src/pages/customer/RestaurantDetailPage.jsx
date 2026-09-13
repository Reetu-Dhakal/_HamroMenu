import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Search, X, UtensilsCrossed, Leaf, ShoppingBag } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { request } from '../../lib/apiClient';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { npr, cx } from '../../lib/format';
import { SmartImage, EmptyState } from '../../components/ui';
import MenuHeader from '../../components/menu/MenuHeader';
import CategoryChips from '../../components/menu/CategoryChips';
import MenuItemCard from '../../components/menu/MenuItemCard';
import ItemSheet from '../../components/menu/ItemSheet';
import RecommendationRail from '../../components/menu/RecommendationRail';

export default function RestaurantDetailPage() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { setSession, addItem, itemCount, grandTotal, items } = useCart();
  const { user } = useAuth();
  const toast = useToast();

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState(null);
  const [recommended, setRecommended] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [rest, menuData, recData] = await Promise.all([
          request(`/api/restaurants/${restaurantId}`),
          request(`/api/restaurants/${restaurantId}/menu?includeInactive=false`),
          request(`/api/restaurants/${restaurantId}/recommendations?limit=8`).catch(() => null),
        ]);
        if (!alive) return;
        setRestaurant(rest);
        setMenu(menuData);
        setRecommended(recData);
        setSession({ restaurantId, table: null, restaurant: rest });
      } catch (e) {
        if (alive) setError(e.message || 'Could not load restaurant');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const filtered = useMemo(() => {
    if (!menu) return { items: [], categories: [] };
    const q = search.trim().toLowerCase();
    const items = (menu.items || []).filter((it) => {
      if (!it.isAvailable) return false;
      if (activeCategory && it.category?.toString() !== activeCategory) return false;
      if (vegOnly && !it.isVeg) return false;
      if (q && !`${it.name} ${it.description || ''} ${(it.tags || []).join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const categories = (menu.categories || []).filter((c) => items.some((it) => it.category?.toString() === c._id?.toString()));
    return { items, categories };
  }, [menu, search, activeCategory, vegOnly]);

  function quickAdd(item) {
    if ((item.options || []).length > 0) {
      setSelectedItem(item);
      return;
    }
    addItem(item, { quantity: 1 });
    toast.success(`${item.name} added to your order`);
  }

  function handleAdd(item, opts) {
    addItem(item, opts);
    toast.success(`${item.name} added to your order`);
  }

  const cartVisible = (items || []).length > 0;
  const isHybrid = recommended?.type === 'hybrid' || recommended?.type === 'personalized';

  if (loading && !restaurant) {
    return (
      <div className="space-y-3 p-4 sm:p-6">
        <div className="skeleton h-52 sm:h-64" />
        <div className="skeleton h-10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <EmptyState icon={UtensilsCrossed} title="Restaurant unavailable" copy={error} action={<Link to="/restaurants" className="btn-secondary">Browse restaurants</Link>} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-cream-50 pb-28">
      <Helmet><title>{restaurant ? `${restaurant.name} · HamroMenu` : 'Restaurant · HamroMenu'}</title></Helmet>
      {restaurant && (
        <>
          <MenuHeader restaurant={restaurant} table={null} collapsed={false} />
          <div className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3 sm:px-6">
              <div className="relative flex-1">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search dishes…" className="w-full rounded-full border border-cream-200 bg-paper py-2.5 pl-11 pr-10 text-sm shadow-card" />
                {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-label="Clear search"><X size={15} /></button>}
              </div>
            </div>
            <CategoryChips categories={filtered.categories} active={activeCategory} onSelect={setActiveCategory} vegOnly={vegOnly} onVegOnly={setVegOnly} resultCount={menu?.items?.length} />
          </div>
          <main className="mx-auto max-w-5xl px-4 sm:px-6">
            <RecommendationRail
              title={isHybrid ? 'Recommended for you' : 'Popular with diners'}
              subtitle={isHybrid ? `Picked from dishes you've loved before` : 'What regulars order the most'}
              items={(recommended?.items || []).map((it, i) => ({ ...it, isFirst: i === 0 }))}
              onSelect={setSelectedItem}
              personalized={isHybrid}
            />
            {filtered.categories.map((cat) => (
              <section key={cat._id} className="scroll-mt-28 pb-2 pt-6">
                <h2 className="font-display text-lg font-bold text-ink">{cat.name}</h2>
                {cat.description && <p className="text-xs text-ink-faint">{cat.description}</p>}
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {filtered.items.filter((it) => it.category?.toString() === cat._id.toString()).map((it) => (
                    <MenuItemCard key={it._id} item={it} onSelect={setSelectedItem} onQuickAdd={quickAdd} />
                  ))}
                </div>
              </section>
            ))}
            {!filtered.categories.length && (
              <EmptyState icon={vegOnly ? Leaf : UtensilsCrossed} title="No dishes here yet" copy="Try different filters." />
            )}
          </main>
          <AnimatePresence>
            {cartVisible && (
              <motion.div initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 90, opacity: 0 }} className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
                <button onClick={() => navigate('/cart')} className="flex w-full items-center gap-4 rounded-2xl bg-ink px-5 py-3.5 text-cream-50 shadow-sheet">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay-600 text-white"><ShoppingBag size={17} /></span>
                  <span className="flex-1 text-left">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-cream-50/60">Your order</span>
                    <span className="block text-[15px] font-bold">View cart · {npr(grandTotal)} ({itemCount})</span>
                  </span>
                  <span className={cx('rounded-full bg-saffron px-4 py-2 text-[13px] font-bold text-ink')}>View</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <ItemSheet item={selectedItem} open={Boolean(selectedItem)} onClose={() => setSelectedItem(null)} onAdd={handleAdd} />
        </>
      )}
    </div>
  );
}
