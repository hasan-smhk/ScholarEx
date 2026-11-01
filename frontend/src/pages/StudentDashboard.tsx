import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  TrendingUp,
  Award,
  BookMarked,
  FileText,
  ArrowRight,
  Play,
  AlertCircle,
  Settings,
  LogOut,
  Users,
  CreditCard,
} from 'lucide-react';
import { getMyBookings, getMyEnrollments } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LearningPromoBanner from '../components/LearningPromoBanner';
import SubjectIcon from '../components/SubjectIcon';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Enrollment {
  id: string;
  progress: number;
  completed: boolean;
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    board: string;
    level: string;
    instructor: string;
  };
}

interface Booking {
  id: string;
  isFreeSession: boolean;
  paymentStatus: string;
  cancellationStatus: string;
  cancelledAt: string | null;
  amount: number;
  meetingLink: string | null;
  marksPercentage?: number | null;
  createdAt: string;
  report?: { createdAt: string; approvalStatus: string } | null;
  slot: {
    date: string;
    startTime: string;
    endTime: string;
    counselor: {
      name: string;
      specialization: string;
    };
  };
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const boardColor: Record<string, { bg: string; text: string; accent: string }> = {
  CBSE: { bg: 'bg-indigo-50', text: 'text-indigo-600', accent: 'border-indigo-500' },
  ICSE: { bg: 'bg-emerald-50', text: 'text-emerald-600', accent: 'border-emerald-500' },
  STATE: { bg: 'bg-amber-50', text: 'text-amber-600', accent: 'border-amber-500' },
};

const progressColor = (p: number) => {
  if (p >= 75) return 'bg-emerald-400';
  if (p >= 40) return 'bg-indigo-400';
  return 'bg-amber-400';
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) => (
  <div className="scholar-metric-card bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4`}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-sm text-gray-500 font-semibold">{label}</p>
    <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({
  icon: Icon,
  title,
  message,
  cta,
}: {
  icon: any;
  title: string;
  message: string;
  cta?: { label: string; href?: string; onClick?: () => void };
}) => (
  <div className="scholar-panel-card bg-white rounded-[24px] border border-gray-100 p-12 text-center">
    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6">{message}</p>
    {cta && (
      <Link
        to={cta.href || '#'}
        onClick={cta.onClick}
        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
      >
        {cta.label}
        <ArrowRight className="w-4 h-4" />
      </Link>
    )}
  </div>
);

// ─── Enrollment Card ──────────────────────────────────────────────────────────
const EnrollmentCard = ({ enrollment }: { enrollment: Enrollment }) => {
  const style = boardColor[enrollment.course.board] || boardColor.CBSE;

  return (
    <div className="scholar-panel-card bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all group">
      {/* Top accent bar */}
      <div className={`h-1 ${style.accent}`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <span className={`text-xs font-black px-3 py-1 rounded-full ${style.bg} ${style.text}`}>
            {enrollment.course.board}
          </span>
          {enrollment.completed && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              Completed
            </span>
          )}
        </div>

        {/* Title */}
        <div className="mb-2 flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.text}`}>
            <SubjectIcon title={enrollment.course.title} className="h-5 w-5" />
          </span>
          <h3 className="text-lg font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
            {enrollment.course.title}
          </h3>
        </div>

        {/* Instructor */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Users className="w-4 h-4" />
          <span>{enrollment.course.instructor}</span>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-gray-600">Progress</p>
            <p className="text-xs font-black text-gray-900">{enrollment.progress}%</p>
          </div>
          <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progressColor(enrollment.progress)}`}
              style={{ width: `${enrollment.progress}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        <Link
          to={`/course/${enrollment.course.id}`}
          className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 text-sm"
        >
          {enrollment.progress === 100 ? 'Review Course' : 'Continue Learning'}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

// ─── Booking Card ─────────────────────────────────────────────────────────────
const BookingCard = ({ booking, onViewReport }: { booking: Booking; onViewReport: (id: string) => void }) => {
  const sessionDate = new Date(booking.slot.date).toISOString().slice(0, 10);
  const sessionStart = new Date(`${sessionDate}T${booking.slot.startTime}:00+05:30`);
  const isPast = sessionStart.getTime() <= Date.now();
  const isCancelled = Boolean(booking.cancelledAt);
  const isConfirmed = (booking.isFreeSession || booking.paymentStatus === 'PAID') && !isCancelled;

  return (
    <div className="scholar-panel-card bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-400 font-medium">Counselor</p>
            <h3 className="text-lg font-black text-gray-900">{booking.slot.counselor.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{booking.slot.counselor.specialization}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isCancelled ? 'bg-slate-100 text-slate-600' :
                isConfirmed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            {isCancelled ? 'Cancelled' : isConfirmed ? 'Confirmed' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-6 space-y-3">
        <div className="flex items-center gap-3 text-gray-600">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-medium">{formatDate(booking.slot.date)}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-medium">
            {booking.slot.startTime} - {booking.slot.endTime}
          </span>
        </div>
        {booking.isFreeSession && (
          <div className="flex items-center gap-3 text-emerald-600">
            <Award className="w-4 h-4" />
            <span className="text-sm font-bold">Free session</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-gray-100 flex gap-3">
        {isCancelled ? (
          <span className="flex-1 bg-slate-50 text-slate-500 font-bold py-3 rounded-2xl text-center">
            Session cancelled
          </span>
        ) : isPast && booking.report ? (
          <button
            onClick={() => onViewReport(booking.id)}
            className="flex-1 bg-indigo-50 text-indigo-600 font-bold py-3 rounded-2xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {booking.report.approvalStatus === 'APPROVED'
              ? 'View Report'
              : booking.report.approvalStatus === 'REJECTED'
                ? 'Track Report Updates'
                : booking.report.approvalStatus === 'COUNSELOR_REVIEW'
                  ? 'Awaiting Counselor Review'
                  : 'Awaiting Admin Review'}
          </button>
        ) : isPast ? (
          <button disabled className="flex-1 bg-gray-50 text-gray-400 font-bold py-3 rounded-2xl">
            Session Complete
          </button>
        ) : isConfirmed && booking.meetingLink ? (
          <a
            href={booking.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-colors text-center"
          >
            Join Session
          </a>
        ) : (
          <span className="flex-1 bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-center">
            {!isConfirmed ? 'Complete payment to join' : 'Meeting link not shared yet'}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'sessions'>('overview');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchAll();
  }, [token]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [enrollRes, bookRes] = await Promise.all([
        getMyEnrollments(token!),
        getMyBookings(token!),
      ]);
      setEnrollments(enrollRes.data);
      setBookings(bookRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─ Computed Stats ──────────────────────────────────────────────────────────
  const completedCourses = enrollments.filter((e) => e.completed).length;
  const avgProgress =
    enrollments.length > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
      : 0;
  const upcomingSessions = bookings.filter((b) => !b.cancelledAt && new Date(b.slot.date) >= new Date()).length;
  const latestMarksPercentage =
    bookings.find((booking) => booking.marksPercentage != null)?.marksPercentage ?? user?.marksPercentage;

  // ─ Loading State ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="scholar-page min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="scholar-page min-h-screen pb-16">
      {/* ═══════════════════════════════════════════════════════════════════
          HERO HEADER
      ═════════════════════════════════════════════════════════════════════ */}
      <div className="scholar-dashboard-hero relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-[24px] bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl font-black text-white shadow-xl">
                {user?.name.substring(0, 2).toUpperCase()}
              </div>

              <div>
                <p className="text-indigo-100 font-medium text-sm">Welcome back 👋</p>
                <h1 className="text-4xl font-black text-white">{user?.name}</h1>
                <p className="text-indigo-200 text-sm mt-1">{user?.email}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <Link
                to="/profile"
                className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-5 py-3 rounded-2xl font-bold transition-all border border-white/20"
              >
                <Settings className="w-5 h-5" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
              <button
                onClick={() => logout()}
                className="flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-white px-5 py-3 rounded-2xl font-bold transition-all border border-red-400/20"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {/* ═════════════════════════════════════════════════════════════════
            STAT CARDS
        ════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={BookMarked}
            label="Enrolled Courses"
            value={enrollments.length}
            sub="total courses"
            color="bg-indigo-100 text-indigo-600"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={completedCourses}
            sub="courses finished"
            color="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Progress"
            value={`${avgProgress}%`}
            sub="overall learning"
            color="bg-amber-100 text-amber-600"
          />
          <StatCard
            icon={Calendar}
            label="Sessions"
            value={upcomingSessions}
            sub="upcoming bookings"
            color="bg-rose-100 text-rose-600"
          />
        </div>

        {latestMarksPercentage != null && latestMarksPercentage >= 85 && (
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
              <div>
                <p className="font-bold text-amber-900">Counseling session recommended</p>
                <p className="text-sm text-amber-800">
                  Your recorded marks are {latestMarksPercentage}%. Students scoring 85% or above should book a counseling session.
                </p>
              </div>
            </div>
            <Link
              to="/counselors"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-700"
            >
              Find a slot
            </Link>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            TAB NAVIGATION
        ════════════════════════════════════════════════════════════════ */}
        <div className="flex gap-2 mb-10 border-b border-gray-200">
          {[
            { key: 'overview', label: 'Overview', icon: <BookOpen className="w-4 h-4" /> },
            { key: 'courses', label: 'My Courses', icon: <BookMarked className="w-4 h-4" /> },
            { key: 'sessions', label: 'Counselling', icon: <Calendar className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            TAB: OVERVIEW
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <>
          <LearningPromoBanner className="py-10" />
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Recent Courses */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900">Continue Learning</h2>
                <Link to="/courses" className="text-indigo-600 font-bold hover:text-indigo-700 text-sm">
                  View all →
                </Link>
              </div>

              {enrollments.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No courses yet"
                  message="Start your learning journey by exploring our curated courses."
                  cta={{ label: 'Explore Courses', href: '/courses' }}
                />
              ) : (
                <div className="grid gap-6">
                  {enrollments.slice(0, 3).map((enrollment) => (
                    <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
                  ))}
                </div>
              )}
            </div>

            {/* Right: Quick Actions */}
            <div className="space-y-6">
              {/* Book Session Card */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[24px] p-6 text-white shadow-lg">
                <Calendar className="w-8 h-8 mb-4 opacity-80" />
                <h3 className="text-xl font-black mb-2">Start with a free career report</h3>
                <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                  Start with your free career report. Book a paid counseling session when you are ready for one-to-one guidance.
                </p>
                <Link
                  to="/counselors"
                  className="block text-center bg-white text-indigo-600 font-bold py-3 rounded-2xl hover:bg-indigo-50 transition-colors"
                >
                  Get your free report
                </Link>
              </div>

              <div className="rounded-[24px] border border-teal-100 bg-teal-50 p-6">
                <div className="mb-3 flex items-center gap-2 text-teal-800">
                  <FileText className="h-5 w-5" />
                  <h3 className="font-black">Your career report</h3>
                </div>
                <p className="mb-4 text-sm leading-relaxed text-teal-900">
                  View and download your free report, then use it to decide whether to book a paid counseling session.
                </p>
                <Link to="/my-career-report" className="font-bold text-teal-800 hover:text-teal-950">
                  Create or view your free report →
                </Link>
              </div>

              <div className="rounded-[24px] border border-indigo-100 bg-indigo-50 p-6">
                <div className="mb-3 flex items-center gap-2 text-indigo-800">
                  <CreditCard className="h-5 w-5" />
                  <h3 className="font-black">Paid counseling sessions</h3>
                </div>
                <p className="mb-4 text-sm leading-relaxed text-indigo-900">
                  Book a counseling slot by choosing a counselor and completing payment.
                </p>
                <Link to="/counselors" className="font-bold text-indigo-800 hover:text-indigo-950">
                  Book counseling slots (payment required) →
                </Link>
              </div>

              {/* Explore Skills */}
              <div className="scholar-panel-card bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-black text-gray-900 mb-2">New Skills</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Coming soon: Coding, Public Speaking, and more!
                </p>
                <Link
                  to="/skills"
                  className="text-amber-600 font-bold text-sm hover:text-amber-700 flex items-center gap-1"
                >
                  Explore →
                </Link>
              </div>

              {/* Recent Reports */}
              <div className="scholar-panel-card bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-900 mb-4">Recent Reports</h3>
                {bookings.filter((b) => b.report && !b.cancelledAt).length === 0 ? (
                  <p className="text-gray-500 text-sm">No reports yet.</p>
                ) : (
                  <div className="space-y-3">
                    {bookings
                      .filter((b) => b.report && !b.cancelledAt)
                      .slice(0, 2)
                      .map((booking) => (
                        <button
                          key={booking.id}
                          onClick={() => navigate(`/booking/${booking.id}/report`)}
                          className="w-full text-left p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors"
                        >
                          <p className="text-sm font-bold text-gray-900">{booking.slot.counselor.name}</p>
                          <p className="text-xs text-gray-500">
                            {booking.report!.approvalStatus === 'APPROVED'
                              ? `Approved ${formatDate(booking.report!.createdAt)}`
                              : booking.report!.approvalStatus === 'REJECTED'
                                ? 'Counselor revisions requested'
                                : booking.report!.approvalStatus === 'COUNSELOR_REVIEW'
                                  ? 'Awaiting counselor approval'
                                  : 'Awaiting administrator approval'}
                          </p>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          </>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            TAB: COURSES
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'courses' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900">
                My Courses <span className="text-gray-400 text-lg">({enrollments.length})</span>
              </h2>
              <Link
                to="/courses"
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Explore More
              </Link>
            </div>

            {enrollments.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No enrollments yet"
                message="Explore our curated courses and start learning today."
                cta={{ label: 'Browse Courses', href: '/courses' }}
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((enrollment) => (
                  <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            TAB: COUNSELLING SESSIONS
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'sessions' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900">
                My Bookings <span className="text-gray-400 text-lg">({bookings.length})</span>
              </h2>
              <Link
                to="/counseling"
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Book Session
              </Link>
            </div>

            {bookings.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No sessions booked"
                message="Create your free career report, then choose a counselor and pay to reserve a session."
                cta={{ label: 'Book a Session', href: '/counselors' }}
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onViewReport={(id) => navigate(`/booking/${id}/report`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
