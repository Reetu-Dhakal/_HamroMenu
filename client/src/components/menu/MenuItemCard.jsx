import { motion } from 'framer-motion';
import { Plus, Flame } from 'lucide-react';
import { npr, cx } from '../../lib/format';
import { SmartImage, VegDot } from '../ui';

export default function MenuItemCard({ item, onSelect, onQuickAdd, recipe = {} }) {
  const price = Number(item.discountedPrice ?? item.price);
  const hasOptions = (item.options || []).length > 0;
  const effective = recipe.price || price;

  return (
    <motion.button
      layout
      onClick={() => onSelect(item)}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-paper text-left shadow-card transition-shadow duration-300 hover:shadow-cardHover"
      whileTap={{ scale: 0.97 }}
      aria-label={`${item.name}, ${npr(effective)}`}
    >
      <div className="relative">
        <SmartImage src={item.imageUrl} alt={item.name} ratio="4/3" />
        <div className="absolute left-2 top-2 flex items-center gap-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow">
            <VegDot isVeg={item.isVeg} size={8} />
          </span>
          {item.spiceLevel && item.spiceLevel !== 'mild' && (
            <span className="flex items-center gap-0.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-clay-700 shadow">
              <Flame size={9} className="fill-clay-500 text-clay-600" />
              {item.spiceLevel}
            </span>
          )}
        </div>
        {(item.isRecommended || item.isPopular) && (
          <span className="absolute bottom-2 left-2 rounded-full bg-ink/60 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white backdrop-blur">
            {item.isPopular ? 'Popular' : 'Chef pick'}
          </span>
        )}
        {Number(item.discountedPrice) > 0 && Number(item.discountedPrice) < Number(item.price) && (
          <span className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
            {Math.round(((item.price - item.discountedPrice) / item.price) * 100)}% OFF
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-1 font-display text-[15px] font-semibold leading-snug text-ink">{item.name}</h3>
        <p className="line-clamp-2 text-[12px] leading-relaxed text-ink-faint">{item.description}</p>
        <div className="mt-auto flex items-center justify-between pt-1.5">
          <div className="flex flex-col">
            {Number(item.discountedPrice) > 0 && Number(item.discountedPrice) < Number(item.price) && (
              <span className="text-[11px] font-medium text-ink-faint line-through">{npr(item.price)}</span>
            )}
            <span className="font-display text-[15px] font-bold text-ink">{npr(effective)}</span>
          </div>
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(item);
            }}
            className={cx(
              'flex h-10 w-10 items-center justify-center rounded-full bg-clay-600 text-white shadow-float transition-transform active:scale-90',
              hasOptions && 'ring-2 ring-clay-200'
            )}
            aria-label={`Add ${item.name} to cart`}
          >
            {hasOptions && <span className="text-[10px] font-bold">+</span>}
            <Plus size={hasOptions ? 0 : 18} />
          </span>
        </div>
      </div>
    </motion.button>
  );
}