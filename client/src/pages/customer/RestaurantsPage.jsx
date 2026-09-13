import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, MapPin, UtensilsCrossed, Star } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { SmartImage, EmptyState, PageLoader } from '../../components/ui';

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(params = {}) {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams({
        search: params.search ?? search,
        cuisine: params.cuisine ?? cuisine,
        city: params.city ?? city,
        limit: '12',
      });
      const data = await request(`/api/restaurants/discover?${q.toString()}`);
      setRestaurants(data.restaurants || []);
      setPagination(data.pagination || null);
    } catch (e) {
      setError(e.message || 'Could not load restaurants');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e) {
    e.preventDefault();
    load({});
  }

  return (
    <div className="min-h-dvh bg-cream-50 pb-16">
      <Helmet><title>Restaurants · HamroMenu</title></Helmet>
      <header className="border-b border-cream-200 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <h1 className="font-display text-2xl font-black text-ink">Find a restaurant</h1>
          <p className="mt-1 text-sm text-ink-soft">Browse verified restaurants on HamroMenu.</p>
          <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search momo, café, thakali…"
                className="w-full rounded-full border border-cream-200 bg-paper py-2.5 pl-11 pr-4 text-sm shadow-card"
              />
            </div>
            <input
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              placeholder="Cuisine"
              className="rounded-full border border-cream-200 bg-paper px-4 py-2.5 text-sm sm:w-40"
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="rounded-full border border-cream-200 bg-paper px-4 py-2.5 text-sm sm:w-40"
            />
            <button type="submit" className="btn-primary whitespace-nowrap">Search</button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {loading ? (
          <PageLoader label="Loading restaurants…" />
        ) : error ? (
          <EmptyState icon={UtensilsCrossed} title="Could not load restaurants" copy={error} />
        ) : !restaurants.length ? (
          <EmptyState icon={UtensilsCrossed} title="No restaurants found" copy="Try a different search." />
        ) : (
          <>
            <p className="mb-4 text-xs font-bold uppercase tracking-wide text-ink-faint">
              {pagination?.total ?? restaurants.length} restaurant{(pagination?.total ?? restaurants.length) === 1 ? '' : 's'}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((r) => (
                <Link
                  key={r._id}
                  to={`/restaurants/${r._id}`}
                  className="group overflow-hidden rounded-3xl bg-paper shadow-card transition-shadow hover:shadow-cardHover"
                >
                  <div className="relative h-40 overflow-hidden bg-cream-100">
                    <SmartImage src={r.coverUrl || r.logoUrl} alt={r.name} ratio="16/9" />
                    {r.isOpen === false && (
                      <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[10px] font-bold uppercase text-white">Closed</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="font-display text-lg font-bold text-ink group-hover:text-clay-700">{r.name}</h2>
                    {r.tagline && <p className="mt-0.5 line-clamp-1 text-xs text-ink-faint">{r.tagline}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-ink-soft">
                      {(r.cuisine || []).slice(0, 3).map((c) => (
                        <span key={c} className="rounded-full bg-cream-100 px-2 py-0.5">{c}</span>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[12px] text-ink-faint">
                      {r.address?.city && (
                        <span className="inline-flex items-center gap-1"><MapPin size={12} />{r.address.city}</span>
                      )}
                      {r.avgRating > 0 && (
                        <span className="inline-flex items-center gap-1"><Star size={12} className="fill-saffron text-saffron" />{r.avgRating}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
