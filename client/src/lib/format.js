export const ORDER_FLOW = [
  { key: 'pending', label: 'Placed', short: 'Placed' },
  { key: 'confirmed', label: 'Confirmed', short: 'Confirmed' },
  { key: 'preparing', label: 'Preparing', short: 'Cooking' },
  { key: 'ready', label: 'Ready', short: 'Ready' },
  { key: 'served', label: 'Served', short: 'Served' },
  { key: 'completed', label: 'Completed', short: 'Done' },
];

export const STATUS_META = {
  pending: { label: 'Placed', color: 'bg-saffron/15 text-saffron-deep border-saffron/30', dot: 'bg-saffron' },
  confirmed: { label: 'Confirmed', color: 'bg-clay-100 text-clay-700 border-clay-200', dot: 'bg-clay-500' },
  preparing: { label: 'Preparing', color: 'bg-clay-50 text-clay-600 border-clay-200', dot: 'bg-clay-400' },
  ready: { label: 'Ready', color: 'bg-leaf/10 text-leaf-dark border-leaf/25', dot: 'bg-leaf' },
  served: { label: 'Served', color: 'bg-leaf/15 text-leaf-dark border-leaf/25', dot: 'bg-leaf' },
  completed: { label: 'Completed', color: 'bg-cream-100 text-ink-soft border-cream-200', dot: 'bg-ink-faint' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
};

export const SPICE_META = {
  mild: { label: 'Mild', icon: '🌶️' },
  medium: { label: 'Medium', icon: '🌶️' },
  hot: { label: 'Hot', icon: '🌶️' },
  'extra-hot': { label: 'Extra hot', icon: '🌶️' },
};

export function npr(amount) {
  const n = Number(amount) || 0;
  return `Rs. ${n.toLocaleString('en-IN', { maximumFractionDigits: n % 1 === 0 ? 0 : 2 })}`;
}

export function nprCompact(amount) {
  const n = Number(amount) || 0;
  if (n >= 100000) return `Rs. ${(n / 1000).toFixed(0)}k`;
  return npr(n);
}

export function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatTime(date, opts = {}) {
  return new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', ...opts });
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function dayName(date = new Date()) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(date).getDay()];
}

export function elapsedLabel(from) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(from).getTime()) / 60000));
  if (mins < 1) return '<1 min';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m`;
}

export function initials(name = '') {
  return name
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function cloudUrl(url, transforms) {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && transforms) {
    return url.replace('/image/upload/', `/image/upload/${transforms}/`);
  }
  return url;
}

export function itemImage(item, size = 'w_480,h_360,c_fill,q_auto,f_auto') {
  return cloudUrl(item?.imageUrl, size);
}

export function scrollLock(on) {
  if (on) document.body.style.overflow = 'hidden';
  else document.body.style.overflow = '';
}

export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}