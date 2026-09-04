import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Building } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { npr, nprCompact } from '../../lib/format';
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
              { label: 'Total Orders', value: overview.totalOrders || 0, icon: TrendingUp, color: 'bg-blue-100 text-blue-700' },
              { label: 'Platform Revenue', value: npr(revenue?.totalRevenue || 0), icon: DollarSign, color: 'bg-green-100 text-green-700' },
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
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue.byStatus.map(s => ({ name: s._id || 'Unknown', count: s.count, total: s.total || 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3e8d8" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => npr(v)} />
                  <Bar dataKey="total" fill="#C24A0E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
