import { Leaf } from 'lucide-react';
import { cx } from '../../lib/format';

export default function CategoryChips({ categories, active, onSelect, vegOnly, onVegToggle, resultCount }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 no-scrollbar sm:px-6">
      <button
        className={cx('chip shrink-0', !active && !vegOnly ? 'chip-active' : 'chip-idle')}
        onClick={() => onSelect(null)}
      >
        All {resultCount != null && <span className="opacity-70">({resultCount})</span>}
      </button>
      {categories.map((c) => (
        <button
          key={c._id}
          className={cx('chip shrink-0', active === c._id ? 'chip-active' : 'chip-idle')}
          onClick={() => onSelect(active === c._id ? null : c._id)}
        >
          {c.name}
        </button>
      ))}
      <button
        onClick={() => onVegOnly(!vegOnly)}
        className={cx(
          'chip shrink-0 border',
          vegOnly ? 'border-leaf/40 bg-leaf/10 text-leaf-dark' : 'chip-idle'
        )}
        aria-pressed={vegOnly}
      >
        <Leaf size={13} className={vegOnly ? 'text-leaf' : 'text-ink-faint'} />
        Veg only
      </button>
    </div>
  );
}