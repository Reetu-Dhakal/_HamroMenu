import { cx } from '../../lib/format';

export function Spinner({ size = 20, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cx('animate-spin', className)}
      role="status"
      aria-label="Loading"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.18" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-faint">
      <Spinner size={28} className="text-clay-600" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function FullScreenLoader({ label = 'Loading HamroMenu…' }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-cream-50">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-clay-600 text-2xl font-bold text-white shadow-float">
        H
      </div>
      <p className="text-sm font-medium text-ink-faint">{label}</p>
    </div>
  );
}

export default Spinner;