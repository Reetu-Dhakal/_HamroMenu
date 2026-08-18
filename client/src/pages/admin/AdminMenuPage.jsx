import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight, UtensilsCrossed } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { npr, SPICE_META, cx } from '../../lib/format';
import { SmartImage, Spinner, Sheet, VegDot, EmptyState } from '../../components/ui';

const EMPTY = { name: '', description: '', price: '', categoryId: '', isVeg: false, spiceLevel: 0, tag: '', imageUrl: '' };

export default function AdminMenuPage() {
  const { user } = useAuth();
  const toast = useToast();
  const rid = user?.restaurant;

  const [menu, setMenu] = useState(null);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState('');

  const load = useCallback(async () => {
    const data = await request(`/api/restaurants/${rid}/menu?search=${encodeURIComponent(filter)}`);
    setMenu(data);
  }, [rid, filter]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try { await load(); } catch (_) { /* ignore */ }
    })();
    return () => (alive = false);
  }, [load]);

  function openNew() { setEditing(null); setForm({ ...EMPTY, categoryId: menu?.categories?.[0]?._id || '' }); setSheetOpen(true); }
  function openEdit(item) {
    setEditing(item);
    setForm({
      name: item.name, description: item.description || '', price: String(item.price),
      categoryId: item.categoryId?._id || item.category?._id || item.categoryId || '',
      isVeg: item.isVeg, spiceLevel: item.spiceLevel || 0, tag: item.tag || '', imageUrl: item.imageUrl || '',
    });
    setSheetOpen(true);
  }

  async function save() {
    if (!form.name.trim() || !form.price) { toast.error('Name and price are required'); return; }
    setBusy(true);
    const body = { ...form, price: Number(form.price) };
    try {
      if (editing) {
        await request(`/api/admin/items/${editing._id}`, { method: 'PUT', body });
        toast.success('Item updated');
      } else {
        await request(`/api/admin/restaurants/${rid}/items`, { method: 'POST', body });
        toast.success('Item added to menu');
      }
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  function closeSheet() { setEditing(null); setForm(EMPTY); setSheetOpen(false); }

  async function toggleAvail(item) {
    try {
      await request(`/api/admin/items/${item._id}/availability`, { method: 'PATCH' });
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function remove(item) {
    setDeleting(item._id);
    try {
      await request(`/api/admin/items/${item._id}`, { method: 'DELETE' });
      toast.success(`${item.name} removed`);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting('');
    }
  }

  const items = menu?.items || [];
  const grouped = {};
  items.forEach((it) => {
    const cat = it.categoryId?.name || it.category?.name || 'Other';
    (grouped[cat] = grouped[cat] || []).push(it);
  });

  return (
    <div className="min-h-dvh">
      <Helmet><title>Menu management · HamroMenu</title></Helmet>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Menu</h1>
          <p className="text-[13px] font-medium text-ink-faint">{items.length} dishes across {Object.keys(grouped).length} categories</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16} /> Add dish</button>
      </header>

      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search dishes…" className="input w-full pl-9" />
      </div>

      {!menu ? (
        <div className="flex justify-center py-24"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="No dishes match" copy="Add dishes or clear the search." action={<button onClick={openNew} className="btn-primary"><Plus size={15} /> Add dish</button>} />
      ) : (
        Object.entries(grouped).map(([cat, list]) => (
          <section key={cat} className="mb-6">
            <h2 className="mb-2.5 px-1 font-display text-[15px] font-bold text-ink">{cat} <span className="text-[12px] font-semibold text-ink-faint">({list.length})</span></h2>
            <div className="overflow-hidden rounded-2xl bg-paper shadow-card">
              {list.map((it) => (
                <div key={it._id} className="flex items-center gap-3 border-b border-cream-100 p-3 last:border-0">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                    <SmartImage src={it.imageUrl} alt={it.name} ratio="1/1" rounded="rounded-xl" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <VegDot isVeg={it.isVeg} />
                      <p className={cx('truncate text-[14px] font-semibold', it.isAvailable ? 'text-ink' : 'text-ink-faint line-through')}>{it.name}</p>
                    </div>
                    <p className="text-[12px] text-ink-faint">
                      {npr(it.price)}{it.spiceLevel > 0 && SPICE_META[it.spiceLevel] ? ` · ${SPICE_META[it.spiceLevel].label}` : ''}{it.tag ? ` · #${it.tag}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => toggleAvail(it)} title={it.isAvailable ? 'Mark unavailable' : 'Mark available'} className="p-2 text-ink-faint hover:text-ink">
                      {it.isAvailable ? <ToggleRight size={20} className="text-leaf" /> : <ToggleLeft size={20} />}
                    </button>
                    <button onClick={() => openEdit(it)} className="p-2 text-ink-faint hover:text-clay-700"><Pencil size={15} /></button>
                    <button onClick={() => remove(it)} disabled={deleting === it._id} className="p-2 text-ink-faint hover:text-red-600">
                      {deleting === it._id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      <Sheet open={sheetOpen} onClose={closeSheet} title={editing ? `Edit · ${editing.name}` : 'Add dish'}>
        <div className="space-y-4">
          <Field label="Name *">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input w-full" placeholder="Dish name" />
          </Field>
          <Field label="Description">
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input w-full resize-none" placeholder="Brief description" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (Rs.) *">
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input w-full" placeholder="350" />
            </Field>
            <Field label="Tag">
              <input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="input w-full" placeholder="signature, chef, new" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input w-full">
                {(menu?.categories || []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Spice level">
              <select value={form.spiceLevel} onChange={(e) => setForm({ ...form, spiceLevel: Number(e.target.value) })} className="input w-full">
                <option value={0}>None</option>
                <option value={1}>Mild</option>
                <option value={2}>Medium</option>
                <option value={3}>Hot</option>
              </select>
            </Field>
          </div>
          <Field label="Image URL">
            <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="input w-full" placeholder="https://… (optional)" />
          </Field>
          <label className="flex items-center gap-2.5 text-[13.5px] font-semibold text-ink">
            <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm({ ...form, isVeg: e.target.checked })} className="h-4 w-4 accent-leaf" />
            Vegetarian
          </label>
          <button onClick={save} disabled={busy} className="btn-primary w-full">
            {busy ? <Loader2 size={16} className="animate-spin" /> : editing ? 'Save changes' : 'Add to menu'}
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-bold text-ink-soft">{label}</span>
      {children}
    </label>
  );
}