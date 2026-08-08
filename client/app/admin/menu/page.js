'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Upload, X, Leaf } from 'lucide-react';
import api, { uploadImage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import RoleGuard from '@/components/RoleGuard';
import DashboardShell from '@/components/DashboardShell';
import { useToast } from '@/components/Toast';
import { formatCurrency } from '@/lib/format';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop';

export default function AdminMenuPage() {
  return <RoleGuard roles={['admin']}><MenuManager /></RoleGuard>;
}

function MenuManager() {
  const toast = useToast();
  const [rid, setRid] = useState(null);
  const [data, setData] = useState({ items: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const [newCat, setNewCat] = useState('');

  const load = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/restaurants/${id}/menu?includeInactive=true`);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (rid) load(rid);
  }, [rid, load]);

  const pickRestaurant = useCallback(async () => {
    try {
      const res = await api.get('/admin/restaurants');
      if (res.data?.length) setRid(res.data[0]._id);
    } catch (err) {
      toast.error('Could not load restaurants');
    }
  }, [toast]);

  useEffect(() => {
    pickRestaurant();
  }, [pickRestaurant]);

  const onImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadImage(file, 'menu');
      setPreview(res.url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const saveItem = async () => {
    const d = editing;
    try {
      const body = { ...d };
      if (preview) {
        body.imageUrl = preview;
      }
      if (d._id) {
        await api.put(`/admin/items/${d._id}`, body);
      } else {
        await api.post(`/admin/restaurants/${rid}/items`, body);
      }
      toast.success('Saved');
      setEditing(null);
      setPreview('');
      load(rid);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const addCategory = async () => {
    if (!newCat.trim()) return;
    try {
      await api.post(`/admin/restaurants/${rid}/categories`, { name: newCat.trim() });
      toast.success('Category added');
      setNewCat('');
      load(rid);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <DashboardShell title="Menu management" subtitle="Add, edit and curate your dishes" roleColor="text-clay-600">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(data.categories || []).map((c) => (
            <span key={c._id} className="chip">{c.name}</span>
          ))}
        </div>
        <button className="btn-clay shrink-0" onClick={() => { setEditing({ name: '', price: 0, category: data.categories?.[0]?._id, isAvailable: true }); setPreview(''); }}>
          <Plus className="h-4 w-4" /> Add item
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-32" />)}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data.items || []).map((it) => (
              <div key={it._id} className="card overflow-hidden">
                <div className="relative aspect-video bg-ink-900/5">
                  <Image src={it.imageUrl || PLACEHOLDER} alt={it.name} fill className="object-cover" sizes="300px" />
                  <div className="absolute left-2 top-2 flex gap-1">
                    {it.isVeg && <span className="badge bg-emerald-600 text-white"><Leaf className="h-3 w-3" /></span>}
                    {!it.isAvailable && <span className="badge bg-stone-700 text-white">Unavailable</span>}
                  </div>
                </div>
                <div className="flex items-start justify-between gap-2 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-semibold text-ink-950">{it.name}</p>
                    <p className="text-sm text-ink-600">{formatCurrency(it.price)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button className="btn-ghost p-2" onClick={() => { setEditing(it); setPreview(''); }}><Pencil className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Category add */}
          <div className="card mt-6 flex flex-wrap items-center gap-3 p-4">
            <input
              className="input max-w-xs"
              placeholder="New category name"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
            />
            <button className="btn-outline" onClick={addCategory}>Add category</button>
          </div>
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/60 backdrop-blur-sm sm:items-center" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg animate-slide-up overflow-y-auto rounded-t-3xl bg-surface p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-ink-950">{editing._id ? 'Edit item' : 'New item'}</h3>
              <button className="btn-ghost p-2" onClick={() => setEditing(null)}><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Image */}
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-ink-900/5">
                  <Image src={preview || editing.imageUrl || PLACEHOLDER} alt="" fill className="object-cover" sizes="80px" />
                </div>
                <div>
                  <label className="btn-outline cursor-pointer">
                    <Upload className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload image'}
                    <input type="file" accept="image/*" className="sr-only" onChange={onImage} disabled={uploading} />
                  </label>
                  <p className="mt-1 text-xs text-ink-500">Uploaded to Cloudinary</p>
                </div>
              </div>

              <div>
                <label className="label">Name</label>
                <input className="input" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Price (NPR)</label>
                  <input className="input" type="number" value={editing.price || 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Prep time (min)</label>
                  <input className="input" type="number" value={editing.prepTimeMinutes || 10} onChange={(e) => setEditing({ ...editing, prepTimeMinutes: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <label className="label">Category</label>
                <select className="input" value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                  {(data.categories || []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-20" value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input type="checkbox" checked={!!editing.isVeg} onChange={(e) => setEditing({ ...editing, isVeg: e.target.checked })} /> Vegetarian
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input type="checkbox" checked={editing.isAvailable !== false} onChange={(e) => setEditing({ ...editing, isAvailable: e.target.checked })} /> Available
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button className="btn-clay flex-1" onClick={saveItem}>Save</button>
                {editing._id && (
                  <button className="btn-ghost text-red-600" onClick={() => api.del(`/admin/items/${editing._id}`).then(() => { setEditing(null); load(rid); }).catch((e) => toast.error(e.message))}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}