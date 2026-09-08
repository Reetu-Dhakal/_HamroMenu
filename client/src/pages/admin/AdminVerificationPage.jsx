import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react';
import { request } from '../../lib/apiClient';
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

const STATUS_CONFIG = {
  VERIFIED: { icon: CheckCircle, color: 'text-leaf-dark', bg: 'bg-leaf/10', label: 'Verified' },
  PENDING: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending Verification' },
  MANUAL_REVIEW: { icon: Clock, color: 'text-saffron-deep', bg: 'bg-saffron/15', label: 'Under Review' },
  REJECTED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Verification Failed' },
};

export default function AdminVerificationPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (user?.restaurant) {
          const data = await request(`/api/restaurants/${user.restaurant}`);
          setRestaurant(data);
        }
      } catch (e) {
        toast.error('Failed to load verification status');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) return <DashboardShell brand="HamroMenu" sections={ADMIN_SECTIONS}><div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-clay-600 border-t-transparent" /></div></DashboardShell>;

  const status = restaurant?.verificationStatus || 'PENDING';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const StatusIcon = config.icon;
  const checks = restaurant?.verificationChecks || {};

  const requiredChecks = [
    { key: 'businessName', label: 'Business Name' },
    { key: 'address', label: 'Address' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'email', label: 'Email' },
    { key: 'panNumber', label: 'PAN Number' },
    { key: 'businessRegistrationNumber', label: 'Business Registration Number' },
    { key: 'documentsUploaded', label: 'Required Documents' },
  ];

  const completeness = Math.round((requiredChecks.filter(c => checks[c.key]).length / requiredChecks.length) * 100);

  return (
    <DashboardShell brand="HamroMenu" sections={ADMIN_SECTIONS}>
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Business Verification</h1>
          <p className="mt-1 text-sm text-ink-faint">Submit your business details for verification</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border p-6 shadow-card ${config.bg} border-cream-200`}>
          <div className="flex items-center gap-3">
            <StatusIcon size={24} className={config.color} />
            <div>
              <h2 className={`font-display text-lg font-bold ${config.color}`}>{config.label}</h2>
              {restaurant?.verificationNote && <p className="mt-1 text-sm text-ink-soft">{restaurant.verificationNote}</p>}
            </div>
          </div>
        </motion.div>

        <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-card">
          <h3 className="font-display text-base font-bold text-ink">Verification Completeness Score</h3>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-16 w-16">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#EBD9C1" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#C08552" strokeWidth="3" strokeDasharray={`${completeness}, 100`} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-display text-sm font-bold text-ink">{completeness}%</span>
            </div>
            <div className="flex-1 space-y-1.5">
              {requiredChecks.map(c => (
                <div key={c.key} className="flex items-center gap-2 text-sm">
                  {checks[c.key] ? <CheckCircle size={14} className="text-saffron-deep" /> : <AlertTriangle size={14} className="text-yellow-500" />}
                  <span className={checks[c.key] ? 'text-ink-soft' : 'text-ink-faint'}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-card">
          <h3 className="font-display text-base font-bold text-ink">Business Information</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-ink-faint">Restaurant Name</label>
              <p className="mt-1 text-sm font-medium text-ink">{restaurant?.name || '—'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-faint">PAN Number</label>
              <p className="mt-1 text-sm font-medium text-ink">{restaurant?.panNumber ? `****${restaurant.panNumber.slice(-4)}` : '—'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-faint">Registration Number</label>
              <p className="mt-1 text-sm font-medium text-ink">{restaurant?.businessRegistrationNumber || '—'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-faint">Address</label>
              <p className="mt-1 text-sm font-medium text-ink">{restaurant?.address ? `${restaurant.address.street || ''}, ${restaurant.address.city || ''}` : '—'}</p>
            </div>
          </div>
        </div>

        {status === 'REJECTED' && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h3 className="font-display text-base font-bold text-red-700">Verification Failed</h3>
            <p className="mt-2 text-sm text-red-600">Please update your information and contact support to resubmit.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
