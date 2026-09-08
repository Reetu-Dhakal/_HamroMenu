import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, ShoppingCart, Building } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { npr } from '../../lib/format';
import DashboardShell from '../../components/layout/DashboardShell';
import { useToast } from '../../context/ToastContext';

const SA_SECTIONS = [
  { title: 'Platform', items: [
    { to: '/super-admin', label: 'Dashboard', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { to: '/super-admin/users', label: 'Users', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z"/></svg> },
    { to: '/super-admin/plans', label: 'Plans', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> },
    { to: '/super-admin/subscriptions', label: 'Subscriptions', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg> },
    { to: '/super-admin/reports', label: 'Reports', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
  ]},
];

export default function SuperAdminReportsPage() {
  const toast = useToast();
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ov, rv] = await Promise.all([
          request('/api/super-admin/overview'),
          request('/api/super-admin/revenue'),
        ]);
        setOverview(ov);
        setRevenue(rv);
      } catch (e) {
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <DashboardShell brand="HamroMenu" sections={SA_SECTIONS}><div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-clay-600 border-t-transparent" /></div></DashboardShell>;

  return (
    <DashboardShell brand="HamroMenu" sections={SA_SECTIONS}>
      <div className="mx-auto max-w-5xl space-y-8">
        <h1 className="font-display text-2xl font-bold text-ink">Platform Reports</h1>

        {overview && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Restaurants', value: overview.totalRestaurants || 0, icon: Building, color: 'bg-clay-100 text-clay-700' },
              { label: 'Pending Applications', value: overview.pendingApplications || 0, icon: ShoppingCart, color: 'bg-yellow-100 text-yellow-700' },
              { label: 'Total Orders', value: overview.totalOrders || 0, icon: TrendingUp, color: 'bg-saffron/15 text-saffron-deep' },
              { label: 'Platform Revenue', value: npr(revenue?.totalRevenue || 0), icon: DollarSign, color: 'bg-leaf/15 text-leaf-dark' },
            ].map((card) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-cream-200 bg-white p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}><card.icon size={18} /></div>
                  <div>
                    <p className="text-xs font-medium text-ink-faint">{card.label}</p>
                    <p className="font-display text-xl font-bold text-ink">{card.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {revenue?.byStatus && revenue.byStatus.length > 0 && (
          <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-card">
            <h3 className="font-display text-base font-bold text-ink">Revenue by Payment Status</h3>
            <div className="mt-4 space-y-3">
              {revenue.byStatus.map((s) => (
                <div key={s._id} className="flex items-center gap-4">
                  <span className="w-24 text-sm font-medium text-ink-soft capitalize">{s._id || 'Unknown'}</span>
                  <div className="flex-1 h-6 overflow-hidden rounded-full bg-cream-100">
                    <div className="h-full rounded-full bg-clay-500" style={{ width: `${Math.min(100, (s.count / (overview?.totalOrders || 1)) * 100)}%` }} />
                  </div>
                  <span className="w-20 text-right text-sm font-semibold text-ink">{npr(s.total || 0)}</span>
                  <span className="w-12 text-right text-xs text-ink-faint">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {revenue?.byPlan && revenue.byPlan.length > 0 && (
          <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-card">
            <h3 className="font-display text-base font-bold text-ink">Subscriptions by Plan</h3>
            <div className="mt-4 space-y-3">
              {revenue.byPlan.map((p) => (
                <div key={p._id} className="flex items-center justify-between rounded-xl bg-cream-50 px-4 py-3">
                  <span className="text-sm font-semibold text-ink">{p.plan?.name || 'Unknown'}</span>
                  <span className="text-sm text-ink-faint">{p.count} restaurants</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
