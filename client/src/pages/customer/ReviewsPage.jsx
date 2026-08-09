import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Star, MessageSquareQuote, Loader2, ChevronLeft, Send, X } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';
import { npr, formatTime, cx } from '../../lib/format';
import { RatingStars, Spinner, EmptyState, Sheet } from '../../components/ui';

function StarPicker({ value, onChange }) {
  return (
    <div className="flex justify-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" aria-label={`${n} star`} onClick={() => onChange(n)}>
          <Star size={30} className={cx('transition-transform hover:scale-110', n <= value ? 'fill-saffron text-saffron' : 'text-cream-300')} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const toast = useToast();
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const menuItemId = params.get('item');

  const [mine, setMine] = useState(null);
  const [order, setOrder] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(!!orderId);

  const [selItem, setSelItem] = useState(menuItemId || '');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const reviews = await request('/api/profile/reviews');
        setMine(Array.isArray(reviews) ? reviews : []);
      } catch (_) { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const o = await request(`/api/orders/${orderId}`);
        setOrder(o);
      } catch (_) { /* ignore */ }
    })();
  }, [orderId]);

  async function submit() {
    if (!selItem || !comment.trim()) { toast.error('Pick a dish and write a short review'); return; }
    setSending(true);
    try {
      const rid = order?.restaurant;
      if (!rid) throw new Error('Order not found');
      await request(`/api/restaurants/${rid}/reviews`, {
        method: 'POST',
        body: { order: orderId, menuItem: selItem, rating, title, comment },
      });
      toast.success('Review submitted — thank you!');
      setSheetOpen(false);
      setComment(''); setTitle('');
      const reviews = await request('/api/profile/reviews');
      setMine(Array.isArray(reviews) ? reviews : []);
      setOrder(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-dvh bg-cream-50 pb-16">
      <Helmet><title>Reviews · HamroMenu</title></Helmet>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-cream-200 bg-cream-50/95 px-4 py-3 backdrop-blur">
        <Link to="/profile" className="btn-ghost !px-3" aria-label="Back"><ChevronLeft size={18} /></Link>
        <div>
          <h1 className="font-display text-lg font-bold text-ink">My reviews</h1>
          <p className="text-[12px] font-medium text-ink-faint">Reviews help the kitchen improve</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 px-4 py-5 sm:px-6">
        {!mine && <div className="flex justify-center py-16"><Spinner /></div>}
        {mine?.length === 0 && (
          <EmptyState icon={MessageSquareQuote} title="No reviews yet" copy="Finished a meal? Tell everyone what to order." />
        )}
        {mine?.map((r) => (
          <article key={r._id} className="card p-4">
            <div className="flex items-center justify-between">
              <RatingStars value={r.rating} size={15} />
              <span className="text-[11.5px] text-ink-faint">{r.createdAt ? formatTime(r.createdAt) : ''}</span>
            </div>
            {r.title && <p className="mt-2 font-display text-[15px] font-bold text-ink">{r.title}</p>}
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">{r.comment}</p>
            {!r.isApproved && <p className="mt-2 text-[11.5px] font-bold text-saffron-deep">Pending approval</p>}
          </article>
        ))}
      </main>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Review your order">
        {!order ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-cream-50 px-4 py-3 text-[12.5px] text-ink-soft">
              <span className="font-bold text-ink">{order.orderNumber}</span> · {order.itemCount} items · {npr(order.grandTotal)}
            </div>
            <div>
              <span className="mb-2 block text-[12.5px] font-bold text-ink-soft">Which dish are you reviewing?</span>
              <div className="space-y-2">
                {order.items.map((it) => (
                  <button
                    key={it._id}
                    onClick={() => setSelItem(it.menuItem)}
                    className={cx('flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors', selItem === it.menuItem ? 'border-clay-600 bg-clay-50' : 'border-cream-200 bg-white')}
                  >
                    <span className="text-[14px]">{it.name}</span>
                    <span className="ml-auto text-[12px] text-ink-faint">×{it.quantity}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-2 block text-[12.5px] font-bold text-ink-soft">Rating</span>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <textarea rows={4} placeholder="How was it? Crispy, juicy, spicy enough…" value={comment} onChange={(e) => setComment(e.target.value)} className="input w-full resize-none !py-3" />
            <button onClick={submit} disabled={sending} className="btn-primary w-full">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <><Send size={15} /> Submit review</>}
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}