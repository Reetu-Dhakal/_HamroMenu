import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, ChevronRight, Loader2, XCircle, ClipboardList } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { npr, formatTime, cx, elapsedLabel } from '../../lib/format';
import { StatusPill, Spinner, EmptyState } from '../../components/ui';

const TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Cooking' },
  { key: 'ready', label: 'Ready' },
  { key: 'served', label: 'Served' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const rid = user?.restaurant;

  const [tab, setTab] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [cancelId, setCancelId] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await request(`/api/staff/${rid}/orders?page=${page}&limit=12${tab ? `&status=${tab}` : ''}`);
        if (alive) setData(res);
      } catch (_) { /* ignore */ }
    })();
    return () => (alive = false);
  }, [rid, tab, page]);

  async function cancel(o) {
    if (!window.confirm(`Cancel ${o.orderNumber}?`)) return;
    setCancelId(o._id);
    try {
      await request(`/api/orders/${o._id}/status`, { method: 'PATCH', body: { status: 'cancelled' } });
      toast.success('Order cancelled');
      const res = await request(`/api/staff/${rid}/orders?page=${page}&limit=12${tab ? `&status=${tab}` : ''}`);
      setData(res);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCancelId('');
    }
  }

  const orders = data?.orders || [];
  const pagination = data?.pagination || {};

  return (
    <div className="min-h-dvh">
      <Helmet><title>Orders · HamroMenu</title></Helmet>
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold text-ink">Orders</h1>
        <p className="text-[13px] font-medium text-ink-faint">{pagination.total || 0} orders found</p>
      </header>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }} className={cx('chip whitespace-nowrap', tab === t.key && 'bg-ink text-white ring-ink')}>
            {t.label}
          </button>
        ))}
      </div>

      {!data ? (
        <div className="flex justify-center py-24"><Spinner /></div>
      ) : orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No orders in this view" copy="Try another status filter." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {orders.map((o) => (
            <article key={o._id} className="card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-[15px] font-bold text-ink">{o.orderNumber}</p>
                <StatusPill status={o.status} />
                <span className="ml-auto text-[11.5px] font-semibold text-ink-faint">
                  Table {o.table?.number || o.table?.name || '—'} · {o.placedAt ? formatTime(o.placedAt) : ''}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-[12.5px] text-ink-soft">
                {o.items.slice(0, 6).map((it) => (
                  <li key={it._id} className="flex justify-between">
                    <span>{it.quantity}× {it.name}</span>
                    <span className="font-semibold text-ink">{npr(it.lineTotal)}</span>
                  </li>
                ))}
                {o.items.length > 6 && <li className="text-[11px] text-ink-faint">+{o.items.length - 6} more</li>}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-dashed border-cream-200 pt-3">
                <span className="text-[12px] font-semibold text-ink-faint">
                  <span className="capitalize">{String(o.paymentMethod || '').replace(/_/g, ' ')}</span> · <span className={o.paymentStatus === 'paid' ? 'text-leaf' : 'text-saffron-deep'}>{o.paymentStatus === 'paid' ? 'paid' : 'unpaid'}</span>
                </span>
                <div className="flex items-center gap-2">
                  {o.status !== 'cancelled' && o.status !== 'completed' && (
                    <button onClick={() => cancel(o)} disabled={cancelId === o._id} className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50" title="Cancel order">
                      {cancelId === o._id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={15} />}
                    </button>
                  )}
                  <span className="font-display text-[15px] font-bold text-clay-700">{npr(o.grandTotal)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-5 flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="btn-ghost disabled:opacity-40"><ChevronLeft size={15} /> Prev</button>
          <span className="self-center px-2 text-[12.5px] font-semibold text-ink-soft">{page} / {pagination.totalPages}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-ghost disabled:opacity-40">Next <ChevronRight size={15} /></button>
        </div>
      )}
    </div>
  );
}