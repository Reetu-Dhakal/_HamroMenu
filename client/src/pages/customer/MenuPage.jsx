import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, X, UtensilsCrossed, Leaf } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { request } from '../../lib/apiClient';
import { useCart } from '../../context/CartContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { npr, cx } from '../../lib/format';
import { SmartImage, Spinner, EmptyState } from '../../components/ui';
import MenuHeader from '../../components/menu/MenuHeader';
import CategoryChips from '../../components/menu/CategoryChips';
import MenuItemCard from '../../components/menu/MenuItemCard';
import ItemSheet from '../../components/menu/ItemSheet';
import RecommendationRail from '../../components/menu/RecommendationRail';

export default function MenuPage() {
  const { tableNumber } = useParams();
  const [params] = useSearchParams();
  const restaurantId = params.get('r');
  const navigate = useNavigate();
  const { setSession, addItem, itemCount, grandTotal, items } = useCart();
  const { join } = useSocket();
  const { user } = useAuth();
  const toast = useToast();

  const [restaurant, setRestaurant] = useState(null);
  const [table, setTable] = useState(null);
  const [menu, setMenu] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [recommended, setRecommended] = useState(null);
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        let rid = restaurantId;
        let rest = null;
        if (rid) {
          rest = await request(`/api/restaurants/${rid}`);
        } else {
          rest = await request('/api/restaurants/by-slug/himalayan-flavors');
          rid = rest._id;
        }

        const t = await request(`/api/restaurants/${rid}/tables/number/${tableNumber}`);
        if (!alive) return;
        setRestaurant(rest);
        setTable(t.table);
        setSession({ restaurantId: rid, table: t.table, restaurant: rest });
        join(rid, user?._id || null);

        const [menuData, recData, reviewData] = await Promise.all([
          request(`/api/restaurants/${rid}/menu?includeInactive=false`),
          request(`/api/restaurants/${rid}/recommendations?limit=8`).catch(() => null),
          request(`/api/reviews/restaurant/${rid}`).catch(() => []),
        ]);
        if (!alive) return;
        setMenu(menuData);
        setRecommended(recData);
        const approved = reviewData || [];
        const avg = approved.length ? approved.reduce((s, r) => s + r.rating, 0) / approved.length : null;
        setMetadata({ reviewCount: approved.length || 0, rating: avg, recType: recData?.type });
        setReviews(approved);

        // Fetch Apriori "frequently ordered together" rules if plan allows
        if (recData && recData.type !== 'popular-fallback') {
          try {
            const aprioriData = await request(`/api/restaurants/${rid}/recommendations/companions?limit=6`).catch(() => null);
            if (aprioriData && aprioriData.rules && aprioriData.rules.length > 0) {
              setMetadata(prev => ({ ...prev, hasAprioriRecs: true, aprioriRules: aprioriData.rules }));
            } else {
              setMetadata(prev => ({ ...prev, hasAprioriRecs: false }));
            }
          } catch (e) {
            setMetadata(prev => ({ ...prev, hasAprioriRecs: false }));
          }
        } else if (recData && recData.type === 'popular-fallback') {
          // No personalized KNN; set hasAprioriRecs based on plan check
          // We'll rely on the plan check from FeatureGateService instead
          setMetadata(prev => ({ ...prev, hasAprioriRecs: false }));
        } else {
          setMetadata(prev => ({ ...prev, hasAprioriRecs: false }));
        }

        // Plan-gated recommendation type handling
        const recType = recData?.type;
        const hasPersonalizedRecs = recType !== 'popular-fallback';
        const hasAprioriRecs = !!(recData?.message && recData.message.includes('not available') === false);
        
        // Store rec type in metadata for rendering
        setMetadata(prev => ({ ...prev, recType, hasPersonalizedRecs, hasAprioriRecs }));
      } catch (e) {
        setError(e.message || 'Could not load this table\'s menu');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, tableNumber, user?._id]);

  // ---------- filtering ----------
  const filtered = useMemo(() => {
    if (!menu) return { items: [], categories: [], counts: {} };
    const q = search.trim().toLowerCase();
    const items = (menu.items || []).filter((it) => {
      if (!it.isAvailable) return false;
      if (activeCategory && it.category?.toString() !== activeCategory) return false;
      if (vegOnly && !it.isVeg) return false;
      if (q && !`${it.name} ${it.description || ''} ${(it.tags || []).join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const categories = (menu.categories || []).filter((c) => !c.isActive || c.isActive);
    const activeCategories = categories.filter((c) => items.some((it) => it.category?.toString() === c._id?.toString()));
    const counts = {};
    for (const c of categories) counts[c._id] = items.filter((it) => it.category?.toString() === c._id.toString()).length;
    return { items, categories: activeCategories, counts };
  }, [menu, search, activeCategory, vegOnly]);

  const isSearching = search.trim().length > 0;

  function quickAdd(item) {
    const hasOptions = (item.options || []).length > 0;
    if (hasOptions) {
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

  const heroRating = metadata.rating;

  const cartVisible = (items || []).length > 0;

  return (
    <div className="min-h-dvh bg-cream-50 pb-28">
      <Helmet>
        <title>{restaurant ? `${restaurant.name} · Table ${tableNumber} · HamroMenu` : 'Menu · HamroMenu'}</title>
      </Helmet>

      {loading && !restaurant ? (
        <div className="space-y-3 p-4 sm:p-6">
          <div className="skeleton h-52 sm:h-64" />
          <div className="skeleton h-10" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[4/3]" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
          <EmptyState
            icon={UtensilsCrossed}
            title="Menu unavailable"
            copy={error}
            action={
              <Link to="/" className="btn-secondary">
                Back to homepage
              </Link>
            }
          />
        </div>
      ) : restaurant && table ? (
        <>
          <MenuHeader restaurant={{ ...restaurant, rating: heroRating }} table={table} collapsed={scrolled} />

          <div className={cx('sticky top-0 z-30 bg-cream-50/95 backdrop-blur', scrolled && 'border-b border-cream-200')}>
            <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3 sm:px-6">
              <div className="relative flex-1">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search dishes, e.g. grilled chicken…"
                  className="w-full rounded-full border border-cream-200 bg-paper py-2.5 pl-11 pr-10 text-[14px] shadow-card"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-label="Clear search">
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>
            {!isSearching && (
              <CategoryChips
                categories={filtered.categories}
                active={activeCategory}
                onSelect={setActiveCategory}
                vegOnly={vegOnly}
                onVegOnly={setVegOnly}
                resultCount={menu?.items?.length}
              />
            )}
          </div>

          <main className="mx-auto max-w-5xl px-4 sm:px-6">
            {!isSearching && (
              <RecommendationRail
                title={recommended?.type === 'personalized' ? 'Recommended for you' : 'Popular with diners'}
                subtitle={
                  recommended?.type === 'personalized'
                    ? `Picked from dishes you've loved before`
                    : 'What regulars order the most'
                }
                items={(recommended?.items || []).map((it, i) => ({ ...it, isFirst: i === 0 }))}
                onSelect={setSelectedItem}
                personalized={recommended?.type === 'personalized'}
              />
            ) : null}

            {/* Frequently Ordered Together - only shows when Apriori available and item in cart */}
            {cartVisible && !isSearching && metadata?.hasAprioriRecs && (
              <div className="py-4">
                <p className="mb-3 px-1 text-[12px] font-bold uppercase tracking-wide text-ink-faint">
                  Frequently ordered together
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {/* Apriori rules would be rendered here - for now show placeholder */}
                  {recommended?.aprioriRules?.length ? (
                    recommended.aprioriRules.map((rule, i) => (
                      <div key={i} className="rounded-2xl bg-paper p-3 text-center">
                        <span className="text-[12px] text-ink-faint">{rule.antecedent}</span>
                        <span className="text-[12px] text-ink-faint ml-2">+</span>
                        <span className="text-[12px] text-ink-faint">{rule.consequent}</span>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      icon={ShoppingBag}
                      title="No pairing suggestions"
                      copy="Add items to your cart to see frequently ordered together suggestions."
                    />
                  )}
                </div>
              </div>
            )}

            {isSearching ? (
              <div className="py-4">
                <p className="mb-3 px-1 text-[12px] font-bold uppercase tracking-wide text-ink-faint">
                  {filtered.items.length} {filtered.items.length === 1 ? 'result' : 'results'} for "{search}"
                </p>
                {filtered.items.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {filtered.items.map((it) => (
                      <MenuItemCard key={it._id} item={it} onSelect={setSelectedItem} onQuickAdd={quickAdd} />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Search} title="Nothing matches" copy="Try a different dish name or clear the search." />
                )}
              </div>
            ) : (
              filtered.categories.map((cat) => (
                <section key={cat._id} id={`cat-${cat._id}`} className="scroll-mt-28 pb-2 pt-6">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h2 className="font-display text-lg font-bold text-ink">{cat.name}</h2>
                      {cat.description && <p className="text-[12.5px] text-ink-faint">{cat.description}</p>}
                    </div>
                    {cat.imageUrl && (
                      <div className="ml-3 h-12 w-14 shrink-0 overflow-hidden rounded-xl">
                        <SmartImage src={cat.imageUrl} alt={cat.name} ratio="1/1" rounded="rounded-xl" />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {filtered.items
                      .filter((it) => it.category?.toString() === cat._id.toString())
                      .map((it) => (
                        <MenuItemCard key={it._id} item={it} onSelect={setSelectedItem} onQuickAdd={quickAdd} />
                      ))}
                  </div>
                </section>
              ))
            )}
            {!isSearching && filtered.categories.length === 0 && !filtered.items.length && (
              <EmptyState
                icon={vegOnly ? Leaf : UtensilsCrossed}
                title="No dishes here yet"
                copy={vegOnly ? 'No vegetarian dishes match your filters.' : 'This section of the menu is being prepared.'}
              />
            )}
          </main>

          {/* Cart bar */}
          <AnimatePresence>
            {cartVisible && (
              <motion.div
                initial={{ y: 90, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 90, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 safe-bottom"
              >
                <button
                  onClick={() => navigate('/cart')}
                  className="flex w-full items-center gap-4 rounded-2xl bg-ink px-5 py-3.5 text-cream-50 shadow-sheet"
                >
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-clay-600 text-white">
                    <ShoppingBag size={17} />
                    <AnimatePresence>
                      {itemCount > 0 && (
                        <motion.span
                          key={itemCount}
                          initial={{ scale: 1.5 }}
                          animate={{ scale: 1 }}
                          className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-saffron px-1 text-[10px] font-bold text-ink"
                        >
                          {itemCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  <span className="flex-1 text-left">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-cream-50/60">Your order</span>
                    <span className="block text-[15px] font-bold">View cart · {npr(grandTotal)}</span>
                  </span>
                  <span className="rounded-full bg-saffron px-4 py-2 text-[13px] font-bold text-ink">View</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <ItemSheet item={selectedItem} open={Boolean(selectedItem)} onClose={() => setSelectedItem(null)} onAdd={handleAdd} />
        </>
      ) : null}
    </div>
  );
}