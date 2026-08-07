'use client';

import { useEffect, useState } from 'react';
import { Save, User } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import DashboardShell from '@/components/DashboardShell';
import { useToast } from '@/components/Toast';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [pwd, setPwd] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '' });
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      const body = { name: form.name, phone: form.phone };
      if (pwd) body.password = pwd;
      const res = await api.put('/profile', body);
      setUser(res.data);
      toast.success('Profile updated');
      setPwd('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell title="Profile" subtitle="Your personal details">
      <div className="max-w-lg space-y-4">
        <div className="card p-6">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-clay-100 text-2xl font-bold text-clay-700">
              <User className="h-7 w-7" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-ink-950">{user?.name}</p>
              <p className="text-sm text-ink-500">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">New password (optional)</label>
              <input className="input" type="password" placeholder="Leave blank to keep current" value={pwd} onChange={(e) => setPwd(e.target.value)} />
            </div>
          </div>
        </div>

        <button className="btn-clay w-full sm:w-auto" onClick={save} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </DashboardShell>
  );
}