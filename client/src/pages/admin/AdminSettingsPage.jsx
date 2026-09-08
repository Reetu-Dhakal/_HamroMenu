import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminSettingsPage() {
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', tagline: '', phone: '', email: '', street: '', city: '', state: '', isOpen: true });

  useEffect(() => {
    async function load() {
      try {
        if (user?.restaurant) {
          const data = await request(`/api/restaurants/${user.restaurant}`);
          setRestaurant(data);
          setForm({
            name: data.name || '',
            description: data.description || '',
            tagline: data.tagline || '',
            phone: data.contact?.phone || '',
            email: data.contact?.email || '',
            street: data.address?.street || '',
            city: data.address?.city || '',
            state: data.address?.state || '',
            isOpen: data.isOpen ?? true,
          });
        }
      } catch (e) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await request(`/api/admin/${user.restaurant}/profile`, {
        method: 'PATCH',
        body: {
          name: form.name,
          description: form.description,
          tagline: form.tagline,
          contact: { phone: form.phone, email: form.email },
          address: { street: form.street, city: form.city, state: form.state },
          isOpen: form.isOpen,
        },
      });
      toast.success('Settings saved');
      await refreshProfile();
    } catch (e) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardShell brand="HamroMenu" sections={ADMIN_SECTIONS}><div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-clay-600 border-t-transparent" /></div></DashboardShell>;

  return (
    <DashboardShell brand="HamroMenu" sections={ADMIN_SECTIONS}>
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Restaurant Settings</h1>
          <p className="mt-1 text-sm text-ink-faint">Manage your restaurant profile and preferences</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-card space-y-4">
            <h3 className="font-display text-base font-bold text-ink">General Information</h3>
            <div>
              <label className="text-xs font-medium text-ink-faint">Restaurant Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input mt-1 w-full" required />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-faint">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input mt-1 w-full" rows={3} />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-faint">Tagline</label>
              <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} className="input mt-1 w-full" placeholder="e.g. Authentic Nepali Cuisine" />
            </div>
          </div>

          <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-card space-y-4">
            <h3 className="font-display text-base font-bold text-ink">Contact</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-ink-faint">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input mt-1 w-full" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-faint">Email</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input mt-1 w-full" type="email" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-card space-y-4">
            <h3 className="font-display text-base font-bold text-ink">Address</h3>
            <div>
              <label className="text-xs font-medium text-ink-faint">Street</label>
              <input value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} className="input mt-1 w-full" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-ink-faint">City</label>
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="input mt-1 w-full" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-faint">State</label>
                <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="input mt-1 w-full" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-ink">Restaurant Status</h3>
                <p className="mt-1 text-sm text-ink-faint">{form.isOpen ? 'Currently open and accepting orders' : 'Currently closed'}</p>
              </div>
              <button type="button" onClick={() => setForm(f => ({ ...f, isOpen: !f.isOpen }))} className={`relative h-7 w-12 rounded-full transition-colors ${form.isOpen ? 'bg-clay-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${form.isOpen ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={16} />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}
