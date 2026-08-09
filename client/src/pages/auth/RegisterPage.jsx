import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, Lock, User, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await register({ name, email, password });
      toast.success('Account created — welcome!');
      nav(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-cream-50">
      <Helmet><title>Create account · HamroMenu</title></Helmet>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-clay-600 font-display text-2xl font-black text-white shadow-float">H</div>
          <h1 className="font-display text-2xl font-bold text-ink">Join HamroMenu</h1>
          <p className="mt-1 text-[13.5px] text-ink-soft">Order faster, track live, and rate your favourites.</p>
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-bold text-ink-soft">Full name</span>
            <div className="relative">
              <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input required value={name} onChange={(e) => setName(e.target.value)} className="input !w-full pl-10" placeholder="Aarav Shrestha" autoComplete="name" />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-bold text-ink-soft">Email</span>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input !w-full pl-10" placeholder="you@example.com" autoComplete="email" />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-bold text-ink-soft">Password</span>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="input w-full pl-10" placeholder="8+ characters" autoComplete="new-password" />
            </div>
          </label>

          {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-red-700">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? <Loader2 size={17} className="animate-spin" /> : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-ink-soft">
          Already have an account?{' '}
          <Link to="/login" state={{ from }} className="font-bold text-clay-700 hover:underline">Sign in</Link>
        </p>
        <Link to={from} className="mx-auto mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-faint">
          <ArrowLeft size={14} /> Back
        </Link>
      </div>
    </div>
  );
}