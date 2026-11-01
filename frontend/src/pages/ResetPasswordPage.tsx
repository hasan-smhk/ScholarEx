import { FormEvent, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, LockKeyhole, Mail, Sparkles } from 'lucide-react';
import { requestPasswordReset, resetPassword } from '../services/api';
import BrandMark from '../components/BrandMark';

export default function ResetPasswordPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const locationState = location.state as { email?: string } | null;
  const [email, setEmail] = useState(locationState?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setMessage('');

    if (token && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const response = token
        ? await resetPassword(token, password)
        : await requestPasswordReset(email);
      setMessage(response.data.message);
      if (token) {
        setPassword('');
        setConfirmPassword('');
      }
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || 'Could not complete the request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden bg-[#071b24] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(94, 234, 212, 0.18) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center justify-center px-5 py-12 sm:px-8">
        <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d2933]/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
          <Link to="/" className="mb-8 inline-flex items-center gap-3">
            <BrandMark className="h-11 w-14 rounded-xl bg-white object-contain p-0.5" />
            <span className="text-xl font-black tracking-tight">Scholar<span className="text-teal-300">Ex</span></span>
          </Link>

          <div className="mb-7">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-300">
              {token ? <LockKeyhole className="h-6 w-6" /> : <Mail className="h-6 w-6" />}
            </div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-teal-300">Account recovery</p>
            <h1 className="text-3xl font-black tracking-tight">
              {token ? 'Create a new password' : 'Forgot your password?'}
            </h1>
            <p className="mt-2 leading-6 text-slate-300">
              {token
                ? 'Choose a new password for your ScholarEx account.'
                : 'Enter the email address linked to your account and we’ll send you a reset link.'}
            </p>
          </div>

          {error && <p role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</p>}
          {message && <p role="status" className="mb-5 rounded-xl border border-teal-300/20 bg-teal-300/10 p-4 text-sm text-teal-100">{message}</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {token ? (
              <>
                <div>
                  <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-200">New password</label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    maxLength={128}
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#071b24]/80 px-4 py-3 text-white outline-none focus:border-teal-300/70 focus:ring-4 focus:ring-teal-300/10"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-slate-200">Confirm new password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={6}
                    maxLength={128}
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#071b24]/80 px-4 py-3 text-white outline-none focus:border-teal-300/70 focus:ring-4 focus:ring-teal-300/10"
                  />
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="reset-email" className="mb-2 block text-sm font-semibold text-slate-200">Email address</label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={254}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#071b24]/80 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-teal-300/70 focus:ring-4 focus:ring-teal-300/10"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3.5 font-bold text-[#06232b] transition-colors hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Please wait…' : token ? 'Update password' : 'Send reset link'}
              {!submitting && <Sparkles className="h-4 w-4" />}
            </button>
          </form>

          <Link to="/login" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-teal-300 hover:text-teal-200 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </section>
      </main>
    </div>
  );
}
