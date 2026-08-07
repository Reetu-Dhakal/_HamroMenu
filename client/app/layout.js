import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: {
    default: 'HamroMenu — Order from your table',
    template: '%s · HamroMenu',
  },
  description:
    'QR-based smart restaurant ordering & management. Browse the menu, order in seconds and track your food live — straight from your table.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}