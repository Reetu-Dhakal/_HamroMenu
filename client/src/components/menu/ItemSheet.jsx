import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Leaf } from 'lucide-react';
import { Sheet, SmartImage, VegDot, QuantityStepper } from '../ui';
import { npr, cx } from '../../lib/format';

export default function ItemSheet({ item, open, onClose, onAdd, recipe }) {
  const [options, setOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [note, setNote] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOptions({});
    setQuantity(1);
    setSpecialInstructions('');
    setNote(false);
  }, [open, item?._id]);

  const unitPrice = useMemo(() => {
    if (!item) return 0;
    let p = Number(item.price);
    for (const group of item.options || []) {
      const chosen = options[group.title];
      if (chosen) {
        const choice = (group.choices || []).find((c) => c.label === chosen);
        if (choice) p += Number(choice.priceDelta) || 0;
      }
    }
    return Math.round(p * 100) / 100;
  }, [item, options]);

  const missingRequired = useMemo(() => {
    if (!item) return false;
    const required = (item.options || []).filter((g) => g.required);
    return required.some((g) => !options[g.title]);
  }, [item, options]);

  if (!item) return null;

  return (
    <Sheet open={open} onClose={onClose} title={item.name}>
      <div className="relative -mt-2 mb-4 overflow-hidden rounded-2xl">
        <SmartImage src={item.imageUrl} alt={item.name} ratio="16/9" rounded="rounded-2xl" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow">
            <VegDot isVeg={item.isVeg} size={9} />
          </span>
          {item.spiceLevel && item.spiceLevel !== 'mild' && (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold capitalize text-clay-700 shadow">
              {item.spiceLevel === 'extra-hot' ? 'extra hot' : item.spiceLevel}
            </span>
          )}
        </div>
      </div>

      <div className="mb-1 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">{item.name}</h2>
          {item.tags?.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {item.tags.slice(0, 4).map((t) => (
                <span key={t} className="rounded-full bg-cream-100 px-2 py-0.5 text-[10.5px] font-semibold text-ink-soft">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="shrink-0 font-display text-lg font-bold text-clay-700">{npr(unitPrice)}</span>
      </div>
      <p className="text-[14px] leading-relaxed text-ink-soft">{item.description}</p>

      {(item.options || []).length > 0 && (
        <div className="mt-5 space-y-5">
          {item.options.map((group) => (
            <div key={group.title}>
              <p className="mb-2 text-[13px] font-bold text-ink">
                {group.title}
                {group.required && <span className="ml-1 text-red-500">*</span>}
              </p>
              <div className="flex flex-col gap-2">
                {group.choices.map((choice) => {
                  const selected = options[group.title] === choice.label;
                  return (
                    <button
                      key={choice.label}
                      onClick={() => setOptions((o) => ({ ...o, [group.title]: choice.label }))}
                      className={cx(
                        'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all',
                        selected ? 'border-clay-600 bg-clay-50 shadow-glow' : 'border-cream-200 bg-white hover:border-clay-300'
                      )}
                    >
                      <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                        <span
                          className={cx(
                            'flex h-5 w-5 items-center justify-center rounded-full border-2',
                            selected ? 'border-clay-600' : 'border-cream-300'
                          )}
                        >
                          {selected && <span className="h-2.5 w-2.5 rounded-full bg-clay-600" />}
                        </span>
                        {choice.label}
                      </span>
                      {Number(choice.priceDelta) > 0 ? (
                        <span className="text-[13px] font-semibold text-ink-soft">+ {npr(choice.priceDelta)}</span>
                      ) : (
                        <span className="text-[12px] font-medium text-ink-faint">Included</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5">
        <button
          onClick={() => setNote((n) => !n)}
          className="flex w-full items-center justify-between rounded-xl bg-cream-100 px-4 py-3 text-[13.5px] font-semibold text-ink transition-colors hover:bg-cream-200"
        >
          {note ? 'Hide special instructions' : 'Add special instructions'}
          <ChevronRight size={16} className={cx('transition-transform', note && 'rotate-90')} />
        </button>
        {note && (
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="e.g. No onions, extra spicy, less oil…"
            className="input mt-2 resize-none"
          />
        )}
      </div>

      <div className="sticky bottom-0 -mx-5 mt-6 border-t border-cream-200 bg-paper px-5 pt-4 pb-2">
        <div className="flex items-center justify-between gap-3">
          <QuantityStepper quantity={quantity} onChange={setQuantity} />
          <button
            disabled={missingRequired || !item.isAvailable}
            onClick={() => {
              onAdd(item, { quantity, options, specialInstructions });
              onClose();
            }}
            className="btn-primary flex-1 text-[15px]"
          >
            {missingRequired ? 'Select required options' : `Add · ${npr(unitPrice * quantity)}`}
          </button>
        </div>
        <p className="mt-2 text-center text-[11.5px] font-medium text-ink-faint">
          {item.isAvailable ? 'You can pay online or after your meal.' : 'Currently unavailable'}
        </p>
      </div>
    </Sheet>
  );
}