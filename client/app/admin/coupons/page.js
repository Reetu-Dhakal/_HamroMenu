'use client';

import { useEffect, useState, useCallback } from 'react';
import { Trash2, Ticket } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import RoleGuard from '@/components/RoleGuard';
import DashboardShell from '@/components/DashboardShell';
import { useToast } from '@/components/Toast';
import { formatCurrency } from '@/lib/format';

export default function CouponsPage() {
  return <RoleGuard roles={['admin']}><CouponManager /></RoleGuard>;
}

function CouponManager() {
  const toast = useToast();
  const [rid, setRid] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async (id) => {
    if (!id) return;
    const res = await api.get(`/admin/${id}/coupons`);
    setCoupons(res.data || []);
  }, []);

  useEffect(() => {
    api.get('/admin/restaurants').then((r) => {
      if (r.data?.length) {
        setRid(r.data[0]._id);
        load(r.data[0]._id);
      }
    });
  }, [load]);

  const form = { code: '', discountType: 'percentage', discountValue: 10, minOrder: 0, maxUses: 0 };
  const [draft, setDraft] = useState(form);

  const save = async () => {
    if (editing) {
      await api.patch(`/admin/coupons/${editing._id}`, draft);
      toast.success('Coupon updated');
    } else {
      await api.post(`/admin/${rid}/coupons`, draft);
      toast.success('Coupon created');
    }
    setEditing(null);
    setDraft(form);
    load(rid);
  };

  const remove = async (id) => {
    await api.del(`/admin/coupons/${id}`);
    toast.success('Coupon deleted');
    load(rid);
  };

  return (
    <DashboardShell title="Coupons" subtitle="Create and manage discount codes" roleColor="text-clay-600">
      <div className="card mb-6 space-y-3 p-5">
        <p className="font-display text-lg font-semibold text-ink-950">{editing ? 'Edit coupon' : 'New coupon'}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input className="input" placeholder="CODE (e.g. SAVE10)" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} />
          <select className="input" value={draft.discountType} onChange={(e) => setDraft({ ...draft, discountType: e.target.value })}>
            <option value="percentage">Percentage</option>
            <option value="flat">Flat amount</option>
          </select>
          <input className="input" type="number" placeholder="Value" value={draft.discountValue} onChange={(e) => setDraft({ ...draft, discountValue: Number(e.target.value) })} />
          <input className="input" type="number" placeholder="Min order" value={draft.minOrder} onChange={(e) => setDraft({ ...draft, minOrder: Number(e.target.value) })} />
          <button className="btn-clay" onClick={save}>{editing ? 'Update' : 'Create'}</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coupons.map((c) => (
          <div key={c._id} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-display text-lg font-bold tracking-wide text-ink-950">
                <Ticket className="h-5 w-5 text-clay-500" /> {c.code}
              </span>
              <span className={`badge ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'}`}>{c.isActive ? 'Active' : 'Off'}</span>
            </div>
            <p className="mt-2 text-sm text-ink-600">
              {c.discountType === 'percentage' ? `${c.discountValue}% off` : `${formatCurrency(c.discountValue)} off`}
              {c.minOrder > 0 && ` on orders over ${formatCurrency(c.minOrder)}`}
            </p>
            <div className="mt-3 flex gap-2 border-t border-ink-900/5 pt-3">
              <button className="btn-outline flex-1 !py-1.5 text-xs" onClick={() => { setEditing(c); setDraft({ code: c.code, discountType: c.discountType, discountValue: c.discountValue, minOrder: c.minOrder || 0 }); }}>
                Edit
              </button>
              <button className="btn-ghost !py-1.5 text-xs text-red-600" onClick={() => remove(c._id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {coupons.length === 0 && <p className="text-sm text-ink-500">No coupons yet — create your first above.</p>}
      </div>
    </DashboardShell>
  );
}