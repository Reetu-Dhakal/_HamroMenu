import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream-50 px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-clay-600 font-display text-3xl font-black text-white shadow-float">H</div>
      <h1 className="font-display text-4xl font-black text-ink">404</h1>
      <p className="mt-2 flex items-center gap-2 text-[14px] font-semibold text-ink-soft"><Compass size={15} className="text-clay-600" /> This page wandered off the trail.</p>
      <div className="mt-6 flex gap-2.5">
        <Link to="/" className="btn-primary"><Home size={15} /> Go home</Link>
        <Link to="/menu" className="btn-ghost">Browse a menu</Link>
      </div>
    </div>
  );
}