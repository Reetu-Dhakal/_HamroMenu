import { Sparkles } from 'lucide-react';
import { npr } from '../../lib/format';
import { SmartImage, VegDot } from '../ui';

export default function RecommendationRail({ title, subtitle, items, onSelect, onAdd, personalized = false }) {
  if (!items?.length) return null;
  return (
    <section className="px-4 sm:px-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-saffron to-clay-600 text-white shadow-float">
          <Sparkles size={13} />
        </span>
        <div>
          <h2 className="font-display text-[17px] font-bold leading-tight text-ink">{title}</h2>
          <p className="text-[11.5px] font-medium text-ink-faint">{subtitle}</p>
        </div>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:-mx-6 sm:px-6">
        {items.map((it) => (
          <button
            key={it._id}
            onClick={() => onSelect(it)}
            className="w-36 shrink-0 text-left"
            aria-label={`${it.name}, ${npr(it.price)}`}
          >
            <div className="relative overflow-hidden rounded-2xl bg-paper shadow-card">
              <SmartImage src={it.imageUrl} alt={it.name} ratio="4/3" />
              {personalized && it.isFirst && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-gradient-to-r from-saffron to-clay-600 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white shadow">
                  <Sparkles size={9} /> Top pick
                </span>
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-1 px-0.5">
              <VegDot isVeg={it.isVeg} size={7} />
              <h3 className="line-clamp-1 text-[13px] font-semibold text-ink">{it.name}</h3>
            </div>
            <p className="px-0.5 text-[12px] font-bold text-clay-700">{npr(it.price)}</p>
          </button>
        ))}
      </div>
    </section>
  );
}