import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useReducedMotion } from 'framer-motion';
import logoImg from '../assets/logo.png';

import {
  ArrowRight,
  BarChart3,
  Check,
  ChefHat,
  CreditCard,
  Crown,
  Facebook,
  FileCheck,
  Instagram,
  LayoutDashboard,
  LogIn,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ScanLine,
  ShoppingBag,
  Sparkles,
  Store,
  Twitter,
  Utensils,
} from 'lucide-react';

/*
|--------------------------------------------------------------------------
| HAMROMENU LANDING PAGE
|--------------------------------------------------------------------------
| Design intent:
| - Warm, human editorial palette (cream, olive, terracotta)
| - Real restaurant + food photography (Unsplash)
| - Gentle headline floating animation + scroll reveals
| - Fun micro-interactions: photo tilt, wiggling icons, lifted cards
| - No fake statistics, testimonials, or invented capabilities
|--------------------------------------------------------------------------
*/

const COLORS = {
  background: '#FBF7EF',
  surface: '#F3EBDD',
  surfaceLight: '#FFFDF8',

  green: '#657153',
  greenDark: '#4F5D42',
  greenLight: '#DDE5D4',

  terracotta: '#C96B52',
  terracottaLight: '#F0D2C8',

  yellowLight: '#F6E9C8',

  blueLight: '#DCE8ED',

  text: '#374034',
  muted: '#73786F',
  border: '#DED7C9',
  white: '#FFFFFF',
};

const U = 'https://images.unsplash.com';

const IMG = {
  hero: `${U}/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1100&q=85`,
  food: `${U}/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=85`,
  plates: `${U}/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=85`,
};

const fadeUp = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-70px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

const popIn = {
  initial: { opacity: 0, scale: 0.92, y: 18 },
  whileInView: { opacity: 1, scale: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { type: 'spring', stiffness: 150, damping: 16 },
};

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#657153] px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#4F5D42]';

const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full border border-[#657153]/25 bg-white/70 px-6 py-3 text-sm font-semibold text-[#4F5D42] transition-colors duration-300 hover:bg-white';

const navLink =
  'text-sm font-medium text-[#374034]/65 transition-colors hover:text-[#657153]';

const HEADLINE = [
  { text: 'A', accent: false },
  { text: 'simpler', accent: false },
  { text: 'way', accent: false },
  { text: 'to', accent: false },
  { text: 'run', accent: true },
  { text: 'your', accent: true },
  { text: 'restaurant.', accent: true },
];

const PLANS = [
  {
    name: 'Free / Trial',
    tagline: 'Get started with a 14-day trial',
    price: 0,
    icon: Utensils,
    cta: 'Start free',
    featured: false,
    features: [
      '14-day free trial',
      'Up to 5 tables',
      'Up to 20 menu items',
      '1 staff account',
      'HamroMenu branding',
    ],
  },
  {
    name: 'Basic',
    tagline: 'For restaurants with larger menus',
    price: 3999,
    icon: Store,
    cta: 'Choose Basic',
    featured: false,
    features: [
      'Up to 15 tables',
      'Up to 100 menu items',
      'Up to 3 staff accounts',
      'Basic reports',
      'HamroMenu branding',
    ],
  },
  {
    name: 'Pro',
    tagline: 'For full restaurant operations',
    price: 9999,
    icon: LayoutDashboard,
    cta: 'Choose Pro',
    featured: true,
    features: [
      'Unlimited tables, items & staff',
      'KNN food recommendations',
      'Frequently ordered together (Apriori)',
      'Advanced analytics dashboard',
    ],
  },
  {
    name: 'Premium',
    tagline: 'The complete experience',
    price: 19999,
    icon: Crown,
    cta: 'Choose Premium',
    featured: false,
    features: [
      'Everything in Pro',
      'Custom branding — remove HamroMenu badge',
      'Report export',
      'Priority verification review',
    ],
  },
];

const FEATURES = [
  {
    icon: QrCode,
    title: 'QR-based ordering',
    text: 'Connect individual restaurant tables to the digital ordering experience.',
    color: COLORS.greenLight,
  },
  {
    icon: ScanLine,
    title: 'Digital menus',
    text: 'Organize menu categories and food items in a digital restaurant menu.',
    color: COLORS.yellowLight,
  },
  {
    icon: ChefHat,
    title: 'Kitchen operations',
    text: 'Provide kitchen staff with incoming orders and order-status workflow.',
    color: COLORS.terracottaLight,
  },
  {
    icon: CreditCard,
    title: 'Customer payments',
    text: 'Support configured payment methods including eSewa, Khalti, cash, and pay-after-meal.',
    color: COLORS.blueLight,
  },
  {
    icon: FileCheck,
    title: 'Restaurant verification',
    text: 'Collect verification information and documents as part of restaurant onboarding.',
    color: COLORS.yellowLight,
  },
  {
    icon: LayoutDashboard,
    title: 'Restaurant dashboards',
    text: 'Give restaurant users access to the operational information relevant to their roles.',
    color: COLORS.greenLight,
  },
  {
    icon: BarChart3,
    title: 'Business information',
    text: 'Support restaurant-level information around orders, revenue, reviews, and menu activity.',
    color: COLORS.blueLight,
  },
  {
    icon: Sparkles,
    title: 'Food recommendations',
    text: 'Use completed-order patterns to generate personalized food recommendations.',
    color: COLORS.terracottaLight,
  },
];

const STEPS = [
  {
    number: '01',
    icon: QrCode,
    title: 'Scan the table',
    text: 'Each table gets its own QR code. Customers scan it and the digital menu opens right away.',
    bg: COLORS.greenLight,
  },
  {
    number: '02',
    icon: ShoppingBag,
    title: 'Place the order',
    text: 'Customers browse categories, add items to the cart, log in before checkout, and order.',
    bg: COLORS.terracottaLight,
  },
  {
    number: '03',
    icon: ChefHat,
    title: 'Prepare and serve',
    text: 'The kitchen sees the order instantly and moves it through the order statuses until served.',
    bg: COLORS.yellowLight,
  },
];


function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <img
        src={logoImg}
        alt="HamroMenu"
        className="h-9 w-9 rounded-xl object-cover"
      />

      <span
        className="text-[19px] font-bold tracking-[-0.04em]"
        style={{ color: COLORS.text }}
      >
        Hamro
        <span style={{ color: COLORS.terracotta }}>Menu</span>
      </span>
    </span>
  );
}


