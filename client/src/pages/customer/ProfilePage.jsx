import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronRight, Mail, Phone, Loader2, Heart, Clock, User } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { initials } from '../../lib/format';
import { Spinner } from '../../components/ui';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [p, f] = await Promise.all([request('/api/profile'), request('/api/profile/favorites')]);
        if (!alive) return;
        setProfile(p);
        setFavorites(Array.isArray(f) ? f : []);
      } catch (_) { /* ignore */ }
    })();
    return () => (alive = false);
  }, []);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await request('/api/profile', { method: 'PUT', body: { name: profile.name, phone: profile.phone } });
      await refreshProfile();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-cream-50 pb-16">
      <Helmet><title>My profile · HamroMenu</title></Helmet>
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="card p-6 text-center">
          {!profile ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <>
              <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-clay-500 to-clay-700 font-display text-2xl font-black text-white shadow-float">
                {initials(profile.name)}
              </div>
              <h1 className="font-display text-xl font-bold text-ink">{profile.name}</h1>
              <p className="text-[13px] text-ink-faint capitalize">{profile.role}</p>

              <form onSubmit={save} className="mt-6 space-y-3 text-left">
                <label className="block">
                  <span className="mb-1.5 block text-[12.5px] font-bold text-ink-soft">Full name</span>
                  <div className="relative">
                    <User size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                    <input required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="input w-full pl-9" />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12.5px] font-bold text-ink-soft">Phone</span>
                  <div className="relative">
                    <Phone size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                    <input value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="input w-full pl-9" placeholder="98XXXXXXXX" />
                  </div>
                </label>
                <button type="submit" disabled={busy} className="btn-primary w-full">
                  {busy ? 'Saving…' : 'Save changes'}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-4 space-y-2.5">
          <Link to="/order-history" className="card flex items-center justify-between p-4 transition-shadow hover:shadow-cardHover">
            <span className="flex items-center gap-3 text-[14px] font-bold text-ink"><Clock size={17} className="text-clay-600" /> Order history</span>
            <ChevronRight size={17} className="text-ink-faint" />
          </Link>
          {favorites.length > 0 && (
            <div className="card p-4">
              <p className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-ink-faint"><Heart size={13} className="fill-clay-600 text-clay-600" /> Favourites ({favorites.length})</p>
              <ul className="space-y-1.5">
                {favorites.map((f) => (
                  <li key={f._id} className="flex items-center justify-between text-[13px]">
                    <span className="font-semibold text-ink-soft">{f.name}</span>
                    <span className="font-bold text-ink">{f.currency === 'NPR' ? 'Rs.' : 'Rs.'} {f.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}