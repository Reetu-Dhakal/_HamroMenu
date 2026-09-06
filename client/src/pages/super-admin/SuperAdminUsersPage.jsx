import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users as UsersIcon, Search } from 'lucide-react';
import { request } from '../../lib/apiClient';
import DashboardShell from '../../components/layout/DashboardShell';
import { useToast } from '../../context/ToastContext';
import { initials, formatDate } from '../../lib/format';

const SA_SECTIONS = [
  { title: 'Platform', items: [
    { to: '/super-admin', label: 'Dashboard', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { to: '/super-admin/users', label: 'Users', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z"/></svg> },
    { to: '/super-admin/plans', label: 'Plans', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> },
    { to: '/super-admin/subscriptions', label: 'Subscriptions', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg> },
    { to: '/super-admin/reports', label: 'Reports', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
  ]},
];

const ROLE_LABELS = { customer: 'Customer', staff: 'Staff', kitchen: 'Kitchen', admin: 'Admin', super_admin: 'Super Admin' };
const ROLE_COLORS = { customer: 'bg-clay-100 text-clay-700', staff: 'bg-purple-100 text-purple-700', kitchen: 'bg-saffron/15 text-saffron-deep', admin: 'bg-clay-200 text-clay-800', super_admin: 'bg-red-100 text-red-700' };

export default function SuperAdminUsersPage() {
  const toast = useToast();
  const [selectedRole, setSelectedRole] = useState('customer');
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [countsData, usersData] = await Promise.all([
          request('/api/super-admin/users'),
          request(`/api/super-admin/users?role=${selectedRole}&limit=50`),
        ]);
        setCounts(countsData.counts || {});
        setUsers(usersData.users || []);
      } catch (e) {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedRole]);

  const filtered = users.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardShell brand="HamroMenu" sections={SA_SECTIONS}>
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="font-display text-2xl font-bold text-ink">User Management</h1>

        <div className="grid grid-cols-5 gap-3">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <button key={role} onClick={() => setSelectedRole(role)} className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition ${selectedRole === role ? 'bg-clay-600 text-white' : 'bg-white text-ink-soft border border-cream-200 hover:bg-cream-50'}`}>
              {label}
              <span className="ml-1 text-[10px] opacity-70">{counts[role] || 0}</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" className="input w-full pl-10" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-clay-600 border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-cream-200 bg-white p-12 text-center shadow-card">
            <UsersIcon size={40} className="mx-auto text-ink-faint" />
            <p className="mt-3 text-sm font-medium text-ink-faint">No {ROLE_LABELS[selectedRole]?.toLowerCase()}s found</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-cream-200 bg-cream-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-ink-faint">User</th>
                  <th className="px-4 py-3 font-semibold text-ink-faint">Email</th>
                  <th className="px-4 py-3 font-semibold text-ink-faint">Phone</th>
                  <th className="px-4 py-3 font-semibold text-ink-faint">Role</th>
                  <th className="px-4 py-3 font-semibold text-ink-faint">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {filtered.map(u => (
                  <tr key={u._id} className="hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-clay-100 text-xs font-bold text-clay-700">{initials(u.name)}</div>
                        <span className="font-medium text-ink">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                    <td className="px-4 py-3 text-ink-soft">{u.phone || '—'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>{ROLE_LABELS[u.role] || u.role}</span></td>
                    <td className="px-4 py-3 text-ink-faint">{formatDate(u.createdAt)}</td>
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
