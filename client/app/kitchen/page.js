'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Clock, StickyNote } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import RoleGuard from '@/components/RoleGuard';
import DashboardShell from '@/components/DashboardShell';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
const STATUS_COLORS = {
  pending: 'border-stone-300 bg-stone-50',
  confirmed: 'border-sky-300 bg-sky-50',
  preparing: 'border-amber-300 bg-amber-50',
};

export default function KitchenPage() {
  const { user } = useAuth();
  return (
    <RoleGuard roles={['kitchen', 'admin']}>
      <KitchenInner user={user} />
    </RoleGuard>
  );
}

function KitchenInner({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const restaurantId = user?.restaurant;

  const load = async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const res = await api.get(`/kitchen/${restaurantId}/queue`);
      setOrders(res.data);
    } catch (err) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (!restaurantId) return;
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.on('connect', () => socket.emit('join', { restaurantId }));
    socket.on('order:new', () => load());
    socket.on('order:status', () => load());
    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const filtered =
    filter === 'active'
      ? orders.filter((o) => ['pending', 'confirmed', 'preparing'].includes(o.status))
      : orders.filter((o) => o.status === filter);

  return (
    <KitchenLayout>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          {['active', 'ready'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition ${
                filter === f ? 'bg-ink-950 text-cream' : 'bg-white text-ink-600 border border-ink-900/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button onClick={load} className="rounded-full bg-ink-950 px-4 py-1.5 text-sm font-semibold text-cream">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-48" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-display text-xl font-semibold text-ink-900">No orders in {filter}</p>
          <p className="mt-1 text-sm text-ink-500">New orders will appear here live.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((order) => (
            <KitchenOrderCard key={order._id} order={order} onAction={load} restaurantId={restaurantId} />
          ))}
        </div>
      )}
    </KitchenLayout>
  );
}

function KitchenOrderCard({ order, onAction, restaurantId }) {
  const [busy, setBusy] = useState(false);
  const act = async (fn) => {
    setBusy(true);
    try {
      await fn();
      onAction();
    } finally {
      setBusy(false);
    }
  };

  const color = STATUS_COLORS[order.status] || 'bg-white';
  const waitingMin = Math.floor((Date.now() - new Date(order.placedAt || Date.now()).getTime()) / 60000);

  return (
    <div className={`rounded-2xl border-2 p-4 shadow-soft transition ${color} ${order.status === 'preparing' ? 'ring-2 ring-amber-300' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-black tracking-tight text-ink-950">{order.orderNumber}</p>
          <p className="text-sm font-medium text-ink-600">Table: {order.table?.label || 'Takeaway'}</p>
        </div>
        <div className="text-right">
          <p className="flex items-center gap-1 text-lg font-bold text-ink-900">
            <Clock className="h-4 w-4" /> {waiting}m
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">{order.status}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2 border-t border-ink-900/10 pt-3">
        {order.items?.map((it) => (
          <li key={it._id} className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-ink-900">
                <span className="inline-block w-6">{it.quantity}×</span> {it.name}
              </p>
              {it.optionsLabel && <p className="pl-6 text-sm text-ink-600">{it.optionsLabel}</p>}
              <p className="pl-6 text-sm text-ink-600">Prep {it.prepTimeMinutes || 0} min</p>
            </div>
{it.specialInstructions && (
              <span className="shrink-0 rounded-lg bg-clay-200/70 px-2 py-1 text-xs font-semibold text-clay-900">
                <StickyNote className="mr-1 inline h-3.5 w-3.5" />{it.specialInstructions}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex gap-2">
        {order.status === 'pending' && (
          <button className="flex-1 rounded-xl bg-ink-950 py-3 font-bold text-cream disabled:opacity-50" disabled={busy} onClick={() => act(() => api.post(`/kitchen/orders/${order._id}/accept`))}>
            Accept order
          </button>
        )}
        {order.status === 'preparing' && (
          <button className="flex-1 rounded-xl bg-amber-600 py-3 font-bold text-white disabled:opacity-50" disabled={busy} onClick={() => act(() => api.post(`/kitchen/orders/${order._id}/ready`))}>
            Mark ready
          </button>
        )}
      </div>
    </div>
  );
}

function KitchenLayout({ children }) {
  return (
    <DashboardShell
      title="Kitchen"
      subtitle="Live kitchen queue · auto-updates"
      roleColor="text-amber-600"
    >
      {children}
    </DashboardShell>
  );
}