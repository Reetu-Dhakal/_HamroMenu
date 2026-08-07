'use client';

import { useEffect, useState } from 'react';
import { Plus, ChefHat, UserPlus, X } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import RoleGuard from '@/components/RoleGuard';
import DashboardShell from '@/components/DashboardShell';
import { useToast } from '@/components/Toast';
import { initials } from '@/lib/format';

export default function TeamPage() {
  return <RoleGuard roles={['admin']}><TeamManager /></RoleGuard>;
}

function TeamManager() {
  const toast = useToast();
  const [rid, setRid] = useState(null);
  const [staff, setStaff] = useState([]);
  const [kitchen, setKitchen] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [role, setRole] = useState('staff');
  const [form, setForm] = useState({ name: '', email: '', password: '', staffRole: 'waiter', station: 'main' });

  useEffect(() => {
    api.get('/admin/restaurants').then((r) => {
      if (r.data?.length) setRid(r.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!rid) return;
    api.get(`/admin/${rid}/staff`).then((r) => setStaff(r.data || []));
    api.get(`/admin/${rid}/kitchen`).then((r) => setKitchen(r.data || []));
  }, [rid]);

  const addUser = async () => {
    try {
      await api.post(role === 'staff' ? '/auth/register/staff' : '/auth/register/kitchen', {
        ...form,
        restaurant: rid,
      });
      toast.success(`${role === 'staff' ? 'Staff' : 'Kitchen'} account created`);
      setAddOpen(false);
      setForm({ name: '', email: '', password: '', staffRole: 'waiter', station: 'main' });
      api.get(`/admin/${rid}/staff`).then((r) => setStaff(r.data || []));
      api.get(`/admin/${rid}/kitchen`).then((r) => setKitchen(r.data || []));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <DashboardShell title="Staff & kitchen" subtitle="Manage your team accounts" roleColor="text-clay-600">
      <div className="mb-6 flex justify-end">
        <button className="btn-clay" onClick={() => setAddOpen(true)}><UserPlus className="h-4 w-4" /> Add team member</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TeamSection title="Staff" icon={<UserPlus className="h-4 w-4" />} people={staff} tone="text-sky-600" />
        <TeamSection title="Kitchen" icon={<ChefHat className="h-4 w-4" />} people={kitchen} tone="text-amber-600" />
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm" onClick={() => setAddOpen(false)}>
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 animate-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-ink-950">Add team member</h3>
              <button className="btn-ghost p-2" onClick={() => setAddOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 flex gap-2">
              <button className={`flex-1 rounded-xl py-2 text-sm font-semibold ${role === 'staff' ? 'bg-ink-950 text-cream' : 'bg-ink-900/5 text-ink-600'}`} onClick={() => setRole('staff')}>Staff</button>
              <button className={`flex-1 rounded-xl py-2 text-sm font-semibold ${role === 'kitchen' ? 'bg-ink-950 text-cream' : 'bg-ink-900/5 text-ink-600'}`} onClick={() => setRole('kitchen')}>Kitchen</button>
            </div>
            <div className="mt-4 space-y-3">
              <input className="input" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="input" type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              {role === 'staff' ? (
                <select className="input" value={form.staffRole} onChange={(e) => setForm({ ...form, staffRole: e.target.value })}>
                  <option value="waiter">Waiter</option>
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                </select>
              ) : (
                <select className="input" value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })}>
                  <option value="main">Main line</option>
                  <option value="grill">Grill</option>
                  <option value="dessert">Dessert</option>
                </select>
              )}
              <button className="btn-clay w-full" onClick={addUser}>Create account</button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function TeamSection({ title, icon, people, tone }) {
  return (
    <div className="card p-5">
      <h3 className={`flex items-center gap-2 font-display text-lg font-semibold text-ink-950 ${tone}`}>
        {icon} {title}
        <span className="badge ml-1 bg-ink-900/5 text-ink-600">{people.length}</span>
      </h3>
      <ul className="mt-4 space-y-3">
        {people.map((p) => (
          <li key={p._id} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-clay-100 text-sm font-bold text-clay-700">
              {initials(p.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900">{p.name}</p>
              <p className="truncate text-xs text-ink-500">{p.email}</p>
            </div>
            <span className="chip">{p.staffRole || p.station || p.role}</span>
          </li>
        ))}
        {people.length === 0 && <li className="py-4 text-center text-sm text-ink-500">No members yet</li>}
      </ul>
    </div>
  );
}