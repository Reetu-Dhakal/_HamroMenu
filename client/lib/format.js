export function formatCurrency(amount, currency = 'NPR') {
  const n = Number(amount) || 0;
  const symbols = { NPR: 'Rs.', USD: '$', EUR: '€', GBP: '£' };
  const prefix = symbols[currency] || currency + ' ';
  return `${prefix}${n.toLocaleString('en-IN', { maximumFractionDigits: n % 1 ? 2 : 0 })}`;
}

export function formatDate(input, opts = {}) {
  const d = input ? new Date(input) : new Date();
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', opts || { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function timeAgo(input) {
  const d = new Date(input).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export const ORDER_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed'];

export const ORDER_STATUS_META = {
  pending: { label: 'Pending', color: 'bg-stone-200 text-stone-700', dot: 'bg-stone-400' },
  confirmed: { label: 'Confirmed', color: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  preparing: { label: 'Preparing', color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  ready: { label: 'Ready', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  served: { label: 'Served', color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  completed: { label: 'Completed', color: 'bg-lime-100 text-lime-700', dot: 'bg-lime-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

export function orderStatusMeta(status) {
  return ORDER_STATUS_META[status] || ORDER_STATUS_META.pending;
}

export function classNames(...args) {
  return args.filter(Boolean).join(' ');
}