function SectionLabel({ children }) {
  return (
    <p
      className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em]"
      style={{ color: COLORS.terracotta }}
    >
      {children}
    </p>
  );
}


function SectionTitle({ children, className = '' }) {
  return (
    <h2
      className={`text-3xl font-semibold leading-[1.12] tracking-[-0.035em] sm:text-4xl ${className}`}
      style={{ color: COLORS.text }}
    >
      {children}
    </h2>
  );
}


function FloatingWord({
  children,
  accent = false,
  delay = 0,
  base = COLORS.text,
  accentColor = COLORS.terracotta,
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      className="inline-block"
      style={{ color: accent ? accentColor : base }}
      animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
      transition={
        reduceMotion
          ? undefined
          : { duration: 5, repeat: Infinity, ease: 'easeInOut', delay }
      }
    >
      {children}
    </motion.span>
  );
}


function PricingCard({ plan }) {
  const { name, tagline, price, icon: Icon, cta, featured, features } = plan;

  return (
    <motion.div
      {...fadeUp}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      className={`flex flex-col rounded-[1.75rem] p-7 ${
        featured ? 'shadow-xl shadow-[#4F5D42]/15' : 'border'
      }`}
      style={{
        borderColor: featured ? 'transparent' : COLORS.border,
        backgroundColor: featured ? COLORS.greenDark : COLORS.surfaceLight,
      }}
    >
      <div className="flex items-center justify-between">
        <motion.div
          whileHover={{ rotate: -10 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{
            backgroundColor: featured ? 'rgba(255,255,255,0.15)' : COLORS.greenLight,
            color: featured ? COLORS.white : COLORS.greenDark,
          }}
        >
          <Icon size={19} />
        </motion.div>

        {featured && (
          <motion.span
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: COLORS.terracotta, color: COLORS.white }}
          >
            Most popular
          </motion.span>
        )}
      </div>

      <h3
        className="mt-6 text-xl font-semibold"
        style={{ color: featured ? COLORS.white : COLORS.text }}
      >
        {name}
      </h3>

      <p
        className="mt-1 text-xs"
        style={{ color: featured ? 'rgba(255,255,255,0.72)' : COLORS.muted }}
      >
        {tagline}
      </p>

      <div className="mt-6 flex items-baseline gap-1.5">
        <span
          className="text-[2.4rem] font-semibold leading-none tracking-tight"
          style={{ color: featured ? COLORS.white : COLORS.text }}
        >
          {price === 0 ? 'Free' : `Rs. ${price.toLocaleString('en-IN')}`}
        </span>

        {price !== 0 && (
          <span
            className="text-xs font-medium"
            style={{
              color: featured ? 'rgba(255,255,255,0.72)' : COLORS.muted,
            }}
          >
            / month
          </span>
        )}
      </div>

      <div
        className="my-6 h-px w-full"
        style={{
          backgroundColor: featured ? 'rgba(255,255,255,0.16)' : COLORS.border,
        }}
      />

      <ul className="flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: featured ? 'rgba(255,255,255,0.16)' : COLORS.greenLight,
                color: featured ? COLORS.white : COLORS.greenDark,
              }}
            >
              <Check size={11} />
            </span>

            <span
              className="text-sm leading-5"
              style={{ color: featured ? 'rgba(255,255,255,0.92)' : COLORS.text }}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Link
        to="/register"
        className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-colors duration-300 ${
          featured
            ? 'bg-white text-[#4F5D42] hover:bg-[#F3EBDD]'
            : 'border border-[#657153]/25 text-[#4F5D42] hover:bg-[#657153] hover:text-white'
        }`}
      >
        {cta}
        <ArrowRight size={15} />
      </Link>
    </motion.div>
  );
}


export default function LandingPage() {
  return (
    <div
      className="min-h-dvh overflow-x-hidden font-sans"
      style={{ backgroundColor: COLORS.background, color: COLORS.text }}
    >
      <Helmet>
        <title>HamroMenu — Restaurant Ordering & Management</title>

        <meta
          name="description"
          content="HamroMenu is a restaurant platform for digital menus, QR table ordering, restaurant management, kitchen operations, payments, subscriptions, and recommendations."
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />

        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </Helmet>


      {/* =========================================================
          NAVBAR
      ========================================================= */}

      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{
          backgroundColor: `${COLORS.background}E8`,
          borderColor: COLORS.border,
        }}
      >
        <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" aria-label="HamroMenu home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className={navLink}>
              How it works
            </a>

            <a href="#features" className={navLink}>
              Features
            </a>

            <a href="#subscriptions" className={navLink}>
              Pricing
            </a>
          </nav>

          <Link to="/login" className={secondaryButton}>
            <LogIn size={15} />
            Login
          </Link>
        </div>
      </header>


      <main>

        {/* =========================================================
            HERO — full section background photo
        ========================================================= */}

        <section
          className="relative isolate overflow-hidden border-b"
          style={{ borderColor: COLORS.border }}
        >
          <div className="absolute inset-0 -z-10">
            <img
              src={IMG.hero}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
            />

            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(100deg, rgba(44,52,37,0.94) 0%, rgba(44,52,37,0.85) 40%, rgba(44,52,37,0.55) 70%, rgba(44,52,37,0.35) 100%)',
              }}
            />
          </div>

          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
            <motion.div {...fadeUp} className="max-w-2xl">
              <p
                className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ color: COLORS.terracottaLight }}
              >
                How your guests order
              </p>

              <h1
                className="text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.055em]"
                style={{ color: COLORS.white }}
              >
                {HEADLINE.map((word, index) => (
                  <span key={word.text}>
                    {index > 0 && ' '}
                    <FloatingWord
                      accent={word.accent}
                      delay={index * 0.14}
                      base={COLORS.white}
                      accentColor={COLORS.terracottaLight}
                    >
                      {word.text}
                    </FloatingWord>
                  </span>
                ))}
              </h1>

              <p
                className="mt-6 max-w-xl text-base leading-7"
                style={{ color: 'rgba(255,255,255,0.82)' }}
              >
                Scan the QR code on your table, browse the menu, place an
                order, and pay — all without leaving your seat. The kitchen
                gets it instantly.
              </p>
            </motion.div>

            <motion.div {...fadeUp} className="mt-9 flex flex-wrap items-center gap-3">
              <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#374034] transition-colors duration-300 hover:bg-[#F3EBDD]"
                >
                  Register your restaurant
                  <ArrowRight size={15} />
                </Link>
              </motion.div>

              <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/restaurants"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/10"
                >
                  Explore restaurants
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>


        {/* =========================================================
            HOW IT WORKS
        ========================================================= */}

        <section id="how-it-works" className="py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <motion.div {...fadeUp} className="max-w-2xl">
              <SectionLabel>How it works</SectionLabel>

              <SectionTitle>From the table to the kitchen.</SectionTitle>

              <p
                className="mt-4 max-w-xl text-sm leading-6"
                style={{ color: COLORS.muted }}
              >
                Three simple steps connect your guests' phones to your
                kitchen and your staff.
              </p>
            </motion.div>


            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => {
                const Icon = step.icon;

                return (
                  <motion.div
                    key={step.number}
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: index * 0.1 }}
                    whileHover={{ y: -6 }}
                    className="group rounded-[1.5rem] border p-8"
                    style={{
                      backgroundColor: step.bg,
                      borderColor: COLORS.border,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: COLORS.white,
                          color: COLORS.greenDark,
                        }}
                      >
                        <Icon
                          className="transition-transform duration-300 group-hover:rotate-6"
                          size={22}
                        />
                      </span>

                      <span
                        className="font-['Playfair_Display'] text-4xl italic leading-none"
                        style={{ color: COLORS.terracotta }}
                      >
                        {step.number}
                      </span>
                    </div>

                    <h3
                      className="mt-7 text-xl font-semibold"
                      style={{ color: COLORS.text }}
                    >
                      {step.title}
                    </h3>

                    <p
                      className="mt-3 text-sm leading-6"
                      style={{ color: COLORS.muted }}
                    >
                      {step.text}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>


        {/* =========================================================
            CUSTOMER SIDE — image + checklist
        ========================================================= */}

        <section
          className="py-24"
          style={{ backgroundColor: COLORS.surface }}
        >
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
            <motion.div {...popIn} className="order-2 lg:order-1">
              <div
                className="rounded-[1.75rem] p-2"
                style={{ backgroundColor: COLORS.greenLight }}
              >
                <img
                  src={IMG.food}
                  alt="Plated food served at a restaurant"
                  className="aspect-[4/3] w-full rounded-[1.25rem] object-cover"
                  loading="lazy"
                />
              </div>
            </motion.div>

            <motion.div {...fadeUp} className="order-1 lg:order-2">
              <SectionLabel>For your guests</SectionLabel>

              <SectionTitle>
                A digital ordering experience without another app.
              </SectionTitle>

              <p
                className="mt-5 max-w-xl text-sm leading-7"
                style={{ color: COLORS.muted }}
              >
                Customers open the menu through the table QR code, build a
                cart, authenticate before checkout, and follow their order
                until it reaches the table.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  'QR menu for each table',
                  'Search, categories & veg filter',
                  'Item options and customizations',
                  'Pay by eSewa, Khalti, cash or after the meal',
                  'Order tracking and history',
                  'Food recommendations & reviews',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: COLORS.greenLight, color: COLORS.greenDark }}
                    >
                      <Check size={13} />
                    </span>

                    <span className="text-sm" style={{ color: COLORS.text }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>


        {/* =========================================================
            FEATURES
        ========================================================= */}

        <section id="features" className="py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <motion.div {...fadeUp}>
                <SectionLabel>Platform features</SectionLabel>

                <SectionTitle>
                  One system, multiple parts working together.
                </SectionTitle>
              </motion.div>

              <motion.p
                {...fadeUp}
                className="max-w-md text-sm leading-6"
                style={{ color: COLORS.muted }}
              >
                HamroMenu combines customer-facing ordering with restaurant
                operations and platform-level management.
              </motion.p>
            </div>


            <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {FEATURES.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <motion.div
                    key={feature.title}
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: (index % 4) * 0.08 }}
                    whileHover={{ y: -6 }}
                    className="group rounded-[1.5rem] border p-7"
                    style={{
                      backgroundColor: COLORS.surfaceLight,
                      borderColor: COLORS.border,
                    }}
                  >
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{
                        backgroundColor: feature.color,
                        color: COLORS.greenDark,
                      }}
                    >
                      <Icon
                        className="transition-transform duration-300 group-hover:-rotate-6"
                        size={22}
                      />
                    </span>

                    <h3
                      className="mt-6 text-lg font-semibold"
                      style={{ color: COLORS.text }}
                    >
                      {feature.title}
                    </h3>

                    <p
                      className="mt-2 text-sm leading-6"
                      style={{ color: COLORS.muted }}
                    >
                      {feature.text}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>


        {/* =========================================================
            PRICING / SUBSCRIPTIONS
        ========================================================= */}

        <section
          id="subscriptions"
          className="border-y py-24"
          style={{
            backgroundColor: COLORS.surface,
            borderColor: COLORS.border,
          }}
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
              <SectionLabel>Pricing</SectionLabel>

              <SectionTitle>Plans that grow with your restaurant.</SectionTitle>

              <p
                className="mt-4 text-sm leading-6"
                style={{ color: COLORS.muted }}
              >
                Simple monthly pricing. Every restaurant starts with a
                14-day free trial, then picks the plan that fits its tables,
                menu, and team.
              </p>
            </motion.div>


            <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {PLANS.map((plan) => (
                <PricingCard key={plan.name} plan={plan} />
              ))}
            </div>


            <motion.p
              {...fadeUp}
              className="mx-auto mt-10 max-w-xl text-center text-xs leading-5"
              style={{ color: COLORS.muted }}
            >
              Subscription limits control new resource creation. If a plan is
              downgraded, existing restaurant data is retained while new
              resources are restricted by the lower plan limit.
            </motion.p>
          </div>
        </section>


        {/* =========================================================
            CTA
        ========================================================= */}

        <section
          className="py-20"
          style={{ backgroundColor: COLORS.terracottaLight }}
        >
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 sm:px-8 md:flex-row md:items-center">
            <motion.div {...fadeUp}>
              <SectionLabel>Get started</SectionLabel>

              <h2
                className="max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl"
                style={{ color: COLORS.text }}
              >
                Give your restaurant a simpler digital ordering workflow.
              </h2>

              <p
                className="mt-3 max-w-xl text-sm leading-6"
                style={{ color: COLORS.muted }}
              >
                Create your restaurant, configure your menu and tables, and
                start building your digital restaurant experience.
              </p>
            </motion.div>


            <motion.div {...fadeUp} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
              <Link to="/register" className={primaryButton}>
                Create your restaurant
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </section>

      </main>


      {/* =========================================================
          FOOTER
      ========================================================= */}

      <footer
        style={{
          backgroundColor: COLORS.surfaceLight,
          borderColor: COLORS.border,
        }}
        className="border-t"
      >
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">

          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">

            {/* Brand */}
            <div>
              <Link to="/" aria-label="HamroMenu home">
                <Logo />
              </Link>

              <p
                className="mt-4 max-w-sm text-sm leading-6"
                style={{ color: COLORS.muted }}
              >
                A restaurant ordering and management platform connecting
                customers, restaurant teams, kitchens, and platform
                administration — from the table QR code to the kitchen
                screen.
              </p>

              <div className="mt-7 flex items-center gap-3">
                {[
                  { icon: Facebook, label: 'Facebook' },
                  { icon: Instagram, label: 'Instagram' },
                  { icon: Twitter, label: 'Twitter' },
                ].map(({ icon: Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      borderColor: COLORS.border,
                      color: COLORS.greenDark,
                      backgroundColor: COLORS.background,
                    }}
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>


            {/* Product */}
            <div>
              <h4
                className="text-xs font-bold uppercase tracking-[0.15em]"
                style={{ color: COLORS.greenDark }}
              >
                Product
              </h4>

              <ul
                className="mt-5 space-y-3 text-sm"
                style={{ color: COLORS.muted }}
              >
                <li>
                  <a href="#how-it-works" className="transition-colors hover:text-[#657153]">
                    How it works
                  </a>
                </li>

                <li>
                  <a href="#features" className="transition-colors hover:text-[#657153]">
                    Features
                  </a>
                </li>

                <li>
                  <a href="#subscriptions" className="transition-colors hover:text-[#657153]">
                    Pricing
                  </a>
                </li>

                <li>
                  <Link to="/restaurants" className="transition-colors hover:text-[#657153]">
                    Browse restaurants
                  </Link>
                </li>
              </ul>
            </div>


            {/* Company */}
            <div>
              <h4
                className="text-xs font-bold uppercase tracking-[0.15em]"
                style={{ color: COLORS.greenDark }}
              >
                Company
              </h4>

              <ul
                className="mt-5 space-y-3 text-sm"
                style={{ color: COLORS.muted }}
              >
                <li>
                  <Link to="/register" className="transition-colors hover:text-[#657153]">
                    Register restaurant
                  </Link>
                </li>

                <li>
                  <Link to="/login" className="transition-colors hover:text-[#657153]">
                    Restaurant login
                  </Link>
                </li>

                <li>
                  <Link to="/customer/register" className="transition-colors hover:text-[#657153]">
                    Customer registration
                  </Link>
                </li>

                <li>
                  <a href="#" className="transition-colors hover:text-[#657153]">
                    Privacy policy
                  </a>
                </li>

                <li>
                  <a href="#" className="transition-colors hover:text-[#657153]">
                    Terms of service
                  </a>
                </li>
              </ul>
            </div>


            {/* Contact */}
            <div>
              <h4
                className="text-xs font-bold uppercase tracking-[0.15em]"
                style={{ color: COLORS.greenDark }}
              >
                Contact
              </h4>

              <ul
                className="mt-5 space-y-4 text-sm"
                style={{ color: COLORS.muted }}
              >
                <li className="flex items-start gap-3">
                  <MapPin
                    size={16}
                    className="mt-0.5 shrink-0"
                    style={{ color: COLORS.terracotta }}
                  />
                  Jhamsikhel, Lalitpur
                  <br />
                  Kathmandu Valley, Nepal
                </li>

                <li className="flex items-center gap-3">
                  <Mail
                    size={16}
                    className="shrink-0"
                    style={{ color: COLORS.terracotta }}
                  />
                  <a
                    href="mailto:hello@hamromenu.com"
                    className="transition-colors hover:text-[#657153]"
                  >
                    hello@hamromenu.com
                  </a>
                </li>

                <li className="flex items-center gap-3">
                  <Phone
                    size={16}
                    className="shrink-0"
                    style={{ color: COLORS.terracotta }}
                  />
                  <a
                    href="tel:+97715550000"
                    className="transition-colors hover:text-[#657153]"
                  >
                    +977 1 555 0000
                  </a>
                </li>
              </ul>
            </div>

          </div>


          {/* Bottom bar */}
          <div
            className="mt-14 flex flex-col justify-between gap-4 border-t pt-7 sm:flex-row sm:items-center"
            style={{ borderColor: COLORS.border }}
          >
            <p className="text-xs" style={{ color: COLORS.muted }}>
              © {new Date().getFullYear()} HamroMenu. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
              <a
                href="#"
                className="transition-colors hover:text-[#657153]"
                style={{ color: COLORS.muted }}
              >
                Privacy
              </a>

              <a
                href="#"
                className="transition-colors hover:text-[#657153]"
                style={{ color: COLORS.muted }}
              >
                Terms
              </a>

              <a
                href="#"
                className="transition-colors hover:text-[#657153]"
                style={{ color: COLORS.muted }}
              >
                Cookies
              </a>

              <Link
                to="/login"
                className="font-semibold transition-colors hover:text-[#657153]"
                style={{ color: COLORS.greenDark }}
              >
                Sign in →
              </Link>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}