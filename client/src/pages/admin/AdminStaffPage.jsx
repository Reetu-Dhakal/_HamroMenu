import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Loader2, ChefHat, UserRound, Mail } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { initials, cx } from '../../lib/format';
import { Spinner, Sheet } from '../../components/ui';

export default function AdminStaffPage() {
  const { user } = useAuth();
  const toast = useToast();
  const rid = user?.restaurant;

  const [staff, setStaff] = useState(null);
  const [kitchen, setKitchen] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [kind, setKind] = useState('staff');
  const [form, setForm] = useState({ name: '', email: '', phone: '', staffRole: 'waiter', station: 'main', password: 'password123' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!rid) return;
    const [s, k] = await Promise.all([
      request(`/api/admin/${rid}/staff`),
      request(`/api/admin/${rid}/kitchen`),
    ]);
    setStaff(Array.isArray(s) ? s : []);
    setKitchen(Array.isArray(k) ? k : []);
  }, [rid]);

  useEffect(() => {
    (async () => { try { await load(); } catch (_) { /* ignore */ } })();
  }, [load]);

  async function invite() {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email required'); return; }
    setBusy(true);
    try {
      if (kind === 'staff') {
        await request('/api/auth/register/staff', {
          method: 'POST',
          body: { ...form, restaurant: rid },
        });
        toast.success(`Invited ${form.name} as ${form.staffRole}`);
      } else {
        await request('/api/auth/register/kitchen', {
          method: 'POST',
          body: { name: form.name, email: form.email, phone: form.phone, password: form.password, restaurant: rid, station: form.staffRole },
        });
        toast.success(`Invited ${form.name} to the kitchen`);
      }
      setSheetOpen(false);
      setForm({ name: '', email: '', phone: '', staffRole: kind === 'staff' ? 'waiter' : 'kitchen', password: 'password123', station: '' });
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <Helmet><title>Team · HamroMenu</title></Helmet>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Team</h1>
          <p className="text-[13px] font-medium text-ink-faint">Floor staff and kitchen crew</p>
        </div>
        <button onClick={() => { setKind('staff'); setForm({ name: '', email: '', phone: '', staffRole: 'waiter', password: 'password123', station: '' }); setSheetOpen(true); }} className="btn-primary">
          <Plus size={16} /> Invite staff
        </button>
      </header>

      {!staff ? (
        <div className="flex justify-center py-24"><Spinner /></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-2.5 flex items-center gap-2 px-1 font-display text-[15px] font-bold text-ink">
              <UserRound size={16} className="text-clay-600" /> Floor staff <span className="text-[12px] font-semibold text-ink-faint">({staff.length})</span>
            </h2>
            <div className="space-y-2">
              {staff.map((s) => (
                <StaffRow key={s._id} s={s} extra={s.staffRole} />
              ))}
              {staff.length === 0 && <p className="card p-4 text-center text-[13px] text-ink-faint">No staff yet.</p>}
            </div>
          </section>
          <section>
            <h2 className="mb-2.5 flex items-center gap-2 px-1 font-display text-[15px] font-bold text-ink">
              <ChefHat size={16} className="text-clay-600" /> Kitchen <span className="text-[12px] font-semibold text-ink-faint">({kitchen?.length || 0})</span>
            </h2>
            <div className="space-y-2">
              {(kitchen || []).map((s) => (
                <StaffRow key={s._id} s={s} extra={`station · ${s.station || 'main'}`} />
              ))}
              {kitchen?.length === 0 && <p className="card p-4 text-center text-[13px] text-ink-faint">No kitchen crew yet.</p>}
            </div>
          </section>
        </div>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Invite team member">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { setKind('staff'); setForm((f) => ({ ...f, staffRole: 'waiter' })); }} className={cx('btn-soft', kind === 'staff' && '!bg-clay-600 !text-white')}>Floor staff</button>
            <button onClick={() => { setKind('kitchen'); setForm((f) => ({ ...f, staffRole: 'kitchen' })); }} className={cx('btn-soft', kind === 'kitchen' && '!bg-ink !text-white')}>Kitchen</button>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-bold text-ink-soft">Full name *</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input w-full" placeholder="Sita Gurung" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-bold text-ink-soft">Email *</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input w-full" placeholder="sita@himalayanflavors.com" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-bold text-ink-soft">Phone</span>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input w-full" placeholder="98XXXXXXXX" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-bold text-ink-soft">Role</span>
              <select value={form.staffRole} onChange={(e) => setForm({ ...form, staffRole: e.target.value })} className="input w-full">
                {kind === 'staff' ? (
                  <>
                    <option value="waiter">Waiter</option>
                    <option value="captain">Captain</option>
                    <option value="cashier">Cashier</option>
                  </>
                ) : (
                  <>
                    <option value="kitchen">Cook</option>
                    <option value="main">Station · main</option>
                  </>
                )}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-bold text-ink-soft">Temporary password (min 6)</span>
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input w-full" />
          </label>
          <button onClick={invite} disabled={busy} className="btn-primary w-full">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={15} />} Send invite
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function StaffRow({ s, extra }) {
  return (
    <div className="card flex items-center gap-3 p-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clay-100 text-[13px] font-bold text-clay-700">
        {initials(s.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-ink">{s.name}</p>
        <p className="truncate text-[11.5px] text-ink-faint flex items-center gap-1"><Mail size={10} /> {s.email} · <span className="capitalize">{extra}</span></p>
      </div>
      <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', s.isActive ? 'bg-leaf/10 text-leaf' : 'bg-cream-200 text-ink-faint')}>
        {s.isActive ? 'active' : 'disabled'}
      </span>
    </div>
  );
}