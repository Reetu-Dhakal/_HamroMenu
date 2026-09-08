import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import logoImg from '../assets/logo.png';

import {
  QrCode,
  Sparkles,
  ShoppingBag,
  ChefHat,
  ScanLine,
  ShieldCheck,
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
  BarChart3,
  Store,
  UserRound,
  FileCheck,
  CreditCard,
  Users,
  ClipboardList,
  CheckCircle2,
} from 'lucide-react';

const btn = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-full bg-clay-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-clay-700/25 transition-all hover:bg-clay-800 hover:shadow-xl hover:shadow-clay-700/30 active:scale-[0.98]',

  soft:
    'inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-clay-700 ring-1 ring-clay-200 transition-all hover:bg-clay-900 hover:text-cream-50 active:scale-[0.98]',

  ghost:
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-clay-700 transition-colors hover:bg-clay-50',

  lime:
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
      <h2
        className={`font-display text-3xl font-black tracking-tight sm:text-4xl ${
          light ? 'text-cream-50' : 'text-clay-900'
        }`}
      >
        {title}
      </h2>

      {sub && (
        <p
          className={`mt-3 text-base leading-relaxed ${
            light ? 'text-cream-50/70' : 'text-gray-600'
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, copy }) {
  return (
    <motion.div
      {...fadeUp}
      className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-cream-100 transition-all hover:-translate-y-1 hover:shadow-card"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-saffron/15 text-saffron-deep">
        <Icon size={20} />
      </span>

      <h3 className="mt-4 font-display text-lg font-bold text-clay-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-gray-600">{copy}</p>
    </motion.div>
  );
}

function StepCard({ icon: Icon, step, title, copy }) {
  return (
    <motion.div
      {...fadeUp}
      className="group relative overflow-hidden rounded-3xl bg-cream-50 p-7 ring-1 ring-saffron/30 transition-all hover:-translate-y-1 hover:shadow-card"
    >
      <span className="absolute right-6 top-5 font-display text-5xl font-black text-clay-100 transition-colors group-hover:text-saffron/30">
        {step}
      </span>

      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-clay-700 to-clay-900 text-saffron shadow-md shadow-clay-900/40">
        <Icon size={22} />
      </span>

      <h3 className="mt-5 font-display text-xl font-bold text-clay-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-gray-600">{copy}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-cream-50 font-sans text-clay-900">
      <Helmet>
        <title>HamroMenu</title>

        <meta
          name="description"
          content="HamroMenu helps restaurants manage digital menus, QR ordering, kitchen operations, payments, subscriptions, and customer recommendations."
        />
      </Helmet>

      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-40 border-b border-clay-100/70 bg-cream-50/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" aria-label="HamroMenu home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <a href="#about" className={btn.ghost}>
              About
            </a>

            <a href="#features" className={btn.ghost}>
              Features
            </a>

            <a href="#how-it-works" className={btn.ghost}>
              How it works
            </a>

            <a href="#pricing" className={btn.ghost}>
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className={`${btn.primary} !py-2.5 text-[13px]`}
            >
              <LogIn size={15} />
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative flex min-h-[560px] items-center overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="A beautifully plated dish at a HamroMenu restaurant"
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#2A0F07]/95 via-[#4A1A10]/80 to-[#6B2B15]/45" />

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-saffron/20 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-28">

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl font-display text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl"
          >
            Your Restaurant
            <br />
            <span className="text-saffron">Now at every table</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.13 }}
            className="mt-5 max-w-lg text-base leading-relaxed text-cream-50/90"
          >
            Give your customers a better way to order. Manage your menu,
            receive orders instantly, and keep your restaurant running
            smoothly from one simple platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-clay-700 shadow-lg transition-all hover:bg-cream-50 active:scale-[0.98]"
            >
              Create your restaurant
              <ArrowRight size={15} />
            </Link>

            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-7 py-3.5 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur transition-all hover:bg-white/20 active:scale-[0.98]"
            >
              See how it works
              <ArrowRight size={15} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how-it-works" className="relative bg-clay-900 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead
            light
            title="Your table, your phone, your order"
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            <StepCard
              icon={QrCode}
              step="01"
              title="Scan"
              copy="Customers scan the QR code placed on their table."
            />

            <StepCard
              icon={ShoppingBag}
              step="02"
              title="Order"
              copy="They browse the menu, add food to the cart, and place an order."
            />

            <StepCard
              icon={ChefHat}
              step="03"
              title="Serve"
              copy="Restaurant staff receive the order, prepare it, and serve the customer."
            />
          </div>
        </div>
      </section>

      {/* ================= ABOUT ================= */}
      <section id="about" className="bg-paper py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
            <motion.div {...fadeUp}>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-clay-600">
                More than a digital menu
              </p>

              <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-clay-900 sm:text-4xl">
                Your restaurant’s digital workspace
              </h2>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600">
                HamroMenu brings your restaurant menu, table ordering, kitchen
                operations, payments, customer reviews, and business insights
                together in one place.
              </p>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600">
                Spend less time handling manual orders and more time giving
                your customers a better dining experience.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/register" className={btn.primary}>
                  Start your restaurant
                  <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>

            <motion.div
              {...fadeUp}
              className="relative overflow-hidden rounded-[2rem] bg-clay-900 p-5 shadow-xl"
            >
              <div className="rounded-3xl bg-cream-50 p-5">
                <div className="flex items-center justify-between border-b border-clay-100 pb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500">
                      Restaurant dashboard
                    </p>

                    <h3 className="mt-1 font-display text-xl font-black text-clay-900">
                      Hamro Café
                    </h3>
                  </div>

                  <span className="rounded-full bg-saffron/20 px-3 py-1 text-xs font-bold text-saffron">
                    Verified
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ['Today’s orders', '128'],
                    ['Today’s revenue', 'Rs. 24,850'],
                    ['Pending orders', '12'],
                    ['Menu items', '42'],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl bg-white p-4 ring-1 ring-clay-100"
                    >
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="mt-2 font-display text-xl font-black text-clay-900">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-clay-100">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-clay-900">
                      Recent orders
                    </p>

                    <ClipboardList size={17} className="text-clay-500" />
                  </div>

                  <div className="mt-4 space-y-3">
                    {[
                      ['Order #1042', 'Table 05', 'Preparing'],
                      ['Order #1041', 'Table 02', 'Ready'],
                      ['Order #1040', 'Table 08', 'Completed'],
                    ].map(([order, table, status]) => (
                      <div
                        key={order}
                        className="flex items-center justify-between rounded-xl bg-cream-50 px-3 py-2.5"
                      >
                        <div>
                          <p className="text-xs font-bold text-clay-900">
                            {order}
                          </p>
                          <p className="text-[11px] text-gray-500">{table}</p>
                        </div>

                        <span className="text-[11px] font-bold text-clay-600">
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ================= PRODUCT SHOWCASE ================= */}
      <section
        id="product-showcase"
        className="relative overflow-hidden bg-[#350F07] py-20"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-saffron/15 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead
            light
            title="Everything your restaurant needs"
            sub="From the first QR scan to the final order, HamroMenu keeps your restaurant connected."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Smartphone,
                title: 'Customer ordering',
                copy: 'A simple mobile menu where customers can browse food, add items, and place orders.',
              },
              {
                icon: LayoutDashboard,
                title: 'Restaurant workspace',
                copy: 'Manage menus, tables, orders, staff, payments, and daily restaurant activities.',
              },
              {
                icon: BarChart3,
                title: 'Smart insights',
                copy: 'Understand popular dishes, frequently ordered combinations, and restaurant performance.',
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                className="rounded-3xl bg-white/10 p-6 ring-1 ring-white/10 backdrop-blur-sm"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron text-clay-900">
                  <item.icon size={22} />
                </span>

                <h3 className="mt-5 font-display text-xl font-bold text-white">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-cream-50/70">
                  {item.copy}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="features" className="relative bg-cream-100 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead
            title="Everything in one place"
            sub="Simple tools for restaurant owners, staff, kitchen teams, and customers."
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={QrCode}
              title="Table QR Codes"
              copy="Generate table-specific QR codes and let customers access the correct restaurant menu."
            />

            <FeatureCard
              icon={ScanLine}
              title="Digital Menu"
              copy="Create beautiful menus with food images, descriptions, prices, categories, and availability."
            />

            <FeatureCard
              icon={ShoppingBag}
              title="Online Ordering"
              copy="Receive customer orders directly from the restaurant’s digital menu."
            />

            <FeatureCard
              icon={ChefHat}
              title="Kitchen Display"
              copy="Help kitchen staff manage new, preparing, and ready orders efficiently."
            />

            <FeatureCard
              icon={Clock4}
              title="Order Management"
              copy="Track every order from pending to accepted, preparing, ready, served, and completed."
            />

            <FeatureCard
              icon={Banknote}
              title="Payments"
              copy="Manage customer food payments and restaurant subscription payments separately."
            />

            <FeatureCard
              icon={ShieldCheck}
              title="Business Verification"
              copy="Submit business details and documents for admin review before activating the restaurant."
            />

            <FeatureCard
              icon={Sparkles}
              title="Smart Recommendations"
              copy="Recommend popular and frequently purchased food items using order data."
            />
          </div>
        </div>
      </section>

      {/* ================= CUSTOMER EXPERIENCE ================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#3A1208] via-[#4D1A0D] to-[#2B0E06] py-20 text-cream-50">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-saffron/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-saffron">
                Customer experience
              </p>

              <h2 className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl">
                A better ordering experience from the first scan
              </h2>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-cream-50/75">
                Customers can browse the menu, customize their order, log in
                before checkout, make payments, and track their order without
                waiting for a printed menu.
              </p>

              <div className="mt-7 space-y-4">
                {[
                  'Browse menus without installing an app',
                  'Add food items to a simple cart',
                  'Login or register before checkout',
                  'Track order progress in real time',
                  'View order history and submit reviews',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-saffron text-clay-900">
                      <Check size={14} />
                    </span>

                    <span className="text-sm text-cream-50/85">{item}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/menu"
                className={`${btn.lime} mt-8`}
              >
                Browse sample menu
                <ArrowRight size={16} />
              </Link>
            </motion.div>

            <motion.div
              {...fadeUp}
              className="mx-auto w-full max-w-sm rounded-[2.5rem] bg-cream-50 p-4 shadow-2xl"
            >
              <div className="overflow-hidden rounded-[2rem] bg-white">
                <div className="relative h-36 bg-clay-200">
                  <img
                    src={HERO_IMAGE}
                    alt="Restaurant food"
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-clay-900/25" />

                  <div className="absolute bottom-4 left-4">
                    <h3 className="font-display text-2xl font-black text-white">
                      Hamro Café
                    </h3>

                    <p className="text-xs text-white/80">
                      Fresh food, simple ordering
                    </p>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 rounded-full bg-cream-50 px-4 py-2.5 text-xs text-gray-500">
                    <ScanLine size={14} />
                    Search your favourite food
                  </div>

                  <div className="mt-4 flex gap-2 overflow-hidden">
                    {['All', 'Momo', 'Drinks', 'Snacks'].map((category, index) => (
                      <span
                        key={category}
                        className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                          index === 0
                            ? 'bg-clay-700 text-white'
                            : 'bg-cream-50 text-gray-500'
                        }`}
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      ['Chicken Momo', 'Rs. 180'],
                      ['French Fries', 'Rs. 150'],
                      ['Cold Coffee', 'Rs. 160'],
                    ].map(([name, price]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between rounded-2xl bg-cream-50 p-3"
                      >
                        <div>
                          <p className="text-sm font-bold text-clay-900">
                            {name}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">{price}</p>
                        </div>

                        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-clay-700 text-white">
                          <span className="text-lg">+</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-2xl bg-clay-700 px-4 py-3 text-white">
                    <span className="text-sm font-semibold">View cart</span>
                    <span className="text-sm font-bold">3 items</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= RECOMMENDATION ENGINE ================= */}
      <section className="bg-[#FFFDF9] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              {...fadeUp}
              className="order-2 lg:order-1"
            >
              <div className="rounded-[2rem] bg-cream-50 p-6 ring-1 ring-clay-100">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-clay-700 text-white">
                    <Sparkles size={20} />
                  </span>

                  <div>
                    <p className="text-xs font-semibold text-gray-500">
                      Smart recommendation
                    </p>

                    <h3 className="font-display text-xl font-black text-clay-900">
                      Complete your order
                    </h3>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-clay-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-clay-900">
                        Customers who ordered momo
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        also ordered these items
                      </p>
                    </div>

                    <Star size={18} className="fill-saffron text-saffron" />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {['Cold Coke', 'French Fries'].map((item) => (
                      <div
                        key={item}
                        className="rounded-xl bg-cream-50 p-3 text-center"
                      >
                        <p className="text-xs font-bold text-clay-900">
                          {item}
                        </p>

                        <button className="mt-2 text-xs font-bold text-clay-600">
                          Add item
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-gray-500">
                  Recommendations can be generated using frequently purchased
                  combinations and customer order history.
                </p>
              </div>
            </motion.div>

            <motion.div
              {...fadeUp}
              className="order-1 lg:order-2"
            >
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-clay-600">
                Smart recommendations
              </p>

              <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-clay-900 sm:text-4xl">
                Help customers discover what they will love
              </h2>

              <p className="mt-5 text-base leading-relaxed text-gray-600">
                HamroMenu can analyze completed orders and recommend food
                items that customers frequently purchase together.
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-clay-100 text-clay-600">
                    <Check size={16} />
                  </span>

                  <div>
                    <h3 className="font-bold text-clay-900">
                      Apriori algorithm
                    </h3>

                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      Finds food combinations such as momo and cold drinks
                      that are frequently purchased together.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-clay-100 text-clay-600">
                    <Check size={16} />
                  </span>
                  <div>
                    <h3 className="font-bold text-clay-900">
                      Collaborative filtering
                    </h3>

                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      Recommends items based on similar customer order
                      patterns.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= FOR RESTAURANTS ================= */}
      <section id="for-restaurants" className="bg-cream-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead
            title="Built for restaurant owners"
            sub="Whether you run a café, tea shop, bakery, or restaurant, HamroMenu helps you manage your daily operations."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Store,
                title: 'Create your restaurant',
                copy: 'Register your business, create a restaurant profile, and publish your digital menu.',
              },
              {
                icon: Users,
                title: 'Manage your team',
                copy: 'Give managers and kitchen staff access to the tools they need.',
              },
              {
                icon: BarChart3,
                title: 'Understand your business',
                copy: 'View orders, revenue, popular items, reviews, and restaurant performance.',
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                className="rounded-3xl bg-white p-7 ring-1 ring-clay-100 transition-all hover:-translate-y-1 hover:shadow-card"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clay-700 text-white">
                  <item.icon size={22} />
                </span>

                <h3 className="mt-5 font-display text-xl font-bold text-clay-900">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {item.copy}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link to="/register" className={btn.primary}>
              Register your restaurant
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section id="pricing" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead
            title="Choose the plan that fits your restaurant"
            sub="Start small and upgrade when your restaurant grows."
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {[
              {
                icon: Smartphone,
                title: 'Basic',
                price: 'Free',
                description: 'For restaurants starting with digital menus.',
                points: [
                  'Basic digital menu',
                  'Limited QR codes',
                  'Limited menu items',
                  'Basic order management',
                ],
              },
              {
                icon: LayoutDashboard,
                title: 'Starter',
                price: 'Starter',
                description: 'For restaurants ready to manage daily orders.',
                points: [
                  'Restaurant dashboard',
                  '5 table QR codes',
                  'Maximum 15 menu items',
                  'Staff and manager access',
                  'Basic order management',
                ],
                popular: true,
              },
              {
                icon: Sparkles,
                title: 'Premium',
                price: 'Premium',
                description: 'For growing restaurants that need more tools.',
                points: [
                  'More QR codes',
                  'More menu items',
                  'Advanced reports',
                  'Smart recommendations',
                  'More staff accounts',
                ],
              },
            ].map((plan) => (
              <motion.div
                key={plan.title}
                {...fadeUp}
                className={`relative flex flex-col rounded-3xl p-7 transition-all hover:-translate-y-1 hover:shadow-card ${
                  plan.popular
                    ? 'bg-clay-900 text-white ring-2 ring-saffron'
                    : 'bg-cream-50 text-clay-900 ring-1 ring-cream-100'
                }`}
              >
                {plan.popular && (
                  <span className="absolute right-6 top-6 rounded-full bg-saffron px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-clay-900">
                    Recommended
                  </span>
                )}

                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    plan.popular
                      ? 'bg-white/10 text-saffron'
                      : 'bg-clay-700 text-white'
                  }`}
                >
                  <plan.icon size={22} />
                </span>

                <h3
                  className={`mt-5 font-display text-2xl font-black ${
                    plan.popular ? 'text-white' : 'text-clay-900'
                  }`}
                >
                  {plan.title}
                </h3>

                <p
                  className={`mt-2 text-sm ${
                    plan.popular ? 'text-white/65' : 'text-gray-600'
                  }`}
                >
                  {plan.description}
                </p>

                <p
                  className={`mt-6 font-display text-2xl font-black ${
                    plan.popular ? 'text-saffron' : 'text-clay-900'
                  }`}
                >
                  {plan.price}
                </p>

                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {plan.points.map((point) => (
                    <li
                      key={point}
                      className={`flex items-start gap-2.5 text-sm ${
                        plan.popular ? 'text-white/75' : 'text-gray-600'
                      }`}
                    >
<span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            plan.popular
                              ? 'bg-saffron text-clay-900'
                              : 'bg-saffron/15 text-saffron-deep'
                          }`}
                        >
                        <Check size={12} />
                      </span>

                      {point}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`mt-8 ${
                    plan.popular ? btn.lime : btn.soft
                  }`}
                >
                  Get started
                  <ArrowRight size={15} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#5A2213] via-[#3F130A] to-[#250A04] py-16 text-cream-50">
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-saffron/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
            <div className="flex items-center gap-5 text-center lg:text-left">
              <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-saffron ring-1 ring-white/10 sm:flex">
                <Utensils size={26} />
              </span>

              <div>
                <h2 className="font-display text-3xl font-black tracking-tight">
                  Ready to bring your restaurant online?
                </h2>

                <p className="mt-2 max-w-md text-sm leading-relaxed text-cream-50/75">
                  Start with a digital menu and give your customers a simpler
                  way to order.
                </p>
              </div>
            </div>

            <Link
              to="/register"
              className={`${btn.lime} shrink-0 whitespace-nowrap`}
            >
              Create your restaurant
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-clay-100 bg-cream-100">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-1">
              <Link to="/" aria-label="HamroMenu home">
                <Logo />
              </Link>

              <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-600">
                Smart QR restaurant ordering for Nepal. Turn every table into
                a seamless digital dining experience.
              </p>

              <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-gray-500">
                Made with
                <Heart size={12} className="fill-clay-500 text-clay-500" />
                in Kathmandu
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-clay-700">
                Product
              </h4>

              <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
                <li>
                  <a
                    href="#how-it-works"
                    className="transition-colors hover:text-clay-700"
                  >
                    How it works
                  </a>
                </li>

                <li>
                  <a
                    href="#features"
                    className="transition-colors hover:text-clay-700"
                  >
                    Features
                  </a>
                </li>

                <li>
                  <a
                    href="#for-restaurants"
                    className="transition-colors hover:text-clay-700"
                  >
                    For restaurants
                  </a>
                </li>

                <li>
                  <a
                    href="#pricing"
                    className="transition-colors hover:text-clay-700"
                  >
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-clay-700">
                Get started
              </h4>

              <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
                <li>
                  <Link
                    to="/login"
                    className="transition-colors hover:text-clay-700"
                  >
                    Restaurant login
                  </Link>
                </li>

                <li>
                  <Link
                    to="/register"
                    className="transition-colors hover:text-clay-700"
                  >
                    Register your restaurant
                  </Link>
                </li>

                <li>
                  <Link
                    to="/customer/register"
                    className="transition-colors hover:text-clay-700"
                  >
                    Create a customer account
                  </Link>
                </li>

                <li>
                  <Link
                    to="/menu"
                    className="transition-colors hover:text-clay-700"
                  >
                    Browse menus
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-clay-700">
                Contact
              </h4>

              <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <MapPin
                    size={15}
                    className="mt-0.5 shrink-0 text-clay-500"
                  />
                  Kathmandu, Nepal
                </li>

                <li className="flex items-start gap-2">
                  <Mail
                    size={15}
                    className="mt-0.5 shrink-0 text-clay-500"
                  />
                  hello@hamromenu.com
                </li>

                <li className="flex items-start gap-2">
                  <Phone
                    size={15}
                    className="mt-0.5 shrink-0 text-clay-500"
                  />
                  +977 1 400 0000
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-clay-200/70">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} HamroMenu. All rights reserved.
            </p>

            <div className="flex items-center gap-5 text-xs text-gray-500">
              <a
                href="#"
                className="transition-colors hover:text-clay-700"
              >
                Privacy
              </a>

              <a
                href="#"
                className="transition-colors hover:text-clay-700"
              >
                Terms
              </a>

              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 font-bold text-clay-700 transition-colors hover:text-clay-600"
              >
                Restaurant sign in
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1800&q=80';

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