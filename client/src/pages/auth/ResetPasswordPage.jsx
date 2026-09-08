import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';

export default function ResetPasswordPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream-50 p-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-ink">Invalid Reset Link</h1>
          <p className="mt-2 text-sm text-ink-faint">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="mt-4 inline-block text-sm font-semibold text-clay-600">Request a new link</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await request('/api/auth/reset-password', { method: 'POST', body: { token, password } });
      setSuccess(true);
      toast.success('Password reset successful');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream-50 p-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-saffron/15">
            <CheckCircle size={32} className="text-saffron-deep" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold text-ink">Password reset!</h1>
          <p className="mt-2 text-sm text-ink-faint">Redirecting you to login…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream-50 p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="rounded-2xl border border-cream-200 bg-white p-8 shadow-card">
          <h1 className="font-display text-2xl font-bold text-ink">Reset password</h1>
          <p className="mt-2 text-sm text-ink-faint">Enter your new password below.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-faint">New password</label>
              <div className="relative mt-1">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className="input w-full pl-10 pr-10" minLength={6} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-faint">Confirm password</label>
              <div className="relative mt-1">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input type={showPw ? 'text' : 'password'} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input w-full pl-10" minLength={6} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
