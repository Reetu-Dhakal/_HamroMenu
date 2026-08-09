import { Clock, MapPin, Star } from 'lucide-react';
import { ChevronDown, QrCode } from 'lucide-react';
import { cx, dayName, formatTime } from '../../lib/format';

export default function MenuHeader({ restaurant, table, collapsed = false }) {
  const today = new Date().getDay();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayKey = days[today];
  const hours = (restaurant?.operatingHours || []).find((h) => h.day === todayKey);

  return (
    <div className={collapsed ? 'hidden' : 'block'}>
      <div className="relative h-52 overflow-hidden sm:h-64 lg:h-72">
        <img
          src={restaurant?.coverUrl}
          alt={restaurant?.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="img-overlay" />
        <div className="absolute inset-x-0 bottom-0 p-5 pb-5">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-saffron-light">
                <QrCode size={12} /> Table {table?.number}
              </div>
              <h1 className="font-display text-[26px] font-bold leading-tight text-white drop-shadow-sm sm:text-3xl">
                {restaurant?.name}
              </h1>
              <p className="mt-1 line-clamp-1 max-w-md text-[13px] font-medium text-white/85">{restaurant?.tagline || restaurant?.description}</p>
            </div>
          </div>
        </div>
        <div className="absolute right-4 top-4 rounded-full bg-ink/55 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur">
          {restaurant?.isOpen ? (
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-leaf-light animate-pulse-soft" /> Open now
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Closed
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto border-b border-cream-200 bg-paper px-4 py-3 no-scrollbar sm:px-6">
        <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-semibold text-ink-soft">
          <Star size={13} className="fill-saffron text-saffron" />
          {restaurant?.rating || '4.8'}
        </span>
        <span className="shrink-0 text-cream-200">•</span>
        <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-semibold text-ink-soft">
          <MapPin size={13} />
          {restaurant?.address?.street ? `${restaurant.address.street}, ${restaurant.address.city}` : restaurant?.address?.city || 'Kathmandu'}
        </span>
        {hours && !hours.closed && (
          <>
            <span className="shrink-0 text-cream-200">•</span>
            <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-semibold text-ink-soft">
              <Clock size={13} />
              {dayName()} {formatTime(`1970-01-01T${hours.open}:00`)} – {formatTime(`1970-01-01T${hours.close}:00`)}
            </span>
          </>
        )}
        <span className="shrink-0 text-cream-200">•</span>
        <button className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-clay-700">
          Full menu <ChevronDown size={13} />
        </button>
      </div>
    </div>
  );
}