import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, QrCode, Download, RefreshCw, Loader2, MapPin } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cx } from '../../lib/format';
import { Spinner, Sheet } from '../../components/ui';

export default function AdminTablesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const rid = user?.restaurant;

  const [tables, setTables] = useState(null);
  const [qrs, setQrs] = useState(null);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({ number: '', area: '', capacity: 4, name: '' });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [regenerating, setRegenerating] = useState('');

  const load = useCallback(async () => {
    const [t, q] = await Promise.all([
      request(`/api/admin/${rid}/tables`),
      request(`/api/admin/${rid}/qrcodes`),
    ]);
    setTables(Array.isArray(t) ? t : []);
    setQrs(Array.isArray(q) ? q : []);
  }, [rid]);

  useEffect(() => {
    (async () => {
      try { await load(); } catch (_) { /* ignore */ }
    })();
  }, [load]);

  async function addTable() {
    if (!form.number) { toast.error('Table number required'); return; }
    setBusy(true);
    try {
      await request(`/api/admin/${rid}/tables`, {
        method: 'POST',
        body: {
          number: Number(form.number),
          label: form.name || `Table ${form.number}`,
          area: form.area,
          capacity: Number(form.capacity) || 4,
        },
      });
      toast.success('Table added — QR ready');
      setSheetOpen(false);
      setForm({ number: '', name: '', capacity: 4 });
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function regen(tableId) {
    setRegenerating(tableId);
    try {
      await request(`/api/restaurants/${rid}/tables/${tableId}/qr/regenerate`, { method: 'POST' });
      toast.success('QR regenerated — new QR displayed');
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRegenerating('');
    }
  }

  const qrByTable = {};
  (qrs || []).forEach((q) => { qrByTable[q.table?.toString()] = q; });

  return (
    <div className="min-h-dvh">
      <Helmet><title>Tables & QR · HamroMenu</title></Helmet>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Tables & QR codes</h1>
          <p className="text-[13px] font-medium text-ink-faint">Each table scans its QR to open the menu instantly</p>
        </div>
        <button onClick={() => setSheetOpen(true)} className="btn-primary"><Plus size={16} /> Add table</button>
      </header>

      {!tables ? (
        <div className="flex justify-center py-24"><Spinner /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((t) => {
            const qr = qrByTable[t._id?.toString()];
            return (
              <div key={t._id} className="card overflow-hidden">
                <div className={cx('px-4 py-3', t.status === 'occupied' ? 'bg-clay-600/10' : 'bg-leaf/10')}>
                  <div className="flex items-center justify-between">
                    <p className="font-display text-[16px] font-black text-ink">{t.label || t.name || `Table ${t.number}`}</p>
                    <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', t.status === 'occupied' ? 'bg-clay-600 text-white' : 'bg-leaf text-white')}>
                      {t.status || 'free'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-ink-faint flex items-center gap-1">
                    <MapPin size={11} /> {t.area || 'Main hall'} · seats {t.capacity || 4}
                  </p>
                </div>
                <div className="flex items-center gap-3 p-4">
                  {qr?.dataUrl ? (
                    <img src={qr.dataUrl} alt={`QR for ${t.label || t.name}`} className="h-20 w-20 rounded-xl ring-1 ring-cream-200" />
                  ) : (
                    <span className="flex h-20 w-20 items-center justify-center rounded-xl bg-cream-100 text-ink-faint"><QrCode size={26} /></span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-faint">
                      <QrCode size={12} /> Scan → /menu/table/{t.number}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-faint break-all">{qr?.scans || 0} scans</p>
                    <div className="mt-2 flex gap-1.5">
                      <button onClick={() => setActive(t)} className="btn-soft !px-3 !py-1 text-[11.5px]">
                        <QrCode size={12} /> View
                      </button>
                      <button onClick={() => regenerate(t._id)} disabled={regenerating === t._id} className="btn-ghost !px-3 !py-1 text-[11.5px]">
                        {regenerating === t._id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} New code
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={!!active} onClose={() => setActive(null)} title={active ? `${active.label || active.name || `Table ${active.number}`} · QR` : ''}>
        {active && (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-full max-w-[240px] rounded-2xl bg-white p-4 shadow-card">
              <img src={qrByTable[active._id?.toString()]?.dataUrl} alt="QR" className="w-full rounded-xl" />
              <p className="mt-2 text-[12px] font-bold text-ink">Scan to open {active.label || active.name || `Table ${active.number}`}</p>
              <p className="text-[11px] text-ink-faint">No app install — opens straight in the browser</p>
            </div>
            <a
              href={qrByTable[active._id?.toString()]?.dataUrl}
              download={`hamromenu-${active.number || active.name}.png`}
              className="btn-primary w-full"
            >
              <Download size={15} /> Download PNG
            </a>
          </div>
        )}
      </Sheet>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Add table">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-bold text-ink-soft">Table number *</span>
            <input type="number" min="1" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="input w-full" placeholder="13" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-bold text-ink-soft">Display name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input w-full" placeholder="Table 13" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-bold text-ink-soft">Area</span>
              <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="input w-full" placeholder="Terrace / Rooftop" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-bold text-ink-soft">Seats</span>
            <input type="number" min="1" max="40" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="input w-full" placeholder="4" />
          </label>
          <button onClick={addTable} disabled={busy} className="btn-primary w-full">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={15} />} Create table + QR
          </button>
        </div>
      </Sheet>
    </div>
  );
}