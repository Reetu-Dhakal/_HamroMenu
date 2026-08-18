import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  QrCode, ScanLine, Zap, Sparkles, ChefHat, Smartphone, LayoutDashboard, Star, Clock4,
  Banknote, ArrowRight, Check, Menu, X, ShieldCheck, Heart, ShoppingBag, MessageCircle, Plus,
} from 'lucide-react';
import { cx } from '../lib/format';

const PlusIcon = () => <Plus size={14} />;

export default function LandingPage() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="bg-gray-50">
      <Helmet>
        <title>HamroMenu — QR Table Ordering for Restaurants</title>
        <meta name="description" content="Zero-app QR ordering, live kitchen display, smart dish recommendations and full restaurant analytics in one platform." />
      </Helmet>

      <nav className="sticky top-0 z-40 border-b border-gray-200/70 bg-gray-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 font-display text-lg font-bold text-white">H</span>
            <span className="font-display text-lg font-semibold tracking-tight text-gray-900">HamroMenu</span>
          </div>
          <nav className="hidden items-center gap-6 text-[13.5px] font-semibold text-gray-500 md:flex">
            <a href="#how-it-works" className="hover:text-gray-700">How it works</a>
            <a href="#features" className="hover:text-gray-700">Features</a>
            <a href="#for-restaurants" className="hover:text-gray-700">For restaurants</a>
            <a href="#faq" className="hover:text-gray-700">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden text-[13.5px] font-bold text-gray-500 sm:block hover:text-gray-700">Sign in</Link>
            <Link to="/menu/table/1" className="btn-primary !py-2 text-[13px]">Explore the menu</Link>
            <button className="btn-ghost !px-2.5 md:hidden" onClick={() => setNavOpen(true)} aria-label="Menu"><Menu size={18} /></button>
          </div>
        </div>
      </nav>

      {navOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm" onClick={() => setNavOpen(false)}>
          <div className="ml-auto h-full w-72 max-w-[85%] bg-white p-5 shadow-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-lg font-bold text-gray-900">HamroMenu</span>
              <button className="btn-ghost !px-2.5" onClick={() => setNavOpen(false)}><X size={18} /></button>
            </div>
            <div className="space-y-1">
              {[['How it works', '#how-it-works'], ['Features', '#features'], ['For restaurants', '#for-restaurants'], ['FAQ', '#faq']].map(([label, href]) => (
                <a key={href} href={href} onClick={() => setNavOpen(false)} className="block rounded-xl px-3 py-2.5 text-[14px] font-semibold text-gray-900 hover:bg-gray-100">{label}</a>
              ))}
              <Link to="/login" className="block rounded-xl px-3 py-2.5 text-[14px] font-bold text-gray-700">Sign in</Link>
            </div>
          </div>
        </div>
      )}

      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-2 lg:pb-28 lg:pt-20">
          <div>
            <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-1.5 text-[11.5px] font-bold text-gray-600 ring-1 ring-gray-600/15">
              <Sparkles size={12} className="text-amber-500" /> QR table ordering for modern restaurants
            </motion.span>
            <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-gradient font-display text-4xl font-black leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.6rem]">
              Scan. Order.<br />Your food arrives.
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mt-4 max-w-md text-[15.5px] leading-relaxed text-gray-500">
              No app to download, no waiting for the waiter. Guests scan a QR on their table, browse a rich menu, customise every dish, and watch the kitchen cooking it — live.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-7 flex flex-wrap gap-3">
              <Link to="/menu/table/1" className="btn-primary btn-lg"><QrCode size={17} /> Scan & order now</Link>
              <a href="#how-it-works" className="btn-ink btn-lg">See how it works</a>
            </motion.div>
            <div className="mt-9 grid max-w-md grid-cols-3 gap-3">
              {[
                ['30 sec', 'table to tap to menu'],
                ['60%', 'faster table turns'],
                ['4.9★', 'diner rating'],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl bg-white/70 px-3 py-2.5 text-center ring-1 ring-white">
                  <p className="font-display text-lg font-black text-gray-900">{v}</p>
                  <p className="text-[10.5px] font-semibold leading-tight text-gray-400">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <PhoneMockup />
        </div>
      </section>

      <section id="how-it-works" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionHead kicker="How it works" title="Your table, your phone, your order" copy="No app installs, no account juggling. Guests are ordering within seconds." />
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: QrCode, step: '01', title: 'Scan the QR', copy: 'Every table has a unique QR. One tap opens that table\'s menu in the browser.' },
              { icon: ShoppingBag, step: '02', title: 'Pick your dishes', copy: 'Beautiful cards, veg marks, spice levels and customization options — just like the real menu.' },
              { icon: ChefHat, step: '03', title: 'Cooked live, served fast', copy: 'Kitchen sees the ticket instantly. Track your order as it cooks — no more waving at waiters.' },
            ].map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="card p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-800 text-white"><s.icon size={20} /></span>
                  <span className="font-display text-2xl font-black text-gray-300">{s.step}</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-gray-900">{s.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-gray-400">{s.copy}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionHead kicker="Guest experience" title="Every detail, five-star standard" sub="Built for the way people actually eat out." />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ScanLine, title: 'Zero-download dining', copy: 'Pure browser ordering — no store, no app, no barriers between hunger and food.' },
              { icon: Sparkles, title: 'Smart recommendations', copy: 'A recommendation engine suggests dishes your table is actually ordering — staff can steer it from the dashboard.' },
              { icon: Clock4, title: 'Live kitchen time', copy: 'Estimated ready time is shown before guests order. No awkward "how long will it be?"' },
              { icon: ShieldCheck, title: 'Veg & spice filters', copy: 'Vegetarian marks, spice meters and price filters so every guest feels looked after.' },
              { icon: MessageCircle, title: 'Notes for the chef', copy: '"Less masala", "extra achar" — special instructions ride with every kitchen ticket.' },
              { icon: Banknote, title: 'Pay your way', copy: 'eSewa, Khalti or pay-after-meal at the table — whatever is easiest that evening.' },
            ].map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.07 }} className="card p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700"><f.icon size={18} /></span>
                <h3 className="mt-3.5 font-display text-[15.5px] font-bold text-gray-900">{f.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-400">{f.copy}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-900 text-gray-100 py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 text-center sm:px-6 lg:flex-row lg:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-600 text-gray-100"><Star size={24} className="fill-gray-100" /></div>
          <div>
            <p className="font-display text-xl font-bold sm:text-2xl">The engine: behavioural recommendations</p>
            <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-gray-300/80">
              Every order refines a cosine-similarity model across your menu. Dishes that tables order together learn to appear together — turning browsing into higher-ticket orders.
            </p>
          </div>
          <Link to="/menu/table/1" className="btn-amber shrink-0 whitespace-nowrap">See it in action <ArrowRight size={15} /></Link>
        </div>
      </section>

      <section id="for-restaurants" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHead kicker="For restaurants" title="One dashboard, the whole restaurant" sub="Floor staff, kitchen and admin each get a screen tuned for their job. Everything updates in real time via web sockets." />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {[
            { icon: Smartphone, title: 'Guest side', tag: 'QR menu + cart', points: ['One-tap orders from any phone', 'Payment: eSewa, Khalti or at-table', 'Reviews & dish ratings'] },
            { icon: ChefHat, title: 'Kitchen display', tag: 'KDS tickets', points: ['Full-screen ticket queue', 'Per-item ready buttons', 'Overdue detection with colour alerts'] },
            { icon: LayoutDashboard, title: 'Staff & admin', tag: 'Floor control', points: ['Live floor with table states', 'Billing, cash-up & QR generator', 'Revenue, peak hours & turnover analytics'] },
          ].map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-800 text-white"><s.icon size={20} /></span>
                <span className="rounded-full bg-gray-700 px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide text-gray-400">{s.tag}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-gray-900">{s.title}</h3>
              <ul className="mt-3 space-y-2">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-[13px] text-gray-500"><Check size={14} className="mt-0.5 shrink-0 text-gray-400" /> {p}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-b from-gray-800 to-gray-900 py-16 text-gray-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
            <div>
              <h2 className="font-display text-2xl font-black">Is your restaurant ready?</h2>
              <p className="mt-1.5 max-w-md text-[14px] text-gray-200/80">Set up in one afternoon. Print QR stands; place them on tables; train the team on a screen. Live in days, not weeks.</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link to="/menu/table/1" className="btn-amber btn-lg">Explore the sample menu <ArrowRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <SectionHead kicker="FAQ" title="Questions, answered" />
        <div className="mt-8 space-y-2.5">
          {[
            ['Do guests need to install an app?', 'No. Scanned QR opens a fast web app in the browser. No app installs, no sign-ups required to order.'],
            ['What if we try it with one table first?', 'Great idea — QR codes are generated per table. Turn it on anywhere, anytime.'],
            ['Does it work without internet in the restaurant?', 'The kitchen and staff dashboards work locally; the guest web app needs cellular/Wi-Fi, so most restaurants run a guest Wi-Fi.'],
            ['What do we pay for?', 'Simple subscription per extra table. No hardware to buy beyond printed QR stands.'],
            ['Can guests leave ratings and reviews?', 'Yes — dishes can be rated right after the meal, with automatic moderation for the restaurant.'],
          ].map(([q, a]) => (
            <details key={q} className="card group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between font-display text-[14.5px] font-bold text-gray-900">
                {q}
                <span className="ml-3 text-gray-500 transition-transform group-open:rotate-45"><PlusIcon /></span>
              </summary>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-gray-400">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-gray-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 font-display text-sm font-bold text-white">H</span>
            <span className="font-display font-semibold text-gray-900">HamroMenu</span>
          </div>
          <p className="text-center text-[12px] text-gray-500">Smart QR restaurant ordering · Made with <Heart size={11} className="inline fill-gray-600 text-gray-600" /> in Kathmandu</p>
          <Link to="/login" className="text-[12.5px] font-bold text-gray-700">Restaurant sign in <ArrowRight size={12} className="inline" /></Link>
        </div>
      </footer>
    </div>
  );
}

function SectionHead({ kicker, title, sub }) {
  return (
    <div className="max-w-2xl">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-600">{kicker}</p>
      <h2 className="font-display text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">{title}</h2>
      {sub && <p className="mt-2.5 text-[14px] leading-relaxed text-gray-400">{sub}</p>}
    </div>
  );
}

function PhoneMockup() {
  return (
    <motion.div initial={{ opacity: 0, y: 22, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.55 }} className="relative mx-auto w-full max-w-[340px]">
      <div className="rounded-[2.4rem] border-[10px] border-gray-800 bg-white p-4 shadow-float">
        <div className="mx-auto mb-4 h-5 w-28 rounded-full bg-gray-200" />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500">HIMALAYAN FLAVORS</p>
              <p className="font-display text-[17px] font-black text-gray-900">Table 3 menu</p>
            </div>
            <span className="rounded-full bg-amber/10 px-2.5 py-1 text-[10px] font-bold text-amber-600">Open · 10am–10pm</span>
          </div>
          <div className="flex gap-1.5 overflow-hidden">
            {['All', 'Chicken', 'Thakali', 'Rice', 'Sel roti'].map((c, i) => (
              <span key={c} className={cx('whitespace-nowrap rounded-full px-3 py-1 text-[10.5px] font-bold', i === 0 ? 'bg-amber text-white' : 'bg-gray-100 text-gray-500')}>{c}</span>
            ))}
          </div>
          {[
            { name: 'Chicken dish (10 pc)', price: 'Rs. 320', veg: false },
            { name: 'Dal set', price: 'Rs. 140', veg: true },
            { name: 'Rice plate', price: 'Rs. 380', veg: true },
          ].map((it) => (
            <div key={it.name} className="flex items-center gap-3 rounded-2xl bg-gray-100 p-3 ring-1 ring-gray-200">
              <div className={cx('flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl', it.veg ? 'bg-white text-amber-700' : 'bg-white text-gray-700')}>
                <span className={cx('flex h-5 w-5 items-center justify-center rounded-[5px] border-2', it.veg ? 'border-amber' : 'border-gray-700')}>
                  <span className={cx('dot', it.veg ? 'bg-amber' : 'bg-gray-700')} style={{ width: 7, height: 7, borderRadius: 99 }} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-bold text-gray-900">{it.name}</p>
                <p className="text-[11px] font-semibold text-gray-700">{it.price}</p>
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 text-white"><PlusIcon /></span>
            </div>
          ))}
        </div>
      </div>
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }} className="absolute -right-5 top-24 rounded-2xl bg-white px-3.5 py-2.5 shadow-float ring-1 ring-gray-200">
        <p className="text-[10px] font-bold text-gray-500">ORDER HM-1823</p>
        <p className="text-[12px] font-black text-amber-500"><span className="mr-1 inline-flex h-1.5 w-1.5 animate-pulse rounded-full amber" />Preparing · 4 min</p>
      </motion.div>
      <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="absolute -left-6 bottom-20 rounded-2xl bg-white px-3.5 py-2.5 shadow-float ring-1 ring-gray-200">
        <p className="text-[10.5px] font-bold text-gray-500">Smart pairing</p>
        <p className="text-[12px] font-bold text-amber-600">Try the thali + Lassi 🥠</p>
      </motion.div>
    </motion.div>
  );
}