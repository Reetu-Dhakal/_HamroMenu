'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import RoleGuard from '@/components/RoleGuard';
import DashboardShell from '@/components/DashboardShell';
import { formatCurrency, formatDate, orderStatusMeta } from '@/lib/format';
import { useToast } from '@/components/Toast';

export default function AdminOrdersPage() {
  return <RoleGuard roles={['admin']}><OrderManager /></RoleGuard>;
}

function OrderManager() {
  const toast = useToast();
  const [rid, setRid] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (id, status) => {
    if (!id) return;
    setLoading(true);
    try {
      const q = status ? `?status=${status}&limit=50` : '?limit=50';
      const res = await api.get(`/staff/${id}/orders${q}`);
      setOrders(res.data?.orders || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/admin/restaurants').then((r) => {
      if (r.data?.length) {
        setRid(r.data[0]._id);
        load(r.data[0]._id);
      }
    });
  }, [load]);

  const setStatus = async (order, status) => {
    try {
      await api.patch(`/orders/${order._id}/status`, { status });
      toast.success('Updated');
      load(rid, filter);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filters = ['', 'pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];

  return (
    <DashboardShell title="Orders" subtitle="Every order across the restaurant" roleColor="text-clay-600">
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); load(rid, f); }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              filter === f ? 'bg-ink-950 text-cream' : 'bg-white border border-ink-900/10 text-ink-600'
            }`}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center"><p className="text-sm text-ink-500">No orders in this view</p></div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o._id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-[120px]">
                <p className="font-display text-base font-semibold text-ink-950">{o.orderNumber}</p>
                <p className="text-xs text-ink-500">{formatDate(o.placedAt)}</p>
              </div>
              <div className="hidden min-w-0 flex-1 sm:block">
                <p className="truncate text-sm text-ink-700">{o.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}</p>
              </div>
              <span className={`badge ${orderStatusMeta(o.status).color}`}>{o.status}</span>
              <span className="font-display text-lg font-semibold text-ink-950">{formatCurrency(o.grandTotal)}</span>
              <select
                className="input !w-auto !py-1.5 text-sm"
                value={o.status}
                onChange={(e) => setStatus(o, e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="served">Served</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}