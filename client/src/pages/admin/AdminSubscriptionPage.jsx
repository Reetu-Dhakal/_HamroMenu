import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Check, ArrowUpRight, FileText, AlertCircle } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { npr } from '../../lib/format';
import DashboardShell from '../../components/layout/DashboardShell';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ADMIN_SECTIONS = [
  { title: 'Management', items: [
    { to: '/admin', label: 'Dashboard', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { to: '/admin/menu', label: 'Menu', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg> },
    { to: '/admin/categories', label: 'Categories', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg> },
    { to: '/admin/tables', label: 'Tables & QR', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 3l-4 4-4-4"/></svg> },
    { to: '/admin/orders', label: 'Orders', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg> },
    { to: '/admin/staff', label: 'Staff', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
    { to: '/admin/reviews', label: 'Reviews', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg> },
    { to: '/admin/analytics', label: 'Analytics', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
  ]},
  { title: 'Account', items: [
    { to: '/admin/subscription', label: 'Subscription', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg> },
    { to: '/admin/verification', label: 'Verification', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
    { to: '/admin/settings', label: 'Settings', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
  ]},
];

export default function AdminSubscriptionPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [sub, plns, useData] = await Promise.all([
          request('/api/my/subscription'),
          request('/api/subscription-plans'),
          request('/api/my/usage'),
        ]);
        setSubscription(sub);
        setPlans(plns);
        setUsage(useData);
      } catch (e) {
        toast.error(e.message || 'Failed to load subscription');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleChangePlan = async (planId) => {
    if (!confirm('Change your subscription plan?')) return;
    setChanging(true);
    try {
      await request('/api/my/subscription/change-plan', { method: 'POST', body: { planId } });
      toast.success('Plan updated successfully');
      const [sub, useData] = await Promise.all([
        request('/api/my/subscription'),
        request('/api/my/usage'),
      ]);
      setSubscription(sub);
      setUsage(useData);
    } catch (e) {
      toast.error(e.message || 'Failed to change plan');
    } finally {
      setChanging(false);
    }
  };

  if (loading) return <DashboardShell brand="HamroMenu" sections={ADMIN_SECTIONS}><div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-clay-600 border-t-transparent" /></div></DashboardShell>;

  const currentPlan = subscription?.plan;
  const statusColor = { ACTIVE: 'bg-green-100 text-green-700', TRIALING: 'bg-blue-100 text-blue-700', PAST_DUE: 'bg-red-100 text-red-700', EXPIRED: 'bg-red-100 text-red-700', CANCELLED: 'bg-gray-100 text-gray-600' };

  return (
    <DashboardShell brand="HamroMenu" sections={ADMIN_SECTIONS}>
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Subscription & Billing</h1>
          <p className="mt-1 text-sm text-ink-faint">Manage your subscription plan and billing</p>
        </div>

        {subscription && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-cream-200 bg-white p-6 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">{currentPlan?.name || 'Free Trial'}</h2>
                <p className="mt-1 text-sm text-ink-faint">{npr(currentPlan?.price || 0)}/month</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColor[subscription.status] || 'bg-gray-100 text-gray-600'}`}>
                {subscription.status}
              </span>
            </div>
            {subscription.currentPeriodEnd && (
              <p className="mt-3 text-sm text-ink-faint">
                Current period ends: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </motion.div>
        )}

        {usage && currentPlan && (
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Tables', used: usage.tables?.used || 0, max: usage.tables?.max || 0 },
              { label: 'Menu Items', used: usage.menuItems?.used || 0, max: usage.menuItems?.max || 0 },
              { label: 'Staff Accounts', used: usage.staff?.used || 0, max: usage.staff?.max || 0 },
            ].map((u) => (
              <div key={u.label} className="rounded-2xl border border-cream-200 bg-white p-5 shadow-card">
                <p className="text-sm font-semibold text-ink-faint">{u.label}</p>
                <p className="mt-2 font-display text-2xl font-bold text-ink">{u.used} <span className="text-sm font-normal text-ink-faint">/ {u.max === -1 ? '∞' : u.max}</span></p>
                {u.max !== -1 && (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream-100">
                    <div className="h-full rounded-full bg-clay-500 transition-all" style={{ width: `${Math.min(100, (u.used / u.max) * 100)}%` }} />
                  </div>
                )}
                {u.max !== -1 && u.used >= u.max && (
                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-red-600"><AlertCircle size={12} /> Limit reached — upgrade to add more</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div>
          <h2 className="font-display text-xl font-bold text-ink">Available Plans</h2>
          <p className="mt-1 text-sm text-ink-faint">Choose the plan that fits your restaurant</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = currentPlan?._id === plan._id;
            return (
              <motion.div key={plan._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`relative rounded-2xl border bg-white p-6 shadow-card ${isCurrent ? 'border-clay-500 ring-2 ring-clay-200' : 'border-cream-200'}`}>
                {isCurrent && <span className="absolute -top-3 left-4 rounded-full bg-clay-600 px-3 py-0.5 text-[10px] font-bold text-white">CURRENT</span>}
                <h3 className="font-display text-lg font-bold text-ink">{plan.name}</h3>
                <p className="mt-2 font-display text-3xl font-bold text-clay-600">{npr(plan.price)}<span className="text-sm font-normal text-ink-faint">/mo</span></p>
                <p className="mt-2 text-xs text-ink-faint">{plan.description}</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-xs text-ink-soft"><Check size={14} className="text-green-500" /> Up to {plan.maxTables === -1 ? '∞' : plan.maxTables} tables</li>
                  <li className="flex items-center gap-2 text-xs text-ink-soft"><Check size={14} className="text-green-500" /> Up to {plan.maxMenuItems === -1 ? '∞' : plan.maxMenuItems} menu items</li>
                  <li className="flex items-center gap-2 text-xs text-ink-soft"><Check size={14} className="text-green-500" /> {plan.maxStaffAccounts === -1 ? '∞' : plan.maxStaffAccounts} staff accounts</li>
                  {plan.featureFlags?.get?.('hasRecommendations') && <li className="flex items-center gap-2 text-xs text-ink-soft"><Check size={14} className="text-green-500" /> KNN recommendations</li>}
                  {plan.featureFlags?.get?.('hasApriori') && <li className="flex items-center gap-2 text-xs text-ink-soft"><Check size={14} className="text-green-500" /> Frequently ordered together</li>}
                  {plan.featureFlags?.get?.('hasAdvancedReports') && <li className="flex items-center gap-2 text-xs text-ink-soft"><Check size={14} className="text-green-500" /> Advanced reports</li>}
                </ul>
                <button
                  onClick={() => handleChangePlan(plan._id)}
                  disabled={isCurrent || changing}
                  className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isCurrent ? 'bg-cream-100 text-ink-faint cursor-not-allowed' : 'bg-clay-600 text-white hover:bg-clay-700 active:scale-[0.97]'}`}
                >
                  {isCurrent ? 'Current Plan' : changing ? 'Changing…' : 'Switch Plan'}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
