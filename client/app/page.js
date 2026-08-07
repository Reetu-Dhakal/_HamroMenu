'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  QrCode,
  ShoppingBag,
  Star,
  Sparkles,
  ChevronRight,
  ScanLine,
  UtensilsCrossed,
  ChefHat,
  Bell,
  ArrowRight,
} from 'lucide-react';
import SiteNav from '@/components/SiteNav';
import Footer from '@/components/Footer';
import { useRestaurant, useMenu } from '@/lib/useApi';
import { formatCurrency } from '@/lib/format';

const SEED_SLUG = process.env.NEXT_PUBLIC_RESTAURANT_ID || 'himalayan-flavors';

export default function HomePage() {
  const restaurant = useRestaurant(SEED_SLUG);
  const menu = useMenu(restaurant.data?._id);

  const hero = restaurant.data;
  const featured = (menu.data?.items || []).filter((i) => i.isFeatured).slice(0, 4);

  return (
    <div className="min-h-screen">
      <SiteNav restaurant={hero} />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950" />
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-clay-600/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="container-px relative py-20 lg:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div className="animate-fade-in">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-gold-400">
                <Sparkles className="h-3.5 w-3.5" /> QR ordering · now {hero?.isOpen ? 'open' : 'closed'}
              </span>
              <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-cream sm:text-5xl lg:text-6xl">
                {hero?.tagline || 'Taste the mountains, one plate at a time'}
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-ink-200/80 sm:text-lg">
                {hero?.description ||
                  'Scan the QR on your table, browse a living digital menu and order in seconds. Watch every step of your meal come to life.'}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={`/order?r=${hero?._id}`} className="btn-clay">
                  <ScanLine className="h-4 w-4" /> Order now
                </Link>
                <a href="#how" className="btn-white">
                  How it works <ChevronRight className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-10 flex flex-wrap gap-8 text-cream">
                <Stat value="30s" label="to your first order" />
                <Stat value="100%" label="contactless dining" />
                <Stat value="4.9" label="guest rating" />
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <div className="relative rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                  <Image
                    src={hero?.coverUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&h=1125&fit=crop&auto=format&q=75'}
                    alt="Signature dishes"
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 100vw, 480px"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent" />
                  <div className="absolute inset-x-4 bottom-4">
                    <span className="badge bg-clay-600 text-white">Featured</span>
                    {featured[0] && (
                      <>
                        <p className="mt-2 font-display text-xl font-semibold text-white">{featured[0].name}</p>
                        <p className="text-sm text-white/80">{formatCurrency(featured[0].price, hero?.currency)}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20 lg:py-28">
        <div className="container-px">
          <div className="max-w-2xl text-balance">
            <span className="section-eyebrow">Effortless</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
              From QR to delighted, in four steps
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Step
              icon={<QrCode className="h-6 w-6" />}
              n="01"
              title="Scan"
              body="Point your camera at the QR on your table. The menu opens instantly — no app needed."
            />
            <Step
              icon={<UtensilsCrossed className="h-6 w-6" />}
              n="02"
              title="Browse"
              body="Explore dishes with real photos, filters and smart recommendations made for you."
            />
            <Step
              icon={<Bell className="h-6 w-6" />}
              n="03"
              title="Order"
              body="Tap to add, check out in seconds and pay your way — eSewa, Khalti or after the meal."
            />
            <Step
              icon={<ChefHat className="h-6 w-6" />}
              n="04"
              title="Track & enjoy"
              body="Watch live status as your order moves from kitchen to table. Just sit back."
            />
          </div>
        </div>
      </section>

      {/* FEATURED DISHES */}
      <section id="menu" className="bg-surface py-20 lg:py-28">
        <div className="container-px">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <span className="section-eyebrow">From the kitchen</span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
                Chef's picks
              </h2>
            </div>
            <Link href={`/order?r=${hero?._id}`} className="btn-outline">
              View full menu <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.length === 0 && (
              <div className="col-span-full grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="card overflow-hidden">
                    <div className="skeleton aspect-square" />
                    <div className="space-y-2 p-4">
                      <div className="skeleton h-4 w-3/4" />
                      <div className="skeleton h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {featured.map((item, i) => (
              <Link
                key={item._id}
                href={`/order?r=${hero?._id}`}
                className="group card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="relative aspect-square overflow-hidden">
                  {item.isVeg && (
                    <span className="badge absolute left-3 top-3 z-10 bg-emerald-600 text-white">Veg</span>
                  )}
                  {item.isPopular && (
                    <span className="badge absolute right-3 top-3 z-10 bg-gold-500 text-ink-950">Popular</span>
                  )}
                  <Image
                    src={item.imageUrl || '/placeholder-dish.jpg'}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold text-ink-950">{item.name}</h3>
                    <p className="whitespace-nowrap font-sans text-lg font-bold text-clay-600">
                      {formatCurrency(item.price, hero?.currency)}
                    </p>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-600">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="reviews" className="py-20 lg:py-28">
        <div className="container-px">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-eyebrow">Word on the street</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
              Loved at the table
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Testimonial
              quote="Ordered straight from my seat and the momos were ready before I finished my chat. Genuinely effortless."
              name="Anita"
              role="Regular · Kathmandu"
            />
            <Testimonial
              quote="The kitchen timeline is a game changer. I always know exactly when to come back to the table."
              name="Prakash"
              role="Foodie · Thamel"
            />
            <Testimonial
              quote="Paying with eSewa from the table and splitting the bill feel like the future of dining in Nepal."
              name="Sujita"
              role="Group of four"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 lg:pb-28">
        <div className="container-px">
          <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-6 py-16 text-center sm:px-16">
            <div className="absolute -left-16 top-0 h-48 w-48 rounded-full bg-clay-600/20 blur-3xl" />
            <div className="absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl" />
            <h2 className="relative text-balance text-3xl font-semibold tracking-tight text-cream sm:text-4xl">
              Your table is a venue. <br className="sm:hidden" /> Your phone is the menu.
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-ink-200/80">
              Scan in, order out. See the menu in seconds and start the experience now.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link href={`/order?r=${hero?._id}`} className="btn-clay">
                <QrCode className="h-4 w-4" /> Open your table menu
              </Link>
              <Link href="/login" className="btn-white">Sign in for restaurants</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold text-clay-400">{value}</p>
      <p className="text-xs text-ink-200/70">{label}</p>
    </div>
  );
}

function Step({ icon, n, title, desc }) {
  return (
    <div className="group relative rounded-2xl border border-ink-900/5 bg-surface p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-clay-500/30 hover:shadow-lift">
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-clay-50 text-clay-600 transition group-hover:bg-clay-600 group-hover:text-white">
          {icon}
        </div>
        <span className="font-display text-5xl font-semibold text-ink-900/5">{n}</span>
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold text-ink-950">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">{desc}</p>
    </div>
  );
}

function Testimonial({ name, role, quote }) {
  return (
    <figure className="card flex flex-col justify-between p-6">
      <blockquote className="text-pretty text-base leading-relaxed text-ink-800">"{quote}"</blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-clay-100 font-display font-semibold text-clay-700">
          {name[0]}
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-950">{name}</p>
          <p className="text-xs text-ink-500">{role}</p>
        </div>
        <div className="ml-auto text-sm font-bold text-gold-600">★★★★★</div>
      </figcaption>
    </figure>
  );
}