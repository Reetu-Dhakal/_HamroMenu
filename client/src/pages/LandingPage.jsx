import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import logoImg from '../assets/logo.png';
import {
  QrCode,
  Plus,
  Sparkles,
  ShoppingBag,
  ChefHat,
  ScanLine,
  ShieldCheck,
  MessageCircle,
  Banknote,
  Star,
  ArrowRight,
  Smartphone,
  LayoutDashboard,
  Check,
  Heart,
  Clock4,
  Utensils,
  LogIn,
  MapPin,
  Mail,
  Phone,
} from 'lucide-react';

const btn = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-full bg-clay-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-clay-600/25 transition-all hover:bg-clay-700 hover:shadow-xl hover:shadow-clay-600/30 active:scale-[0.98]',
  soft:
    'inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-clay-700 ring-1 ring-clay-200 transition-all hover:bg-clay-50 active:scale-[0.98]',
  ghost:
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-clay-700 transition-colors hover:bg-clay-50',
  amber:
    'inline-flex items-center justify-center gap-2 rounded-full bg-saffron px-6 py-3 text-sm font-semibold text-clay-900 shadow-lg shadow-saffron/25 transition-all hover:bg-saffron-light active:scale-[0.98]',
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
};

function SectionHead({ title, sub, light = false }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className={`font-display text-3xl font-black tracking-tight sm:text-4xl ${light ? 'text-cream-50' : 'text-clay-900'}`}>{title}</h2>
      {sub && <p className={`mt-3 text-base leading-relaxed ${light ? 'text-cream-50/70' : 'text-gray-600'}`}>{sub}</p>}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-cream-50 font-sans text-clay-900">
      <Helmet>
        <title>HamroMenu — QR Table Ordering for Restaurants</title>
        <meta name="description" content="Zero-app QR ordering, live kitchen display, smart dish recommendations and full restaurant analytics in one platform." />
      </Helmet>

      {/* ======= NAV ======= */}
      <header className="sticky top-0 z-40 border-b border-clay-100/70 bg-cream-50/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" aria-label="HamroMenu home"><Logo /></Link>
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#how-it-works" className={btn.ghost}>How it works</a>
            <a href="#features" className={btn.ghost}>Features</a>
            <a href="#for-restaurants" className={btn.ghost}>For restaurants</a>
            <a href="#faq" className={btn.ghost}>FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className={btn.primary + ' !py-2.5 text-[13px]'}><LogIn size={15} /> Login</Link>
          </div>
        </div>
      </header>

      {/* ======= HERO ======= */}
      <section className="relative flex min-h-[560px] items-center overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="A beautifully plated dish at a HamroMenu restaurant"
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-clay-900/95 via-clay-900/75 to-clay-900/30" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-saffron/20 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl font-display text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl"
          >
            Scan. Order.
            <br />
            <span className="text-white">Your food arrives.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.13 }}
            className="mt-5 max-w-lg text-base leading-relaxed text-cream-50/90"
          >
            No app to download, no waiting for the waiter. Guests scan a QR on their table, browse a rich menu, customise every dish, and watch the kitchen cooking it — live.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/menu/table/1" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-clay-700 shadow-lg transition-all hover:bg-cream-50 active:scale-[0.98]">
              <QrCode size={17} /> Scan & order now
            </Link>
            <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-7 py-3.5 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur transition-all hover:bg-white/20 active:scale-[0.98]">
              See how it works <ArrowRight size={15} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ======= HOW IT WORKS ======= */}
      <section id="how-it-works" className="relative bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead title="Your table, your phone, your order" sub="No app installs, no account juggling. Guests are ordering within seconds." />
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              { icon: QrCode, step: '01', title: 'Scan the QR', copy: 'Every table has a unique QR. One tap opens that table\'s menu in the browser.' },
              { icon: ShoppingBag, step: '02', title: 'Pick your dishes', copy: 'Beautiful cards, veg marks, spice levels and customization options — just like the real menu.' },
              { icon: ChefHat, step: '03', title: 'Cooked live, served fast', copy: 'Kitchen sees the ticket instantly. Track your order as it cooks — no more waving at waiters.' },
            ].map((s) => (
              <motion.div key={s.step} {...fadeUp} transition={{ duration: 0.4 }} className="group relative overflow-hidden rounded-3xl bg-cream-50 p-7 ring-1 ring-clay-100 transition-all hover:-translate-y-1 hover:shadow-card">
                <span className="absolute right-6 top-5 font-display text-5xl font-black text-clay-100 transition-colors group-hover:text-clay-200">{s.step}</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-clay-500 to-clay-700 text-white shadow-md shadow-clay-600/30"><s.icon size={22} /></span>
                <h3 className="mt-5 font-display text-xl font-bold text-clay-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.copy}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= FEATURES ======= */}
      <section id="features" className="relative bg-cream-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead title="Every detail, five-star standard" sub="Built for the way people actually eat out." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ScanLine, title: 'Zero-download dining', copy: 'Pure browser ordering — no store, no app, no barriers between hunger and food.' },
              { icon: Sparkles, title: 'Smart recommendations', copy: 'A recommendation engine suggests dishes your table is actually ordering — staff can steer it from the dashboard.' },
              { icon: Clock4, title: 'Live kitchen time', copy: 'Estimated ready time is shown before guests order. No awkward "how long will it be?"' },
              { icon: ShieldCheck, title: 'Veg & spice filters', copy: 'Vegetarian marks, spice meters and price filters so every guest feels looked after.' },
              { icon: MessageCircle, title: 'Notes for the chef', copy: '"Less masala", "extra achar" — special instructions ride with every kitchen ticket.' },
              { icon: Banknote, title: 'Pay your way', copy: 'eSewa, Khalti or pay-after-meal at the table — whatever is easiest that evening.' },
            ].map((f) => (
              <motion.div key={f.title} {...fadeUp} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-cream-100 transition-all hover:-translate-y-1 hover:shadow-card">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-clay-100 text-clay-600"><f.icon size={20} /></span>
                <h3 className="mt-4 font-display text-lg font-bold text-clay-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{f.copy}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= THE ENGINE ======= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-clay-800 via-clay-900 to-[#3a1a0d] py-20 text-cream-50">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-saffron/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-saffron to-clay-500 text-clay-900 shadow-lg shadow-saffron/30">
              <Star size={36} className="fill-current" />
            </div>
            <div className="text-center lg:text-left">
              <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">Behavioural recommendations</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-cream-50/75 lg:mx-0">
                Every order refines a cosine-similarity model across your menu. Dishes that tables order together learn to appear together — turning browsing into higher-ticket orders.
              </p>
            </div>
            <Link to="/menu/table/1" className={btn.amber + ' shrink-0 whitespace-nowrap'}>See it in action <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      {/* ======= FOR RESTAURANTS ======= */}
      <section id="for-restaurants" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead title="One dashboard, the whole restaurant" sub="Floor staff, kitchen and admin each get a screen tuned for their job. Everything updates in real time via web sockets." />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {[
              { icon: Smartphone, title: 'Guest side', tag: 'QR menu + cart', accent: 'clay', points: ['One-tap orders from any phone', 'Payment: eSewa, Khalti or at-table', 'Reviews & dish ratings'] },
              { icon: ChefHat, title: 'Kitchen display', tag: 'KDS tickets', accent: 'saffron', points: ['Full-screen ticket queue', 'Per-item ready buttons', 'Overdue detection with colour alerts'] },
              { icon: LayoutDashboard, title: 'Staff & admin', tag: 'Floor control', accent: 'leaf', points: ['Live floor with table states', 'Billing, cash-up & QR generator', 'Revenue, peak hours & turnover analytics'] },
            ].map((s) => (
              <motion.div key={s.title} {...fadeUp} className="flex flex-col rounded-3xl bg-cream-50 p-7 ring-1 ring-cream-100 transition-all hover:-translate-y-1 hover:shadow-card">
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-clay-500 to-clay-700 text-white shadow-md shadow-clay-600/30"><s.icon size={22} /></span>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-clay-700 ring-1 ring-clay-200">{s.tag}</span>
                </div>
                <h3 className="font-display text-xl font-bold text-clay-900">{s.title}</h3>
                <ul className="mt-4 flex flex-1 flex-col gap-2.5">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf/15 text-leaf"><Check size={12} /></span>
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= CTA ======= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-clay-700 via-clay-800 to-clay-900 py-16 text-cream-50">
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-saffron/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
            <div className="flex items-center gap-5 text-center lg:text-left">
              <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-saffron ring-1 ring-white/10 sm:flex"><Utensils size={26} /></span>
              <div>
                <h2 className="font-display text-3xl font-black tracking-tight">Is your restaurant ready?</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-cream-50/75">
                  Set up in one afternoon. Print QR stands, place them on tables, train the team on a screen. Live in days, not weeks.
                </p>
              </div>
            </div>
            <Link to="/menu/table/1" className={btn.amber + ' shrink-0 whitespace-nowrap'}>Explore the sample menu <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      {/* ======= FAQ ======= */}
      <section id="faq" className="bg-cream-50 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHead title="Questions, answered" />
          <div className="mt-10 space-y-3">
            {[
              ['Do guests need to install an app?', 'No. Scanned QR opens a fast web app in the browser. No app installs, no sign-ups required to order.'],
              ['What if we try it with one table first?', 'Great idea — QR codes are generated per table. Turn it on anywhere, anytime.'],
              ['Does it work without internet in the restaurant?', 'The kitchen and staff dashboards work locally; the guest web app needs cellular/Wi-Fi, so most restaurants run a guest Wi-Fi.'],
              ['What do we pay for?', 'Simple subscription per extra table. No hardware to buy beyond printed QR stands.'],
              ['Can guests leave ratings and reviews?', 'Yes — dishes can be rated right after the meal, with automatic moderation for the restaurant.'],
            ].map(([q, a]) => (
              <details key={q} className="group rounded-2xl bg-white px-6 py-5 ring-1 ring-cream-100 transition-shadow hover:shadow-card">
                <summary className="flex cursor-pointer list-none items-center justify-between font-display text-base font-bold text-clay-900">
                  {q}
                  <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clay-100 text-clay-600 transition-transform group-open:rotate-45">
                    <Plus size={15} />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ======= FOOTER ======= */}
      <footer className="border-t border-clay-100 bg-cream-100">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-1">
              <Link to="/" aria-label="HamroMenu home"><Logo /></Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-600">
                Smart QR restaurant ordering for Nepal. Turn every table into a seamless digital dining experience.
              </p>
              <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-gray-500">
                Made with <Heart size={12} className="fill-clay-500 text-clay-500" /> in Kathmandu
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-clay-700">Product</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
                <li><a href="#how-it-works" className="transition-colors hover:text-clay-700">How it works</a></li>
                <li><a href="#features" className="transition-colors hover:text-clay-700">Features</a></li>
                <li><a href="#for-restaurants" className="transition-colors hover:text-clay-700">For restaurants</a></li>
                <li><a href="#faq" className="transition-colors hover:text-clay-700">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-clay-700">Get started</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
                <li><Link to="/login" className="transition-colors hover:text-clay-700">Restaurant login</Link></li>
                <li><Link to="/register" className="transition-colors hover:text-clay-700">Create a customer account</Link></li>
                <li><Link to="/menu/table/1" className="transition-colors hover:text-clay-700">Try the sample menu</Link></li>
                <li><Link to="/menu" className="transition-colors hover:text-clay-700">Browse menus</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-clay-700">Contact</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
                <li className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-clay-500" /> Kathmandu, Nepal</li>
                <li className="flex items-start gap-2"><Mail size={15} className="mt-0.5 shrink-0 text-clay-500" /> hello@hamromenu.com</li>
                <li className="flex items-start gap-2"><Phone size={15} className="mt-0.5 shrink-0 text-clay-500" /> +977 1 400 0000</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-clay-200/70">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6">
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} HamroMenu. All rights reserved.</p>
            <div className="flex items-center gap-5 text-xs text-gray-500">
              <a href="#" className="transition-colors hover:text-clay-700">Privacy</a>
              <a href="#" className="transition-colors hover:text-clay-700">Terms</a>
              <Link to="/login" className="inline-flex items-center gap-1.5 font-bold text-clay-700 transition-colors hover:text-clay-600">
                Restaurant sign in <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const HERO_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1800&q=80';

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <img
        src={logoImg}
        alt="HamroMenu logo"
        className="h-11 w-11 rounded-2xl object-cover mix-blend-multiply"
      />
      <span className="font-display text-xl font-black tracking-tight text-clay-900">
        Hamro<span className="text-clay-600">Menu</span>
      </span>
    </span>
  );
}


