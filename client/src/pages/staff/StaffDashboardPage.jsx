import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Banknote,
  BellRing,
  CheckCircle2,
  ChefHat,
  Clock3,
  Eye,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Receipt,
  RefreshCw,
  Settings,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  Users,
  X,
} from 'lucide-react';

import { request } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { npr, elapsedLabel, cx, formatTime } from '../../lib/format';

import {
  StatusPill,
  Spinner,
  Sheet,
  SmartImage,
  EmptyState,
} from '../../components/ui';

const TABS = [
  {
    key: 'pending',
    label: 'New orders',
    shortLabel: 'New',
    icon: BellRing,
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
    shortLabel: 'Confirmed',
    icon: CheckCircle2,
  },
  {
    key: 'preparing',
    label: 'Cooking',
    shortLabel: 'Cooking',
    icon: ChefHat,
  },
  {
    key: 'ready',
    label: 'Ready',
    shortLabel: 'Ready',
    icon: ShoppingBag,
  },
];

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const { socket, join } = useSocket();
  const toast = useToast();

  const restaurantId = user?.restaurant;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const [counts, setCounts] = useState(null);
  const [orders, setOrders] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [billOrder, setBillOrder] = useState(null);
  const [bill, setBill] = useState(null);

  const [busyId, setBusyId] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const firstName = user?.name?.split(' ')?.[0] || 'Staff';

  const loadDashboard = useCallback(
    async ({ silent = false } = {}) => {
      if (!restaurantId) return;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        setError('');

        const [dashboardData, ordersData] = await Promise.all([
          request(`/api/staff/${restaurantId}/dashboard`),
          request(`/api/staff/${restaurantId}/orders?limit=60`),
        ]);

        setCounts(dashboardData?.counts || {});
        setOrders(ordersData?.orders || []);
      } catch (err) {
        setError(err.message || 'Unable to load staff dashboard.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [restaurantId],
  );

  useEffect(() => {
    if (restaurantId) {
      join(restaurantId, null);
    }
  }, [restaurantId, join]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!socket) return;

    const refreshDashboard = () => {
      loadDashboard({ silent: true });
    };

    socket.on('order:new', refreshDashboard);
    socket.on('order:status', refreshDashboard);
    socket.on('order:item-status', refreshDashboard);
    socket.on('payment:success', refreshDashboard);

    return () => {
      socket.off('order:new', refreshDashboard);
      socket.off('order:status', refreshDashboard);
      socket.off('order:item-status', refreshDashboard);
      socket.off('payment:success', refreshDashboard);
    };
  }, [socket, loadDashboard]);

  async function updateOrderStatus(action, orderId) {
    setBusyId(orderId);

    try {
      await request(`/api/staff/orders/${orderId}/${action}`, {
        method: 'POST',
      });

      const message =
        action === 'send-to-kitchen'
          ? 'Order sent to kitchen'
          : action === 'serve'
            ? 'Order marked as served'
            : 'Order updated successfully';

      toast.success(message);

      setSelectedOrder(null);
      await loadDashboard({ silent: true });
    } catch (err) {
      toast.error(err.message || 'Unable to update order.');
    } finally {
      setBusyId('');
    }
  }

  async function openBill(order) {
    setBillOrder(order);
    setBill(null);

    try {
      const data = await request(`/api/staff/orders/${order._id}/bill`);
      setBill(data);
    } catch (err) {
      toast.error(err.message || 'Unable to load bill.');
    }
  }

  async function collectCash() {
    if (!billOrder) return;

    setCollecting(true);

    try {
      await request(
        `/api/staff/orders/${billOrder._id}/collect-cash`,
        { method: 'POST' },
      );

      toast.success('Payment collected and order completed');

      setBillOrder(null);
      setBill(null);

      await loadDashboard({ silent: true });
    } catch (err) {
      toast.error(err.message || 'Unable to collect payment.');
    } finally {
      setCollecting(false);
    }
  }

  const filteredOrders = useMemo(() => {
    return (orders || []).filter((order) => {
      return order.status === activeTab;
    });
  }, [orders, activeTab]);

  function getTabCount(tabKey) {
    if (tabKey === 'pending') return counts?.newOrders ?? 0;
    if (tabKey === 'confirmed') return counts?.confirmed ?? 0;
    if (tabKey === 'preparing') return counts?.preparing ?? 0;
    if (tabKey === 'ready') return counts?.ready ?? 0;

    return 0;
  }

  return (
    <div className="min-h-dvh bg-cream-50 text-ink">
      <Helmet>
        <title>Staff Dashboard · HamroMenu</title>
      </Helmet>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-cream-200 bg-white transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="flex h-[76px] items-center justify-between border-b border-cream-100 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-clay-600 text-white">
              <UtensilsCrossed size={20} />
            </div>

            <div>
              <p className="font-display text-xl font-black text-ink">
                Hamro<span className="text-clay-600">Menu</span>
              </p>

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-faint">
                Staff workspace
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-xl p-2 text-ink-faint hover:bg-cream-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Restaurant identity */}
        <div className="mx-4 mt-5 rounded-2xl bg-cream-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron/20 text-saffron-deep">
              <Store size={18} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">
                {user?.restaurantName || 'Your restaurant'}
              </p>

              <p className="mt-0.5 text-[11px] font-medium text-ink-faint">
                Staff account
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          <SidebarItem
            icon={LayoutDashboard}
            label="Overview"
            active
          />

          <SidebarItem
            icon={Receipt}
            label="Order queue"
            count={counts?.newOrders}
            onClick={() => {
              setActiveTab('pending');
              setSidebarOpen(false);
            }}
          />

          <SidebarItem
            icon={ChefHat}
            label="Kitchen status"
            count={counts?.preparing}
            onClick={() => {
              setActiveTab('preparing');
              setSidebarOpen(false);
            }}
          />

          <SidebarItem
            icon={ShoppingBag}
            label="Ready orders"
            count={counts?.ready}
            onClick={() => {
              setActiveTab('ready');
              setSidebarOpen(false);
            }}
          />

          <SidebarItem
            icon={Users}
            label="Customers"
            disabled
          />

          <SidebarItem
            icon={Settings}
            label="Settings"
            disabled
          />
        </nav>

        {/* Bottom profile */}
        <div className="border-t border-cream-100 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-cream-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clay-600 font-display font-bold text-white">
              {firstName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">
                {user?.name || 'Staff member'}
              </p>

              <p className="truncate text-[11px] text-ink-faint">
                {user?.email || 'Staff account'}
              </p>
            </div>

            <button
              type="button"
              title="Account"
              className="rounded-lg p-1.5 text-ink-faint hover:bg-white"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[270px]">
        {/* Top header */}
        <header className="sticky top-0 z-30 border-b border-cream-200 bg-cream-50/95 backdrop-blur">
          <div className="flex h-[76px] items-center justify-between gap-4 px-4 sm:px-7">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl p-2 text-ink-soft hover:bg-white lg:hidden"
              >
                <Menu size={21} />
              </button>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-clay-600">
                  Staff dashboard
                </p>

                <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">
                  Good morning, {firstName}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full bg-leaf/10 px-3 py-2 text-xs font-bold text-leaf-dark sm:flex">
                <span className="h-2 w-2 animate-pulse rounded-full bg-leaf" />
                Live updates
              </div>

              <button
                type="button"
                onClick={() => loadDashboard({ silent: true })}
                disabled={refreshing}
                title="Refresh dashboard"
                className="btn-ghost !h-10 !w-10 !p-0"
              >
                <RefreshCw
                  size={17}
                  className={cx(refreshing && 'animate-spin')}
                />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-7">
          {/* Welcome banner */}
          <section className="overflow-hidden rounded-3xl bg-ink px-5 py-6 text-white shadow-sm sm:px-7 sm:py-7">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-white/55">
                  Today’s workspace
                </p>

                <h2 className="max-w-xl font-display text-2xl font-bold sm:text-3xl">
                  Keep every order moving smoothly.
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
                  Manage incoming orders, coordinate with the kitchen, and
                  complete customer service from one place.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-saffron/20 text-saffron">
                  <Clock3 size={20} />
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-white/55">
                    Active orders
                  </p>

                  <p className="font-display text-2xl font-black">
                    {(counts?.newOrders || 0) +
                      (counts?.confirmed || 0) +
                      (counts?.preparing || 0) +
                      (counts?.ready || 0)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Statistics */}
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <StatCard
              label="New orders"
              value={counts?.newOrders ?? '—'}
              icon={BellRing}
              tone="clay"
            />

            <StatCard
              label="Confirmed"
              value={counts?.confirmed ?? '—'}
              icon={CheckCircle2}
              tone="blue"
            />

            <StatCard
              label="Cooking"
              value={counts?.preparing ?? '—'}
              icon={ChefHat}
              tone="orange"
            />

            <StatCard
              label="Ready"
              value={counts?.ready ?? '—'}
              icon={ShoppingBag}
              tone="green"
            />

            <StatCard
              label="Unpaid"
              value={counts?.unpaid ?? '—'}
              icon={Banknote}
              tone="neutral"
            />
          </section>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />

              <div className="flex-1">
                <p className="font-bold">Unable to load dashboard</p>
                <p className="mt-0.5 text-xs">{error}</p>
              </div>

              <button
                type="button"
                onClick={() => loadDashboard()}
                className="text-xs font-bold underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Main dashboard grid */}
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            {/* Orders */}
            <div className="min-w-0">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-clay-600">
                    Order management
                  </p>

                  <h2 className="font-display text-2xl font-bold text-ink">
                    Order queue
                  </h2>

                  <p className="mt-1 text-sm text-ink-faint">
                    Process orders according to their current status.
                  </p>
                </div>

                <p className="text-xs font-semibold text-ink-faint">
                  {filteredOrders.length} order
                  {filteredOrders.length === 1 ? '' : 's'} displayed
                </p>
              </div>

              {/* Tabs */}
              <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                {TABS.map((tabItem) => {
                  const Icon = tabItem.icon;
                  const isActive = activeTab === tabItem.key;

                  return (
                    <button
                      key={tabItem.key}
                      type="button"
                      onClick={() => setActiveTab(tabItem.key)}
                      className={cx(
                        'flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition',
                        isActive
                          ? 'border-ink bg-ink text-white'
                          : 'border-cream-200 bg-white text-ink-soft hover:border-clay-300 hover:bg-clay-50',
                      )}
                    >
                      <Icon size={15} />

                      <span className="sm:hidden">
                        {tabItem.shortLabel}
                      </span>

                      <span className="hidden sm:inline">
                        {tabItem.label}
                      </span>

                      <span
                        className={cx(
                          'rounded-full px-1.5 py-0.5 text-[10px]',
                          isActive
                            ? 'bg-white/15 text-white'
                            : 'bg-cream-100 text-ink-faint',
                        )}
                      >
                        {getTabCount(tabItem.key)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {loading && (
                <div className="flex justify-center rounded-3xl border border-cream-200 bg-white py-24">
                  <Spinner />
                </div>
              )}

              {!loading && orders?.length === 0 && (
                <EmptyState
                  icon={Receipt}
                  title="No orders yet"
                  copy="New orders from the customer menu will appear here automatically."
                />
              )}

              {!loading && orders?.length > 0 && filteredOrders.length === 0 && (
                <div className="rounded-3xl border border-dashed border-cream-300 bg-white px-5 py-16 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-100 text-ink-faint">
                    <Receipt size={21} />
                  </div>

                  <h3 className="font-display text-lg font-bold text-ink">
                    Nothing here right now
                  </h3>

                  <p className="mt-1 text-sm text-ink-faint">
                    Orders will appear here when their status changes.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {!loading &&
                  filteredOrders.map((order) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      busy={busyId === order._id}
                      onView={() => setSelectedOrder(order)}
                      onSendToKitchen={() =>
                        updateOrderStatus('send-to-kitchen', order._id)
                      }
                      onServe={() =>
                        updateOrderStatus('serve', order._id)
                      }
                      onBill={() => openBill(order)}
                    />
                  ))}
              </div>
            </div>

            {/* Right side summary */}
            <aside className="space-y-5">
              <div className="rounded-3xl border border-cream-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <LayoutDashboard size={17} className="text-clay-600" />

                  <h3 className="font-display text-lg font-bold text-ink">
                    Shift summary
                  </h3>
                </div>

                <div className="space-y-4">
                  <SummaryRow
                    label="New orders"
                    value={counts?.newOrders ?? '—'}
                  />

                  <SummaryRow
                    label="Confirmed orders"
                    value={counts?.confirmed ?? '—'}
                  />

                  <SummaryRow
                    label="Currently cooking"
                    value={counts?.preparing ?? '—'}
                  />

                  <SummaryRow
                    label="Ready to serve"
                    value={counts?.ready ?? '—'}
                  />

                  <SummaryRow
                    label="Unpaid orders"
                    value={counts?.unpaid ?? '—'}
                  />

                  <div className="border-t border-dashed border-cream-200 pt-4">
                    <SummaryRow
                      label="Completed today"
                      value={counts?.completedToday ?? '—'}
                      strong
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-saffron/10 p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-saffron/20 text-saffron-deep">
                  <ChefHat size={20} />
                </div>

                <h3 className="font-display text-lg font-bold text-ink">
                  Staff reminder
                </h3>

                <p className="mt-1 text-sm leading-6 text-ink-soft">
                  Always check special requests and item options before sending
                  an order to the kitchen.
                </p>
              </div>

              <div className="rounded-3xl border border-cream-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Banknote size={17} className="text-leaf-dark" />

                  <h3 className="font-display text-lg font-bold text-ink">
                    Payment reminder
                  </h3>
                </div>

                <p className="text-sm leading-6 text-ink-soft">
                  There are currently{' '}
                  <span className="font-bold text-ink">
                    {counts?.unpaid ?? 0}
                  </span>{' '}
                  unpaid order
                  {counts?.unpaid === 1 ? '' : 's'}.
                </p>

                <button
                  type="button"
                  onClick={() => setActiveTab('ready')}
                  className="mt-4 text-xs font-bold text-clay-700 underline underline-offset-4"
                >
                  Review ready orders
                </button>
              </div>
            </aside>
          </section>
        </main>
      </div>

      {/* Order details */}
      <Sheet
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder?.orderNumber || 'Order details'}
      >
        {selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            busy={busyId === selectedOrder._id}
            onSendToKitchen={() =>
              updateOrderStatus('send-to-kitchen', selectedOrder._id)
            }
            onServe={() =>
              updateOrderStatus('serve', selectedOrder._id)
            }
            onBill={() => {
              setSelectedOrder(null);
              openBill(selectedOrder);
            }}
          />
        )}
      </Sheet>

      {/* Bill */}
      <Sheet
        open={!!billOrder}
        onClose={() => {
          setBillOrder(null);
          setBill(null);
        }}
        title={`Bill · ${bill?.orderNumber || billOrder?.orderNumber || ''}`}
      >
        {!bill ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <BillContent
            bill={bill}
            collecting={collecting}
            onCollectCash={collectCash}
          />
        )}
      </Sheet>
    </div>
  );
}

/* -------------------------------------------------- */
/* Sidebar */
/* -------------------------------------------------- */

function SidebarItem({
  icon: Icon,
  label,
  active = false,
  count,
  disabled = false,
  onClick,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-bold transition',
        active
          ? 'bg-ink text-white'
          : disabled
            ? 'cursor-not-allowed text-ink-faint/50'
            : 'text-ink-soft hover:bg-cream-50 hover:text-ink',
      )}
    >
      <Icon size={17} />

      <span className="flex-1">{label}</span>

      {count !== undefined && count > 0 && (
        <span
          className={cx(
            'rounded-full px-2 py-0.5 text-[10px]',
            active
              ? 'bg-white/15 text-white'
              : 'bg-clay-50 text-clay-700',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* -------------------------------------------------- */
/* Statistic card */
/* -------------------------------------------------- */

function StatCard({ label, value, icon: Icon, tone }) {
  const tones = {
    clay: 'bg-clay-50 text-clay-700',
    blue: 'bg-blue-50 text-blue-700',
    orange: 'bg-saffron/10 text-saffron-deep',
    green: 'bg-leaf/10 text-leaf-dark',
    neutral: 'bg-cream-100 text-ink-soft',
  };

  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-3.5 shadow-sm sm:p-4">
      <div className="flex items-center gap-3">
        <div
          className={cx(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            tones[tone],
          )}
        >
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <p className="font-display text-xl font-black leading-none text-ink">
            {value}
          </p>

          <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wide text-ink-faint">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* Shift summary */
/* -------------------------------------------------- */

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-ink-soft">{label}</span>

      <span
        className={cx(
          'font-display text-lg font-bold',
          strong ? 'text-clay-700' : 'text-ink',
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* -------------------------------------------------- */
/* Order card */
/* -------------------------------------------------- */

function OrderCard({
  order,
  busy,
  onView,
  onSendToKitchen,
  onServe,
  onBill,
}) {
  const tableLabel = order.table?.name
    ? `Table ${order.table.name}`
    : `Table ${order.table?.number || '—'}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm"
    >
      {/* Order header */}
      <div className="border-b border-cream-100 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay-50 text-clay-700">
              <Receipt size={17} />
            </span>

            <div>
              <p className="font-display text-base font-bold text-ink">
                {order.orderNumber}
              </p>

              <p className="text-[11px] font-semibold text-ink-faint">
                {elapsedLabel(order.placedAt)}
              </p>
            </div>
          </div>

          <div className="ml-auto">
            <StatusPill status={order.status} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-ink-soft">
          <span className="rounded-lg bg-cream-100 px-2.5 py-1.5">
            {tableLabel}
          </span>

          {order.customer?.name && (
            <span className="rounded-lg bg-cream-100 px-2.5 py-1.5">
              {order.customer.name}
            </span>
          )}

          {order.paymentMethod && (
            <span className="rounded-lg bg-cream-100 px-2.5 py-1.5">
              {order.paymentMethod === 'pay_after_meal'
                ? 'Pay at table'
                : order.paymentMethod}
            </span>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-4 sm:px-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {order.items?.map((item) => (
            <div
              key={item._id}
              className="flex min-w-0 items-center gap-3 rounded-2xl bg-cream-50 p-2.5"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                <SmartImage
                  src={item.imageUrl}
                  alt={item.name}
                  ratio="1/1"
                  rounded="rounded-xl"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">
                  {item.quantity}× {item.name}
                </p>

                {item.optionsLabel && (
                  <p className="truncate text-xs text-ink-faint">
                    {item.optionsLabel}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {order.specialRequests && (
          <div className="mt-4 rounded-2xl border border-saffron/20 bg-saffron/10 px-3.5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-saffron-deep">
              Special request
            </p>

            <p className="mt-1 text-sm italic leading-5 text-ink-soft">
              {order.specialRequests}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 border-t border-dashed border-cream-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">
            Order total
          </p>

          <p className="font-display text-xl font-black text-clay-700">
            {npr(order.grandTotal)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onView}
            className="btn-soft"
          >
            <Eye size={15} />
            Details
          </button>

          {(order.status === 'pending' ||
            order.status === 'confirmed') && (
            <button
              type="button"
              onClick={onSendToKitchen}
              disabled={busy}
              className="btn-primary"
            >
              {busy ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <ChefHat size={15} />
              )}
              Send to kitchen
            </button>
          )}

          {order.status === 'ready' && (
            <button
              type="button"
              onClick={onServe}
              disabled={busy}
              className="btn-leaf"
            >
              {busy ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} />
              )}
              Serve order
            </button>
          )}

          {(order.status === 'served' ||
            order.status === 'completed') &&
            order.paymentStatus === 'unpaid' && (
              <button
                type="button"
                onClick={onBill}
                className="btn-soft"
              >
                <Banknote size={15} />
                Collect bill
              </button>
            )}
        </div>
      </div>
    </motion.article>
  );
}

/* -------------------------------------------------- */
/* Order details */
/* -------------------------------------------------- */

function OrderDetails({
  order,
  busy,
  onSendToKitchen,
  onServe,
  onBill,
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-cream-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">
              Order number
            </p>

            <p className="mt-1 font-display text-xl font-bold text-ink">
              {order.orderNumber}
            </p>
          </div>

          <StatusPill status={order.status} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <DetailItem
            label="Table"
            value={
              order.table?.name ||
              order.table?.number ||
              'Not assigned'
            }
          />

          <DetailItem
            label="Placed at"
            value={
              order.placedAt ? formatTime(order.placedAt) : '—'
            }
          />

          <DetailItem
            label="Payment"
            value={order.paymentStatus || 'Pending'}
          />

          <DetailItem
            label="Customer"
            value={order.customer?.name || 'Guest customer'}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-display text-lg font-bold text-ink">
          Ordered items
        </h3>

        <div className="space-y-3">
          {order.items?.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between gap-3 border-b border-cream-100 pb-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">
                  {item.quantity}× {item.name}
                </p>

                {item.optionsLabel && (
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {item.optionsLabel}
                  </p>
                )}
              </div>

              <p className="shrink-0 text-sm font-bold text-ink">
                {npr(item.lineTotal)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {order.specialRequests && (
        <div className="rounded-2xl bg-saffron/10 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-saffron-deep">
            Special request
          </p>

          <p className="mt-1 text-sm italic leading-6 text-ink-soft">
            {order.specialRequests}
          </p>
        </div>
      )}

      <div className="border-t border-dashed border-cream-200 pt-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-ink">Total</span>

          <span className="font-display text-xl font-black text-clay-700">
            {npr(order.grandTotal)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(order.status === 'pending' ||
          order.status === 'confirmed') && (
          <button
            type="button"
            onClick={onSendToKitchen}
            disabled={busy}
            className="btn-primary flex-1"
          >
            {busy ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <ChefHat size={15} />
            )}
            Send to kitchen
          </button>
        )}

        {order.status === 'ready' && (
          <button
            type="button"
            onClick={onServe}
            disabled={busy}
            className="btn-leaf flex-1"
          >
            {busy ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            Serve order
          </button>
        )}

        {(order.status === 'served' ||
          order.status === 'completed') &&
          order.paymentStatus === 'unpaid' && (
            <button
              type="button"
              onClick={onBill}
              className="btn-soft flex-1"
            >
              <Banknote size={15} />
              Collect bill
            </button>
          )}
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="mt-1 font-bold text-ink">{value}</p>
    </div>
  );
}

/* -------------------------------------------------- */
/* Bill */
/* -------------------------------------------------- */

function BillContent({ bill, collecting, onCollectCash }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-cream-50 px-4 py-3 text-sm text-ink-soft">
        <p className="font-bold text-ink">
          {bill.restaurantName || 'Restaurant'}
        </p>

        <p className="mt-1 text-xs">
          Table {bill.table?.number || '—'} ·{' '}
          {bill.placedAt ? formatTime(bill.placedAt) : ''}
        </p>
      </div>

      <div className="space-y-3">
        {bill.items?.map((item) => (
          <div
            key={item._id}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="text-ink-soft">
              {item.quantity}× {item.name}
            </span>

            <span className="font-bold text-ink">
              {npr(item.lineTotal)}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-dashed border-cream-200 pt-4 text-sm">
        <BillRow label="Subtotal" value={npr(bill.subtotal)} />

        {bill.discountTotal > 0 && (
          <BillRow
            label="Discount"
            value={`− ${npr(bill.discountTotal)}`}
            valueClass="text-leaf-dark"
          />
        )}

        <BillRow label="Tax" value={npr(bill.tax)} />

        <BillRow
          label="Service charge"
          value={npr(bill.serviceCharge)}
        />

        <div className="flex items-center justify-between border-t border-cream-100 pt-3">
          <span className="font-bold text-ink">Total due</span>

          <span className="font-display text-xl font-black text-clay-700">
            {npr(bill.grandTotal)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onCollectCash}
        disabled={collecting}
        className="btn-ink w-full"
      >
        {collecting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Banknote size={16} />
        )}

        {collecting
          ? 'Collecting payment...'
          : 'Confirm cash received'}
      </button>
    </div>
  );
}

function BillRow({ label, value, valueClass = 'text-ink' }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-soft">{label}</span>
      <span className={cx('font-semibold', valueClass)}>
        {value}
      </span>
    </div>
  );
}