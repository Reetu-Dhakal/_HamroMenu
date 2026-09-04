import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { npr, formatDate } from '../../lib/format';
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

const STATUS_COLORS = { ACTIVE: 'bg-green-100 text-green-700', TRIALING: 'bg-blue-100 text-blue-700', PAST_DUE: 'bg-red-100 text-red-700', EXPIRED: 'bg-gray-100 text-gray-600', CANCELLED: 'bg-gray-100 text-gray-600' };

export default function SuperAdminSubscriptionsPage() {
  const toast = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await request('/api/super-admin/subscriptions');
        setData(result);
      } catch (e) {
        toast.error('Failed to load subscriptions');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <DashboardShell brand="HamroMenu" sections={SA_SECTIONS}><div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-clay-600 border-t-transparent" /></div></DashboardShell>;

  return (
    <DashboardShell brand="HamroMenu" sections={SA_SECTIONS}>
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="font-display text-2xl font-bold text-ink">Subscriptions</h1>
        {data.length === 0 ? (
          <div className="rounded-2xl border border-cream-200 bg-white p-12 text-center shadow-card">
            <CreditCard size={40} className="mx-auto text-ink-faint" />
            <p className="mt-3 text-sm font-medium text-ink-faint">No subscriptions yet</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-cream-200 bg-cream-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-ink-faint">Restaurant</th>
                  <th className="px-4 py-3 font-semibold text-ink-faint">Plan</th>
                  <th className="px-4 py-3 font-semibold text-ink-faint">Status</th>
                  <th className="px-4 py-3 font-semibold text-ink-faint">Price</th>
                  <th className="px-4 py-3 font-semibold text-ink-faint">Period End</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {data.map((r) => (
                  <tr key={r.id} className="hover:bg-cream-50">
                    <td className="px-4 py-3 font-medium text-ink">{r.name}</td>
                    <td className="px-4 py-3 text-ink-soft">{r.subscription?.plan || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[r.subscription?.status] || 'bg-gray-100 text-gray-600'}`}>
                        {r.subscription?.status || 'None'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{r.subscription?.planPrice != null ? npr(r.subscription.planPrice) : '—'}</td>
                    <td className="px-4 py-3 text-ink-faint">{r.subscription?.currentPeriodEnd ? formatDate(r.subscription.currentPeriodEnd) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
