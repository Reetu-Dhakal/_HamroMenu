import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cx } from '../../lib/format';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const quick = [
    { label: 'Customer', email: 'customer@himalayanflavors.com' },
    { label: 'Admin', email: 'admin@himalayanflavors.com' },
  ];

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      nav(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-cream-50">
      <Helmet><title>Sign in · HamroMenu</title></Helmet>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-clay-600 font-display text-2xl font-black text-white shadow-float">H</div>
          <h1 className="font-display text-2xl font-bold text-ink">Welcome back</h1>
          <p className="mt-1 text-[13.5px] text-ink-soft">Sign in to order, track, and manage your HamroMenu.</p>
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-bold text-ink-soft">Email</span>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input !py-3 pl-10" placeholder="you@example.com" autoComplete="email" />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-bold text-ink-soft">Password</span>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input w-full pl-10" placeholder="••••••••" autoComplete="current-password" />
            </div>
          </label>

          {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-red-700">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? <Loader2 size={17} className="animate-spin" /> : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 rounded-2xl border border-dashed border-cream-300 bg-paper px-4 py-3">
          <p className="text-center text-[11.5px] font-bold uppercase tracking-wide text-ink-faint">Quick demo logins — password123</p>
          <div className="mt-2 flex justify-center gap-2">
            {quick.map((q) => (
              <button
                key={q.email}
                className={cx('chip', q.label === 'Admin' && 'bg-clay-600/10 text-clay-700 ring-clay-600/25')}
                onClick={() => { setEmail(q.email); setPassword('password123'); toast.info(`Filled ${q.label} credentials`); }}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-[13px] text-ink-soft">
          New to HamroMenu?{' '}
          <Link to="/register" state={{ from }} className="font-bold text-clay-700 hover:underline">Create an account</Link>
        </p>
        <Link to={from} className="mx-auto mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-faint hover:text-ink">
          <ArrowLeft size={14} /> Back
        </Link>
      </div>
    </div>
  );
}