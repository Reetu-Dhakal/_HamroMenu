import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await request('/api/auth/forgot-password', { method: 'POST', body: { email } });
      setSent(true);
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream-50 p-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-saffron/15">
            <CheckCircle size={32} className="text-saffron-deep" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold text-ink">Check your email</h1>
          <p className="mt-2 text-sm text-ink-faint">We've sent a password reset link to <strong>{email}</strong>. Please check your inbox.</p>
          <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-clay-600 hover:text-clay-700">
            <ArrowLeft size={16} /> Back to login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream-50 p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ink-faint hover:text-ink">
          <ArrowLeft size={16} /> Back to login
        </Link>
        <div className="rounded-2xl border border-cream-200 bg-white p-8 shadow-card">
          <h1 className="font-display text-2xl font-bold text-ink">Forgot password?</h1>
          <p className="mt-2 text-sm text-ink-faint">Enter your email and we'll send you a reset link.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-faint">Email address</label>
              <div className="relative mt-1">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input w-full pl-10" placeholder="you@example.com" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
