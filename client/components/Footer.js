export default function Footer() {
  return (
    <footer className="border-t border-ink-900/5 bg-ink-950 text-cream">
      <div className="container-px py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="font-display text-2xl font-semibold tracking-tight">HamroMenu</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-200">
              Scan, browse, order, enjoy. A smarter way to dine at our table — from the kitchen
              to you in real time.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay-400">Explore</p>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-200">
              <li><a href="/#how" className="hover:text-white">How it works</a></li>
              <li><a href="/#menu" className="hover:text-white">The menu</a></li>
              <li><a href="/#reviews" className="hover:text-white">Reviews</a></li>
              <li><a href="/login" className="hover:text-white">Sign in</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay-400">The experience</p>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-200">
              <li>QR ordering</li>
              <li>Live order tracking</li>
              <li>eSewa &amp; Khalti payments</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-ink-800 pt-6 text-xs text-ink-400 sm:flex-row">
          <p>© {new Date().getFullYear()} HamroMenu. All rights reserved.</p>
          <p>Crafted with care for great food.</p>
        </div>
      </div>
    </footer>
  );
}