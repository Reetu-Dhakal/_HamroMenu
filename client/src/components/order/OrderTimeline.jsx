import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cx } from '../../lib/format';

const STEPS = [
  { key: 'pending', label: 'Placed', hint: 'Order received' },
  { key: 'confirmed', label: 'Confirmed', hint: 'Approved by staff' },
  { key: 'preparing', label: 'Preparing', hint: 'In the kitchen' },
  { key: 'ready', label: 'Ready', hint: 'Ready to serve' },
  { key: 'served', label: 'Served', hint: 'Enjoy your meal' },
];

function stepIndex(status) {
  if (status === 'completed') return STEPS.length;
  if (status === 'cancelled') return -1;
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx + 1 : 0;
}

export default function OrderTimeline({ status, cancelledAt }) {
  const idx = stepIndex(status);
  const cancelled = status === 'cancelled';

  return (
    <div className="relative px-2">
      <ol className="relative flex">
        {STEPS.map((step, i) => {
          const done = !cancelled && idx > i;
          const current = !cancelled && idx === i + 1;
          const isLast = i === STEPS.length - 1;
          return (
            <li key={step.key} className="relative flex-1">
              <div className="flex flex-col items-center">
                <div className="relative flex h-9 w-9 items-center justify-center">
                  <motion.span
                    animate={done ? { scale: 1 } : { scale: [1, 1.12, 1] }}
                    transition={{ repeat: current || done ? undefined : Infinity, duration: 1.6 }}
                    className={cx(
                      'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors',
                      done || current ? 'border-clay-600 bg-clay-600 text-white shadow-float' : 'border-cream-300 bg-white text-transparent'
                    )}
                  >
                    {done ? <Check size={16} strokeWidth={3} /> : <span className={cx('h-2 w-2 rounded-full', current ? 'bg-white' : 'bg-cream-300')} />}
                  </motion.span>
                  {current && !done && (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-clay-500/40"
                      animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                    />
                  )}
                </div>
                <p className={cx('mt-2 text-[11px] font-bold', done || current ? 'text-clay-700' : 'text-ink-faint')}>{step.label}</p>
                <p className="hidden text-[10px] text-ink-faint sm:block">{current ? step.hint : '\u00A0'}</p>
              </div>
              {!isLast && (
                <div className="absolute left-[50%] right-[-50%] top-[17px] h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-cream-200">
                  <motion.div
                    className="h-full bg-gradient-to-r from-clay-500 to-clay-600"
                    initial={false}
                    animate={{ width: done ? '100%' : current ? '55%' : '0%' }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {cancelled && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-center text-[13px] font-semibold text-red-700">
          This order was cancelled{cancelledAt ? ` at ${new Date(cancelledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}
        </div>
      )}
      {status === 'completed' && (
        <div className="mt-4 rounded-xl bg-leaf/10 px-4 py-3 text-center text-[13px] font-semibold text-leaf-dark">
          All done — order completed, payment settled
        </div>
      )}
    </div>
  );
}