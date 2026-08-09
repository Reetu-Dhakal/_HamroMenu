import { Minus, Plus } from 'lucide-react';
import { cx } from '../../lib/format';

export default function QuantityStepper({ quantity, onChange, min = 1, max = 99, small = false }) {
  const btn = small ? 'h-8 w-8' : 'h-10 w-10';
  return (
    <div className="inline-flex items-center overflow-hidden rounded-full border border-cream-200 bg-white shadow-card">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={quantity <= min}
        onClick={() => onChange(Math.max(min, quantity - 1))}
        className={cx(
          btn,
          'flex items-center justify-center text-ink-soft transition-colors hover:bg-cream-50 hover:text-clay-700 disabled:cursor-not-allowed disabled:opacity-30'
        )}
      >
        <Minus size={small ? 14 : 16} />
      </button>
      <span className={cx('min-w-8 text-center font-bold tabular-nums', small ? 'text-sm' : 'text-base')}>{quantity}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={quantity >= max}
        onClick={() => onChange(Math.min(max, quantity + 1))}
        className={cx(
          btn,
          'flex items-center justify-center text-ink-soft transition-colors hover:bg-clay-50 hover:text-clay-700 disabled:cursor-not-allowed disabled:opacity-30'
        )}
      >
        <Plus size={small ? 14 : 16} />
      </button>
    </div>
  );
}