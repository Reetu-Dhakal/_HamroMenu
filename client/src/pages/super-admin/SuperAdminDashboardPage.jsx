import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building, Clock, CheckCircle, TrendingUp, Users, ChevronRight, X } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';
import DashboardShell from '../../components/layout/DashboardShell';
import { StatusPill, EmptyState } from '../../components/ui';

const SA_SECTIONS = [
  { title: 'Platform', items: [
    { to: '/super-admin', label: 'Dashboard', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { to: '/super-admin/users', label: 'Users', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z"/></svg> },
    { to: '/super-admin/plans', label: 'Plans', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> },
    { to: '/super-admin/subscriptions', label: 'Subscriptions', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg> },
    { to: '/super-admin/reports', label: 'Reports', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
  ]},
];

export default function SuperAdminDashboardPage() {
  const toast = useToast();
  const [overview, setOverview] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [ov, apps] = await Promise.all([
          request('/api/super-admin/overview'),
          request('/api/super-admin/applications'),
        ]);
        setOverview(ov);
        setApplications(apps);
      } catch (e) {
        toast.error(e.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAction = async (action, id, reason = '') => {
    setActionLoading(id);
    try {
      await request(`/api/super-admin/applications/${id}/${action}`, { method: 'POST', body: { reason } });
      toast.success(action === 'approve' ? 'Restaurant approved' : action === 'reject' ? 'Restaurant rejected' : 'Correction requested');
      setApplications(apps => apps.filter(a => a._id !== id));
      setSelectedApp(null);
    } catch (e) {
      toast.error(e.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingApps = applications.filter(a => a.verificationStatus === 'PENDING');

  return (
    <DashboardShell brand="HamroMenu" sections={SA_SECTIONS}>
      <div className="space-y-8">
        <h1 className="font-display text-2xl font-bold text-ink">Platform Overview</h1>

        {overview && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Restaurants', value: overview.totalRestaurants || 0, icon: Building, color: 'bg-clay-100 text-clay-700' },
              { label: 'Active Restaurants', value: overview.activeRestaurants || 0, icon: CheckCircle, color: 'bg-leaf/15 text-leaf-dark' },
              { label: 'Pending Applications', value: overview.pendingApplications || 0, icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
              { label: 'Total Orders', value: overview.totalOrders || 0, icon: TrendingUp, color: 'bg-saffron/15 text-saffron-deep' },
            ].map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-cream-200 bg-white p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}><card.icon size={18} /></div>
                  <div>
                    <p className="text-xs font-medium text-ink-faint">{card.label}</p>
                    <p className="font-display text-2xl font-bold text-ink">{card.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-cream-200 bg-white shadow-card">
          <div className="border-b border-cream-200 px-6 py-4">
            <h2 className="font-display text-lg font-bold text-ink">Restaurant Applications</h2>
            <p className="text-sm text-ink-faint">{pendingApps.length} pending review</p>
          </div>
          {pendingApps.length === 0 ? (
            <div className="p-12">
              <EmptyState icon={CheckCircle} title="No pending applications" copy="All restaurant applications have been reviewed." />
            </div>
          ) : (
            <div className="divide-y divide-cream-100">
              {pendingApps.map((app) => (
                <div key={app._id} className="flex items-center justify-between px-6 py-4 hover:bg-cream-50">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-ink">{app.name}</h3>
                    <p className="text-xs text-ink-faint">Reg: {app.businessRegistrationNumber || '—'}</p>
                    <p className="text-xs text-ink-faint">Submitted: {new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedApp(app)} className="btn-soft text-xs px-3 py-1.5">View</button>
                    <button onClick={() => handleAction('approve', app._id)} disabled={actionLoading === app._id} className="rounded-xl bg-clay-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-clay-800">Approve</button>
                    <button onClick={() => handleAction('reject', app._id, 'Rejected by admin')} disabled={actionLoading === app._id} className="rounded-xl bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <h2 className="font-display text-xl font-bold text-ink">{selectedApp.name}</h2>
                <button onClick={() => setSelectedApp(null)} className="text-ink-faint hover:text-ink"><X size={20} /></button>
              </div>
              <div className="mt-4 space-y-3">
                <div><label className="text-[10px] font-bold uppercase text-ink-faint">Address</label><p className="text-sm text-ink">{selectedApp.address?.street || '—'}, {selectedApp.address?.city || '—'}</p></div>
                <div><label className="text-[10px] font-bold uppercase text-ink-faint">Registration Number</label><p className="text-sm text-ink">{selectedApp.businessRegistrationNumber || '—'}</p></div>
                <div><label className="text-[10px] font-bold uppercase text-ink-faint">Verification Status</label><div className="mt-1"><StatusPill status={selectedApp.verificationStatus} /></div></div>
                <div><label className="text-[10px] font-bold uppercase text-ink-faint">Documents</label><p className="text-sm text-ink">{selectedApp.documents?.length || 0} uploaded</p></div>
                {selectedApp.verificationNote && <div><label className="text-[10px] font-bold uppercase text-ink-faint">Notes</label><p className="text-sm text-ink">{selectedApp.verificationNote}</p></div>}
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => handleAction('approve', selectedApp._id)} disabled={actionLoading === selectedApp._id} className="flex-1 rounded-xl bg-clay-700 py-2.5 text-sm font-semibold text-white hover:bg-clay-800">Approve</button>
                <button onClick={() => { const r = prompt('Rejection reason:'); if (r) handleAction('reject', selectedApp._id, r); }} disabled={actionLoading === selectedApp._id} className="flex-1 rounded-xl bg-red-100 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-200">Reject</button>
                <button onClick={() => { const r = prompt('What information is needed?'); if (r) handleAction('request-correction', selectedApp._id, r); }} disabled={actionLoading === selectedApp._id} className="flex-1 rounded-xl bg-clay-100 py-2.5 text-sm font-semibold text-clay-700 hover:bg-clay-200">Request Info</button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
