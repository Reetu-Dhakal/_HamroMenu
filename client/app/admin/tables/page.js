'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Plus, QrCode, Download, RefreshCw, Trash2, Check } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import RoleGuard from '@/components/RoleGuard';
import DashboardShell from '@/components/DashboardShell';
import { useToast } from '@/components/Toast';

export default function AdminTablesPage() {
  return <RoleGuard roles={['admin']}><TablesManager /></RoleGuard>;
}

function TablesManager() {
  const toast = useToast();
  const [rid, setRid] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await api.get(`/admin/${id}/tables`);
      setTables(res.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/admin/restaurants').then((r) => {
      if (r.data?.length) {
        setRid(r.data[0]._id);
        load(r.data[0]._id);
      }
    });
  }, [load]);

  const addTable = async () => {
    const n = tables.length + 1;
    try {
      await api.post(`/admin/${rid}/tables`, { label: `T${n}`, number: n, capacity: 4, area: 'Main Hall' });
      toast.success('Table added');
      load(rid);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getQR = async (table) => {
    try {
      const res = await api.get(`/restaurants/${rid}/tables/${table._id}/qr`);
      setSelected(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <DashboardShell title="Tables & QR" subtitle="Manage seating and table QR codes" roleColor="text-clay-600">
      <div className="mb-6 flex justify-end">
        <button className="btn-clay" onClick={addTable}><Plus className="h-4 w-4" /> Add table</button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-24" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {tables.map((t) => (
            <div key={t._id} className="card p-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-xl font-bold text-ink-950">{t.label}</p>
                <span className={`badge ${t.status === 'free' ? 'bg-emerald-100 text-emerald-700' : 'bg-clay-100 text-clay-700'}`}>{t.status}</span>
              </div>
              <p className="text-xs text-ink-500">{t.area} · {t.capacity} seats</p>
              <div className="mt-3 flex gap-2">
                <button className="btn-outline flex-1 !py-2 text-xs" onClick={() => getQR(t)}>
                  <QrCode className="h-3.5 w-3.5" /> QR
                </button>
                <button className="btn-ghost !py-2 text-xs" onClick={() => api.post(`/restaurants/${rid}/tables/${t._id}/qr/regenerate`).then(() => toast.success('QR regenerated')).catch((e) => toast.error(e.message))}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="w-full max-w-xs rounded-3xl bg-surface p-6 text-center animate-pop" onClick={(e) => e.stopPropagation()}>
            <p className="font-display text-lg font-semibold text-ink-950">Table QR code</p>
            <p className="text-xs text-ink-500">Scan to open this table's menu</p>
            <div className="mx-auto mt-4 h-48 w-48 overflow-hidden rounded-2xl bg-white p-2">
              <Image src={selected.dataUrl || ''} alt="QR" width={176} height={176} className="h-full w-full object-contain" unoptimized />
            </div>
            <a className="btn-clay mt-5 w-full" href={selected.dataUrl} download={`table-${selected.table}.png`}>
              <Download className="h-4 w-4" /> Download QR
            </a>
            <button className="btn-ghost mt-2" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}