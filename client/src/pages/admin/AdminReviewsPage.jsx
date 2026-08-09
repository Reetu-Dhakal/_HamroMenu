import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Loader2, BadgeCheck, Trash2, MessageCircle } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { timeAgo, cx } from '../../lib/format';
import { RatingStars, Spinner, EmptyState } from '../../components/ui';

export default function AdminReviewsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const rid = user?.restaurant;

  const [reviews, setReviews] = useState(null);
  const [filters, setFilters] = useState('all');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    const data = await request(`/api/admin/${rid}/reviews`);
    setReviews(Array.isArray(data) ? data : []);
  }, [rid]);

  useEffect(() => {
    (async () => { try { await load(); } catch (_) { /* ignore */ } })();
  }, [load]);

  async function setApproved(r, val) {
    setBusyId(r._id);
    try {
      await request(`/api/admin/reviews/${r._id}`, { method: 'PATCH', body: { isApproved: val } });
      toast.success(val ? 'Review approved — now public' : 'Review hidden');
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId('');
    }
  }

  async function remove(r) {
    if (!window.confirm('Delete this review permanently?')) return;
    setBusyId(r._id);
    try {
      await request(`/api/admin/reviews/${r._id}`, { method: 'DELETE' });
      toast.success('Review deleted');
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId('');
    }
  }

  const list = (reviews || []).filter((r) => (filters === 'pending' ? !r.isApproved : filters === 'live' ? r.isApproved : true));

  return (
    <div className="min-h-dvh">
      <Helmet><title>Review moderation · HamroMenu</title></Helmet>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Review moderation</h1>
          <p className="text-[13px] font-medium text-ink-faint">Approve reviews before they go public</p>
        </div>
        <div className="flex gap-1.5">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'live', label: 'Visible' },
          ].map((t) => (
            <button key={t.key} onClick={() => setFilters(t.key)} className={cx('chip', filters === t.key && 'bg-ink text-white ring-ink')}>{t.label}</button>
          ))}
        </div>
      </header>

      {!reviews ? (
        <div className="flex justify-center py-24"><Spinner /></div>
      ) : list.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No reviews" copy="Customer reviews appear here for moderation." />
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <article key={r._id} className={cx('card p-4', !r.isApproved && 'ring-1 ring-saffron/30')}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <RatingStars value={r.rating} size={14} />
                  <span className="text-[12px] font-semibold text-ink-faint">
                    {r.customer?.name || 'Customer'} · {r.createdAt ? timeAgo(r.createdAt) : ''}
                  </span>
                </div>
                {!r.isApproved && <span className="rounded-full bg-saffron/15 px-2.5 py-1 text-[10px] font-bold uppercase text-saffron-deep">Pending</span>}
              </div>
              {r.title && <p className="mt-2.5 font-display text-[15px] font-bold text-ink">{r.title}</p>}
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">{r.comment}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-cream-200 pt-3">
                <span className="text-[11.5px] text-ink-faint">{r.restaurantName || ''}</span>
                <div className="flex gap-2">
                  {!r.isApproved ? (
                    <button onClick={() => setApproved(r, true)} disabled={busyId === r._id} className="btn-leaf !px-3.5 !py-1.5 text-[12px]">
                      {busyId === r._id ? <Loader2 size={13} className="animate-spin" /> : <BadgeCheck size={13} />} Approve
                    </button>
                  ) : (
                    <button onClick={() => setApproved(r, false)} disabled={busyId === r._id} className="btn-ghost !px-3.5 !py-1.5 text-[12px]">Hide</button>
                  )}
                  <button onClick={() => remove(r)} disabled={busyId === r._id} className="flex h-9 w-9 items-center justify-center rounded-xl text-red-600 hover:bg-red-50" aria-label="Delete review">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}