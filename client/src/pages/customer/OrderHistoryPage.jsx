import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Receipt, ChevronRight, ChevronLeft } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { npr, formatTime, dayName } from '../../lib/format';
import { StatusPill, EmptyState, Spinner } from '../../components/ui';

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const load = useCallback(async (p = 1) => {
    try {
      const data = await request(`/api/orders/my?page=${p}&limit=10`);
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  return (
    <div className="min-h-dvh bg-cream-50 pb-16">
      <Helmet><title>Order history · HamroMenu</title></Helmet>
      <header className="sticky top-0 z-30 border-b border-cream-200 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/profile" className="btn-ghost !px-3" aria-label="Back"><ChevronLeft size={18} /></Link>
          <div>
            <h1 className="font-display text-lg font-bold text-ink">Order history</h1>
            <p className="text-[12px] font-medium text-ink-faint">Your past orders with {user?.name?.split(' ')[0] || 'us'}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 px-4 py-5 sm:px-6">
        {!orders && !error && <div className="flex justify-center py-16"><Spinner /></div>}
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700">{error}</p>}
        {orders?.length === 0 && (
          <div className="pt-10">
            <EmptyState
              icon={Receipt}
              title="No orders yet"
              copy="Scan a table QR or explore the menu to place your first order."
              action={<Link to="/menu" className="btn-primary">Browse menu</Link>}
            />
          </div>
        )}
        {orders?.map((o) => (
          <Link key={o._id} to={`/order/${o._id}/track`} className="card block p-4 transition-shadow hover:shadow-cardHover">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-[15px] font-bold text-ink">{o.orderNumber}</p>
                <p className="mt-0.5 text-[12px] text-ink-faint">
                  {dayName(o.placedAt)} · {formatTime(o.placedAt)} · {o.itemCount} item{o.itemCount > 1 ? 's' : ''}
                </p>
              </div>
              <StatusPill status={o.status} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-dashed border-cream-200 pt-3">
              <span className="text-[12.5px] font-semibold text-ink-soft">
                {o.paymentStatus === 'paid' ? 'Paid' : 'Pay at table'} · {o.restaurantName || ''}
              </span>
              <span className="font-display text-[16px] font-bold text-clay-700">{npr(o.grandTotal)}</span>
            </div>
          </Link>
        ))}
        {pagination?.totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="btn-ghost disabled:opacity-40">Prev</button>
            <span className="px-2 self-center text-[12.5px] font-semibold text-ink-soft">{page} / {pagination.totalPages}</span>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-ghost disabled:opacity-40">Next</button>
          </div>
        )}
      </main>
    </div>
  );
}