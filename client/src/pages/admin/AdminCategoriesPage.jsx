import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Spinner, Sheet } from '../../components/ui';

export default function AdminCategoriesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const rid = user?.restaurant;

  const [menu, setMenu] = useState(null);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await request(`/api/restaurants/${rid}/menu`);
    setMenu(data);
  }, [rid]);

  useEffect(() => {
    (async () => {
      try { await load(); } catch (_) { /* ignore */ }
    })();
  }, [load]);

  const categories = menu?.categories || [];
  const items = menu?.items || [];
  const counts = {};
  items.forEach((i) => {
    const id = i.categoryId?._id || i.category?._id || i.categoryId;
    counts[id] = (counts[id] || 0) + 1;
  });

  function openNew() { setEditing(null); setName(''); setSheetOpen(true); }
  function openEdit(c) { setEditing(c); setName(c.name); setSheetOpen(true); }

  async function save() {
    if (!name.trim()) { toast.error('Category name required'); return; }
    setBusy(true);
    try {
      if (editing) {
        await request(`/api/admin/categories/${editing._id}`, { method: 'PATCH', body: { name } });
        toast.success('Category renamed');
      } else {
        await request(`/api/admin/restaurants/${rid}/categories`, { method: 'POST', body: { name } });
        toast.success('Category added');
      }
      setName(''); setEditing(null); setSheetOpen(false);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(cat) {
    if (!window.confirm(`Delete "${cat.name}"? Dishes in it become uncategorized.`)) return;
    try {
      await request(`/api/admin/categories/${cat._id}`, { method: 'DELETE' });
      toast.success('Category deleted');
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="min-h-dvh">
      <Helmet><title>Categories · HamroMenu</title></Helmet>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Categories</h1>
          <p className="text-[13px] font-medium text-ink-faint">Group dishes so diners find them fast</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16} /> New category</button>
      </header>

      {!menu ? (
        <div className="flex justify-center py-24"><Spinner /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c._id} className="card flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clay-50 font-display text-sm font-black text-clay-700">
                {c.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[15px] font-bold text-ink">{c.name}</p>
                <p className="text-[11.5px] font-semibold text-ink-faint">{counts[c._id] || 0} dishes</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button className="p-2 text-ink-faint hover:text-clay-700" onClick={() => openEdit(c)} aria-label="Rename category"><Pencil size={15} /></button>
                <button className="p-2 text-ink-faint hover:text-red-600" onClick={() => remove(c)} aria-label="Delete category"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editing ? 'Rename category' : 'New category'}>
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-bold text-ink-soft">Name *</span>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="input w-full" placeholder="Starters" onKeyDown={(e) => e.key === 'Enter' && save()} />
          </label>
          <button onClick={save} disabled={busy} className="btn-primary w-full">
            {busy ? <Loader2 size={16} className="animate-spin" /> : editing ? 'Save' : 'Create'}
          </button>
        </div>
      </Sheet>
    </div>
  );
}