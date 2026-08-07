'use client';

import { useEffect, useState } from 'react';
import { Save, Upload } from 'lucide-react';
import api, { uploadImage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import RoleGuard from '@/components/RoleGuard';
import DashboardShell from '@/components/DashboardShell';
import { useToast } from '@/components/Toast';

export default function SettingsPage() {
  return <RoleGuard roles={['admin']}><SettingsEditor /></RoleGuard>;
}

function SettingsEditor() {
  const toast = useToast();
  const [rid, setRid] = useState(null);
  const [form, setForm] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/restaurants').then((r) => {
      if (r.data?.length) {
        setRid(r.data[0]._id);
        api.get(`/restaurants/${r.data[0]._id}`).then((res) => {
          const d = res.data;
          setForm({
            name: d.name, tagline: d.tagline, description: d.description,
            phone: d.contact?.phone || '', email: d.contact?.email || '', website: d.contact?.website || '',
            city: d.address?.city || '', street: d.address?.street || '',
            isOpen: !!d.isOpen,
          });
        });
      }
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/restaurants/${rid}`, {
        name: form.name, tagline: form.tagline, description: form.description,
        contact: { phone: form.phone, email: form.email, website: form.website },
        address: { city: form.city, street: form.street },
        isOpen: form.isOpen,
      });
      toast.success('Restaurant updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <DashboardShell title="Settings"><div className="skeleton h-40" /></DashboardShell>;

  return (
    <DashboardShell title="Settings" subtitle="Update your restaurant profile" roleColor="text-clay-600">
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-ink-900/5 bg-surface p-4">
          <div>
            <p className="font-display text-lg font-semibold text-ink-950">Restaurant open</p>
            <p className="text-sm text-ink-500">Controls the "Open now" badge on the menu & landing page</p>
          </div>
          <button
            onClick={() => setForm({ ...form, isOpen: !form.isOpen })}
            className={`relative h-7 w-12 rounded-full transition ${form.isOpen ? 'bg-emerald-500' : 'bg-stone-300'}`}
            aria-label="Toggle open"
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${form.isOpen ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="card space-y-4 p-6">
          <div>
            <label className="label">Restaurant name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Tagline</label>
            <input className="input" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="label">Email</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="label">Website</label><input className="input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
            <div><label className="label">City</label><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          </div>
          <div>
            <label className="label">Street address</label>
            <input className="input" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
          </div>
        </div>

        <button className="btn-clay w-full sm:w-auto" onClick={save} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </DashboardShell>
  );
}