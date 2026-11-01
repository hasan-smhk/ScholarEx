import { useState } from 'react';
import { Navigate, useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, BookOpen, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandMark from '../components/BrandMark';

export default function LoginPage() {
  const location = useLocation();
  const registrationState = location.state as {
    fromRegister?: boolean;
    email?: string;
    applicationEmailSent?: boolean;
    confirmationEmailSent?: boolean;
  } | null;
  const [email, setEmail] = useState(registrationState?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { loginUser, adminLoginUser, user } = useAuth();
  const navigate = useNavigate();
  const isAdminLogin = location.pathname === '/admin/login';
  const isCounselorLogin = location.pathname === '/counselor/login';
  const isStudentLogin = location.pathname === '/student/login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isAdminLogin) {
        await adminLoginUser(email, password);
        navigate('/admin', { replace: true });
      } else {
        const expectedRole = isCounselorLogin
          ? 'COUNSELOR'
          : isStudentLogin
            ? 'STUDENT'
            : undefined;
        const signedInUser = await loginUser(email, password, expectedRole);
        navigate(signedInUser.role === 'COUNSELOR' ? '/counselor-dashboard' : '/', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    const destination = user.role === 'ADMIN'
      ? '/admin'
      : user.role === 'COUNSELOR'
        ? '/counselor-dashboard'
        : '/';
    return <Navigate to={destination} replace />;
  }

  return (
    <div className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden bg-[#071b24] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(94, 234, 212, 0.18) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl motion-safe:animate-pulse motion-reduce:animate-none" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-cyan-600/15 blur-3xl motion-safe:animate-pulse motion-reduce:animate-none" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300">
            <BrandMark className="h-11 w-14 rounded-xl bg-white object-contain p-0.5 shadow-lg shadow-teal-950/40" />
            <span className="text-xl font-black tracking-tight sm:text-2xl">
              Scholar<span className="text-teal-300">Ex</span>
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-teal-300/40 hover:text-teal-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Back to home</span>
            <span className="sm:hidden">Home</span>
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-12">
          <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
            <section className="hidden max-w-xl lg:block">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100">
                <Sparkles aria-hidden="true" className="h-4 w-4" />
                Learning built around you
              </div>
              <h1 className="text-5xl font-black leading-tight tracking-tight xl:text-6xl">
                Welcome back.
                <br />
                Keep building your <span className="text-teal-300">future.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
                Sign in to continue exploring board courses, learning modules, and personalised guidance.
              </p>
              <div className="mt-10 flex flex-wrap gap-3 text-sm font-medium text-slate-200">
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <GraduationCap aria-hidden="true" className="h-5 w-5 text-teal-300" />
                  Board-aligned learning
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <ShieldCheck aria-hidden="true" className="h-5 w-5 text-teal-300" />
                  Your learning, securely
                </span>
              </div>
            </section>

            <section className="w-full rounded-3xl border border-white/10 bg-[#0d2933]/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl motion-safe:animate-[login-enter_.65s_ease-out_both] motion-reduce:animate-none sm:p-9">
              <div className="mb-8 text-center lg:text-left">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-300 lg:hidden">
                  <BookOpen aria-hidden="true" className="h-6 w-6" />
                </div>
                <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-teal-300">
                  {isAdminLogin ? 'Administrator' : isCounselorLogin ? 'Counselor' : isStudentLogin ? 'Student' : 'ScholarEx'}
                </p>
                <h2 className="text-3xl font-black tracking-tight text-white">
                  {isAdminLogin ? 'Admin sign in' : isCounselorLogin ? 'Counselor sign in' : isStudentLogin ? 'Student sign in' : 'Welcome back'}
                </h2>
                <p className="mt-2 text-slate-300">
                  {isAdminLogin
                    ? 'Sign in to manage the learning portal.'
                    : isCounselorLogin
                      ? 'Sign in to manage your appointments and student reports.'
                      : isStudentLogin
                        ? 'Sign in to continue your courses and counselling journey.'
                        : 'Sign in to continue your learning journey.'}
                </p>
              </div>

              {registrationState?.fromRegister && (
                <p className="mb-5 rounded-xl border border-teal-300/20 bg-teal-300/10 p-4 text-sm text-teal-100">
                  {isCounselorLogin
                    ? registrationState.applicationEmailSent === false
                      ? 'Your counselor application is submitted, but the confirmation email could not be sent. An administrator will review your application.'
                      : 'Your application is submitted for administrator review. You can sign in to the counselor portal after approval.'
                    : registrationState.confirmationEmailSent === false
                      ? 'Your account is ready and you can sign in now. We could not send the confirmation email; please check your email settings or contact support.'
                      : 'Your account is ready. A confirmation email was sent, and you can sign in now.'}
                </p>
              )}

              {error && (
                <div role="alert" className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-slate-200">
                    Email address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#071b24]/80 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition duration-200 focus:border-teal-300/70 focus:ring-4 focus:ring-teal-300/10"
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-slate-200">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#071b24]/80 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition duration-200 focus:border-teal-300/70 focus:ring-4 focus:ring-teal-300/10"
                  />
                </div>

                {!isAdminLogin && (
                  <div className="-mt-2 text-right">
                    <Link
                      to="/reset-password"
                      state={{ email }}
                      className="text-sm font-semibold text-teal-300 transition-colors hover:text-teal-200 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative w-full overflow-hidden rounded-xl bg-teal-500 px-4 py-3.5 font-bold text-[#06232b] shadow-lg shadow-teal-950/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-300 hover:shadow-teal-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-200 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none"
                >
                  {submitting
                    ? 'Signing in...'
                    : isAdminLogin
                      ? 'Admin sign in'
                      : isCounselorLogin
                        ? 'Counselor sign in'
                        : isStudentLogin
                          ? 'Student sign in'
                          : 'Sign in'}
                </button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-xs font-medium uppercase tracking-widest text-slate-500">or</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              {isAdminLogin ? (
                <p className="text-center text-sm text-slate-300">
                  Student?{' '}
                  <Link to="/student/login" className="font-semibold text-teal-300 transition-colors hover:text-teal-200 hover:underline">
                    Student sign in
                  </Link>
                  {' · '}
                  Counselor?{' '}
                  <Link to="/counselor/login" className="font-semibold text-teal-300 transition-colors hover:text-teal-200 hover:underline">
                    Counselor sign in
                  </Link>
                </p>
              ) : (
                <>
                  <p className="text-center text-sm text-slate-300">
                    New here?{' '}
                    <Link to="/register" state={{ role: isCounselorLogin ? 'COUNSELOR' : 'STUDENT' }} className="font-semibold text-teal-300 transition-colors hover:text-teal-200 hover:underline">
                      Create an account
                    </Link>
                  </p>
                  {!isCounselorLogin && (
                    <p className="mt-4 text-center text-sm text-slate-400">
                      Counselor?{' '}
                      <Link to="/counselor/login" className="font-semibold text-teal-300 transition-colors hover:text-teal-200 hover:underline">
                        Counselor sign in
                      </Link>
                    </p>
                  )}
                  {!isStudentLogin && (
                    <p className="mt-4 text-center text-sm text-slate-400">
                      Student?{' '}
                      <Link to="/student/login" className="font-semibold text-teal-300 transition-colors hover:text-teal-200 hover:underline">
                        Student sign in
                      </Link>
                    </p>
                  )}
                  <p className="mt-4 text-center text-sm text-slate-400">
                    Administrator?{' '}
                    <Link to="/admin/login" className="font-semibold text-teal-300 transition-colors hover:text-teal-200 hover:underline">
                      Admin sign in
                    </Link>
                  </p>
                </>
              )}
            </section>
          </div>
        </main>

        <footer className="py-2 text-center text-xs text-slate-500">
          © 2026 JZD ScholarEx Education
        </footer>
      </div>
    </div>
  );
}
