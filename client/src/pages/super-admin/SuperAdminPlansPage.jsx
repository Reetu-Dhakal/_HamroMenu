import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Edit2 } from 'lucide-react';
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

export default function SuperAdminPlansPage() {
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const data = await request('/api/super-admin/plans');
        setPlans(data);
      } catch (e) {
        toast.error('Failed to load plans');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (planId) => {
    try {
      const updated = await request(`/api/super-admin/plans/${planId}`, { method: 'PUT', body: form });
      setPlans(plans.map(p => p._id === planId ? updated : p));
      setEditing(null);
      toast.success('Plan updated');
    } catch (e) {
      toast.error(e.message || 'Failed to update plan');
    }
  };

  if (loading) return <DashboardShell brand="HamroMenu" sections={SA_SECTIONS}><div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-clay-600 border-t-transparent" /></div></DashboardShell>;

  return (
    <DashboardShell brand="HamroMenu" sections={SA_SECTIONS}>
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="font-display text-2xl font-bold text-ink">Subscription Plans</h1>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <motion.div key={plan._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-cream-200 bg-white p-6 shadow-card">
              <div className="flex items-start justify-between">
                <h3 className="font-display text-lg font-bold text-ink">{plan.name}</h3>
                <button onClick={() => { setEditing(plan._id); setForm({ price: plan.price, maxTables: plan.maxTables, maxMenuItems: plan.maxMenuItems, maxStaffAccounts: plan.maxStaffAccounts }); }} className="text-ink-faint hover:text-clay-600"><Edit2 size={14} /></button>
              </div>
              {editing === plan._id ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-[10px] font-medium text-ink-faint">Price ($/mo)</label>
                    <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="input mt-1 w-full" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-medium text-ink-faint">Tables</label>
                      <input type="number" value={form.maxTables} onChange={e => setForm(f => ({ ...f, maxTables: Number(e.target.value) }))} className="input mt-1 w-full" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-ink-faint">Items</label>
                      <input type="number" value={form.maxMenuItems} onChange={e => setForm(f => ({ ...f, maxMenuItems: Number(e.target.value) }))} className="input mt-1 w-full" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-ink-faint">Staff</label>
                      <input type="number" value={form.maxStaffAccounts} onChange={e => setForm(f => ({ ...f, maxStaffAccounts: Number(e.target.value) }))} className="input mt-1 w-full" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(plan._id)} className="btn-primary flex-1 text-xs py-1.5">Save</button>
                    <button onClick={() => setEditing(null)} className="btn-secondary flex-1 text-xs py-1.5">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-3 font-display text-3xl font-bold text-clay-600">{npr(plan.price)}<span className="text-sm font-normal text-ink-faint">/mo</span></p>
                  <p className="mt-2 text-xs text-ink-faint">{plan.description}</p>
                  <ul className="mt-4 space-y-1.5">
                    <li className="flex items-center gap-2 text-xs text-ink-soft"><Check size={12} className="text-green-500" /> {plan.maxTables === -1 ? '∞' : plan.maxTables} tables</li>
                    <li className="flex items-center gap-2 text-xs text-ink-soft"><Check size={12} className="text-green-500" /> {plan.maxMenuItems === -1 ? '∞' : plan.maxMenuItems} menu items</li>
                    <li className="flex items-center gap-2 text-xs text-ink-soft"><Check size={12} className="text-green-500" /> {plan.maxStaffAccounts === -1 ? '∞' : plan.maxStaffAccounts} staff</li>
                  </ul>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
