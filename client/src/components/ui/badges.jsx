import { Star } from 'lucide-react';
import { cx } from '../../lib/format';

export function VegDot({ isVeg, size = 10 }) {
  return (
    <span
      className={cx('inline-flex shrink-0 items-center justify-center rounded-[3px] border-2', isVeg ? 'border-leaf text-leaf' : 'border-red-500 text-red-500')}
      style={{ width: size + 6, height: size + 6 }}
      aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
      title={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <span className={cx('rounded-full', isVeg ? 'bg-leaf' : 'bg-red-500')} style={{ width: size, height: size }} />
    </span>
  );
}

export function Chip({ children, className }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold backdrop-blur', className)}>
      {children}
    </span>
  );
}

export function SpiceChip({ level, className }) {
  if (!level || level === 'mild') return null;
  const heat = { medium: 1, hot: 2, 'extra-hot': 3 }[level] || 1;
  const label = level === 'extra-hot' ? 'Extra hot' : level.charAt(0).toUpperCase() + level.slice(1);
  return (
    <Chip className={cx('text-clay-700', className)}>
      {label}
      {'🌶'.repeat(heat)}
    </Chip>
  );
}

export function RatingStars({ value = 0, size = 14, className, interactive = false, onChange }) {
  return (
    <span className={cx('inline-flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={interactive ? 'cursor-pointer transition-transform hover:scale-125' : 'cursor-default'}
        >
          <Star size={size} className={cx(n <= Math.round(value) ? 'fill-saffron text-saffron' : 'fill-cream-200 text-cream-200')} strokeWidth={1.5} />
        </button>
      ))}
    </span>
  );
}

export function StatusPill({ status }) {
  const meta = {
    pending: 'bg-saffron/15 text-saffron-deep',
    confirmed: 'bg-clay-100 text-clay-700',
    preparing: 'bg-clay-50 text-clay-600',
    ready: 'bg-leaf/10 text-leaf-dark',
    served: 'bg-leaf/15 text-leaf-dark',
    completed: 'bg-cream-100 text-ink-soft',
    cancelled: 'bg-red-50 text-red-700',
  };
  const labels = {
    pending: 'Placed',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    served: 'Served',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide', meta[status] || 'bg-cream-100 text-ink-soft')}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status] || status}
    </span>
  );
}

export default VegDot;