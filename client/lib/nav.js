import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Settings,
  Users,
  Table as TableIcon,
  Ticket,
  QrCode,
  BarChart3,
  Star,
  User,
} from 'lucide-react';

export function roleNav(role) {
  switch (role) {
    case 'admin':
      return [
        { label: 'Overview', href: '/admin', icon: LayoutDashboard },
        { label: 'Menu & Items', href: '/admin/menu', icon: UtensilsCrossed },
        { label: 'Tables & QR', href: '/admin/tables', icon: QrCode },
        { label: 'Orders', href: '/admin/orders', icon: ClipboardList },
        { label: 'Coupons', href: '/admin/coupons', icon: Ticket },
        { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
        { label: 'Staff & Kitchen', href: '/admin/team', icon: Star },
        { label: 'Settings', href: '/admin/settings', icon: Settings },
      ];
    case 'staff':
      return [
        { label: 'Dashboard', href: '/staff', icon: LayoutDashboard },
        { label: 'Orders', href: '/staff/orders', icon: ClipboardList },
        { label: 'Tables', href: '/staff/tables', icon: TableIcon },
        { label: 'Billing', href: '/staff/billing', icon: Receipt },
      ];
    case 'kitchen':
      return [
        { label: 'Kitchen', href: '/kitchen', icon: UtensilsCrossed },
        { label: 'Current orders', href: '/kitchen/queue', icon: ClipboardList },
        { label: 'Ready', href: '/kitchen/ready', icon: BarChart3 },
      ];
    default:
      return [
        { label: 'My orders', href: '/account', icon: ClipboardList },
        { label: 'Favorites', href: '/account/favorites', icon: Star },
        { label: 'Reviews', href: '/account/reviews', icon: Star },
        { label: 'Profile', href: '/account/profile', icon: Settings },
      ];
  }
}