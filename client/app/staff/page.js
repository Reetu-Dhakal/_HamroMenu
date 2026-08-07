'use client';

import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Clock, Check, ChefHat, Bell, Banknote, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import RoleGuard from '@/components/RoleGuard';
import DashboardShell from '@/components/DashboardShell';
import { formatCurrency, formatDate, orderStatusMeta } from '@/lib/format';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export default function StaffPage() {
  const { user } = useAuth();
  return (
    <RoleGuard roles={['staff', 'admin']}>
      <StaffInner user={user} />
    </RoleGuard>
  );
}

function StaffInner({ user }) {
  const restaurantId = user?.restaurant;
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('orders');

  const loadAll = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const [o, t] = await Promise.all([
        api.get(`/staff/${restaurantId}/orders?limit=50`),
        api.get(`/staff/${restaurantId}/tables`),
      ]);
      setOrders(o.data.orders || []);
      setTables(t.data || []);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadAll();
    if (!restaurantId) return;
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.on('connect', () => socket.emit('join', { restaurantId }));
    socket.on('order:new', loadAll);
    socket.on('order:status', loadAll);
    return () => socket.disconnect();
  }, [restaurantId, loadAll]);

  const activeOrders = orders.filter((o) => !['completed', 'cancelled'].includes(o.status));
  const readyOrders = activeOrders.filter((o) => o.status === 'ready');
  const newOrders = activeOrders.filter((o) => o.status === 'pending');

  return (
    <DashboardShell title="Staff" subtitle="Orders, tables and billing at a glance" roleColor="text-sky-600">
      <div className="mb-6 flex gap-2">
        {['orders', 'tables'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition ${
              tab === t ? 'bg-ink-950 text-cream' : 'bg-white text-ink-600 border border-ink-900/10'
            }`}
          >
            {t}
          </button>
        ))}
        {readyOrders.length > 0 && (
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
            <Bell className="h-4 w-4" /> {readyOrders.length} ready to serve
          </span>
        )}
      </div>

      {tab === 'orders' ? (
        loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28" />)}</div>
        ) : (
          <OrderBoard orders={activeOrders} onAction={loadAll} />
        )
      ) : (
        <TableGrid tables={tables} />
      )}
    </DashboardShell>
  );
}

function OrderBoard({ orders, onAction }) {
  const [busyId, setBusyId] = useState(null);
  const act = async (fn, id) => {
    setBusyId(id);
    try {
      await fn();
      onAction();
    } finally {
      setBusyId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="font-display text-xl font-semibold text-ink-900">No active orders</p>
        <p className="mt-1 text-sm text-ink-500">New orders from tables will appear here instantly.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {orders.map((o) => {
        const meta = orderStatusMeta(o.status);
        return (
          <div key={o._id} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-lg font-semibold text-ink-950">{o.orderNumber}</p>
                <p className="text-sm text-ink-600">Table {o.table?.label || '—'} · {formatDate(o.placedAt)}</p>
              </div>
              <span className={`badge ${meta.color}`}>{meta.label}</span>
            </div>

            <ul className="mt-4 space-y-1.5 border-t border-ink-900/5 pt-3 text-sm">
              {o.items.slice(0, 4).map((it) => (
                <li key={it._id} className="flex justify-between gap-2">
                  <span className="truncate text-ink-700">
                    <b className="text-ink-950">{it.quantity}×</b> {it.name}
                  </span>
                  <span className="text-ink-500">{formatCurrency(it.lineTotal)}</span>
                </li>
              ))}
              {o.items.length > 4 && <li className="text-xs text-ink-400">+{o.items.length - 4} more</li>}
            </ul>

            <div className="mt-3 flex items-center justify-between border-t border-ink-900/5 pt-3">
              <div className="text-sm">
                <p className="text-ink-500">Total</p>
                <p className="font-display text-lg font-bold text-ink-950">{formatCurrency(o.grandTotal)}</p>
              </div>
              <p className="text-xs text-ink-500">
                {o.paymentStatus === 'paid' ? 'Paid' : o.paymentMethod === 'pay_after_meal' ? 'Pay after meal' : 'Unpaid'}
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              {o.status === 'pending' && (
                <ActionButton
                  busy={busyId === o._id}
                  icon={<Check className="h-4 w-4" />}
                  label="Confirm"
                  onClick={() => act(() => api.post(`/staff/orders/${o._id}/confirm`), o._id)}
                />
              )}
              {o.status === 'confirmed' && (
                <ActionButton
                  busy={busyId === o._id}
                  icon={<ChefHat className="h-4 w-4" />}
                  label="Send to kitchen"
                  onClick={() => act(() => api.post(`/staff/orders/${o._id}/send-to-kitchen`), o._id)}
                />
              )}
              {o.status === 'ready' && (
                <ActionButton
                  busy={busyId === o._id}
                  icon={<Bell className="h-4 w-4" />}
                  label="Serve"
                  variant="primary"
                  onClick={() => act(() => api.post(`/staff/orders/${o._id}/serve`), o._id)}
                />
              )}
              {o.status === 'served' && o.paymentStatus !== 'paid' && (
                <ActionButton
                  busy={busyId === o._id}
                  icon={<Banknote className="h-4 w-4" />}
                  label="Collect cash"
                  variant="primary"
                  onClick={() => act(() => api.post(`/staff/orders/${o._id}/collect-cash`), o._id)}
                />
              )}
              <a href={`/staff/billing?order=${o._id}`} className="btn-ghost flex-1 border border-ink-900/10 bg-white">
                Bill <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActionButton({ busy, icon, label, onClick, variant }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
        variant === 'primary' ? 'bg-clay-600 text-white hover:bg-clay-700' : 'bg-ink-950 text-cream hover:bg-ink-800'
      }`}
    >
      {icon} {busy ? '…' : label}
    </button>
  );
}

function TableGrid({ tables }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {tables.map((t) => (
        <div
          key={t._id}
          className={`rounded-2xl border-2 p-5 text-center transition ${
            t.status === 'free' ? 'border-emerald-200 bg-emerald-50' : 'border-clay-200 bg-clay-50'
          }`}
        >
          <p className="font-display text-2xl font-bold text-ink-950">{t.label}</p>
          <p className="text-xs text-ink-500">{t.area} · {t.capacity} seats</p>
          <span className={`badge mt-3 ${t.status === 'free' ? 'bg-emerald-600 text-white' : 'bg-clay-600 text-white'}`}>
            {t.status}
          </span>
        </div>
      ))}
    </div>
  );
}