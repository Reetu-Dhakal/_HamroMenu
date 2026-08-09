import { useMemo, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, QrCode } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cx, initials } from '../../lib/format';
import { Sheet } from '../ui';

export default function DashboardShell({ brand = 'HamroMenu', sections, accent = true, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = useMemo(() => {
    const flat = [];
    for (const group of sections || []) flat.push(...(group.items || []));
    return flat;
  }, [sections]);

  const Sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-2.5 px-5 py-5">
        <span className={cx('flex h-9 w-9 items-center justify-center rounded-xl font-display text-lg font-bold text-white', accent ? 'bg-clay-600' : 'bg-ink')}>
          H
        </span>
        <span className="font-display text-lg font-semibold tracking-tight text-ink">{brand}</span>
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {sections.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavRow key={item.to} item={item} onClick={() => setMenuOpen(false)} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-cream-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clay-100 text-sm font-bold text-clay-700">
            {initials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
            <p className="truncate text-[11px] font-medium text-ink-faint capitalize">{user?.role}</p>
          </div>
          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-faint hover:bg-cream-100 hover:text-red-600"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-cream-50 lg:flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-cream-200 bg-paper lg:block">{Sidebar}</aside>

      <div className="min-w-0 flex-1 lg:ml-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-cream-200 bg-cream-50/90 px-4 backdrop-blur lg:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-ink shadow-card"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <span className={cx('flex h-7 w-7 items-center justify-center rounded-lg font-display text-sm font-bold text-white', accent ? 'bg-clay-600' : 'bg-ink')}>
              H
            </span>
            <span className="font-display font-semibold text-ink">{brand}</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-ink-soft shadow-card"
              aria-label="Restaurant website"
            >
              <QrCode size={16} />
            </button>
          </div>
        </header>
        <main className="p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10">{children}</main>
      </div>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" tall>
        {Sidebar}
      </Sheet>
    </div>
  );
}

function NavRow({ item }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cx(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors',
          isActive ? 'bg-clay-50 text-clay-700' : 'text-ink-soft hover:bg-cream-100 hover:text-ink'
        )
      }
    >
      {Icon && (
        <span className={cx('flex h-7 w-7 items-center justify-center rounded-lg', item.tone === 'kitchen' ? 'bg-ink text-cream-50' : 'bg-clay-100 text-clay-700')}>
          <Icon size={15} />
        </span>
      )}
      {item.label}
      {item.badge ? (
        <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">{item.badge}</span>
      ) : null}
    </NavLink>
  );
}