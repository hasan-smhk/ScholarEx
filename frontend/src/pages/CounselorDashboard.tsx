import { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateReportDraft, uploadReport } from '../services/api';
import { formatSlotDate } from '../utils/slotDate';
import {
  Calendar,
  Clock,
  Users,
  FileText,
  CheckCircle2,
  Loader2,
  Upload,
  ArrowLeft,
  AlertCircle,
  X,
  Save,
  CalendarPlus,
  LayoutDashboard,
  Sparkles,
  UserCircle,
  Award,
  BookOpen,
} from 'lucide-react';
import {
  enrollInCounselorCertification,
  getMyCounselorAppointments,
  getMyCounselorAvailability,
  getMyCounselorProfile,
  updateMyCounselorMeetingLink,
  updateMyCounselorProfile,
} from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Booking {
  id: string;
  isFreeSession: boolean;
  paymentStatus: string;
  amount: number;
  report?: { createdAt: string; approvalStatus: string } | null;
  meetingLink: string | null;
  marksPercentage: number | null;
  educationBackground: string | null;
  currentStream: string | null;
  careerAspiration: string | null;
  areasOfInterest: string | null;
  subjectPreferences: string | null;
  hobbies: string | null;
  subjectAssessments: Array<{ subject: string; overall: string; comments: string }> | null;
  student: {
    id: string;
    name: string;
    email: string;
  };
  slot: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
  };
}

interface CounselorProfile {
  id: string;
  name: string;
  email: string;
  mobileNumber: string | null;
  professionalQualifications: string | null;
  specialization: string;
  description: string | null;
  certificationDetails: string | null;
  certificationStatus: 'NOT_PROVIDED' | 'PENDING_VERIFICATION' | 'VERIFIED';
  certificationVerifiedAt: string | null;
  experience: { yearsExperience: number; details: string | null } | null;
  certificationEnrollment: { status: string; enrolledAt: string } | null;
}

type CounselorProfileDraft = {
  name: string;
  mobileNumber: string;
  professionalQualifications: string;
  specialization: string;
  description: string;
  yearsExperience: string;
  experienceDetails: string;
  certificationDetails: string;
};

interface Slot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

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
}: {
  icon: any;
  title: string;
  message: string;
}) => (
  <div className="scholar-panel-card bg-white rounded-[24px] border border-gray-100 p-12 text-center">
    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500">{message}</p>
  </div>
);

// ─── Report Upload Modal ──────────────────────────────────────────────────────
const ReportModal = ({
  booking,
  onClose,
  onSubmit,
  submitting,
  token,
}: {
  booking: Booking;
  onClose: () => void;
  onSubmit: (data: {
    strengths: string;
    areasOfImprovement: string;
    recommendations: string;
    nextSteps: string;
    isAiGenerated: boolean;
  }) => void;
  submitting: boolean;
  token: string;
}) => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    strengths: '',
    areasOfImprovement: '',
    recommendations: '',
    nextSteps: '',
    isAiGenerated: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const { data } = await generateReportDraft(booking.id, token);
      setForm({ ...data, isAiGenerated: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not generate an AI report draft.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="scholar-panel-card bg-white rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center rounded-t-[32px]">
          <div>
            <h2 className="text-xl font-black text-gray-900">Upload Session Report</h2>
            <p className="text-sm text-gray-500 mt-1">
              {booking.student.name} • {new Date(booking.slot.date).toLocaleDateString('en-IN')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
            <p className="mb-3 text-sm text-violet-900">Generate an AI draft using only relevant academic, subject, and counselling details. Family, contact, and demographic details are excluded; selected details are sent to your configured AI provider. Review before submission.</p>
            <button
              onClick={handleGenerate}
              disabled={generating || submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2 font-bold text-white disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? 'Generating...' : 'Generate AI draft'}
            </button>
            {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Strengths Identified</label>
            <textarea
              name="strengths"
              value={form.strengths}
              onChange={handleChange}
              rows={2}
              placeholder="Key strengths of the student..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Areas for Improvement</label>
            <textarea
              name="areasOfImprovement"
              value={form.areasOfImprovement}
              onChange={handleChange}
              rows={2}
              placeholder="Areas the student should focus on..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Recommendations</label>
            <textarea
              name="recommendations"
              value={form.recommendations}
              onChange={handleChange}
              rows={2}
              placeholder="Next steps and recommendations..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Next Steps</label>
            <textarea
              name="nextSteps"
              value={form.nextSteps}
              onChange={handleChange}
              rows={2}
              placeholder="Agreed next actions..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 flex gap-3 rounded-b-[32px]">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(form)}
            disabled={submitting}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CounselorDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [profile, setProfile] = useState<CounselorProfile | null>(null);
  const [profileDraft, setProfileDraft] = useState<CounselorProfileDraft>({
    name: '',
    mobileNumber: '',
    professionalQualifications: '',
    specialization: '',
    description: '',
    yearsExperience: '0',
    experienceDetails: '',
    certificationDetails: '',
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'availability' | 'reports' | 'profile'>('overview');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [enrollingCertification, setEnrollingCertification] = useState(false);
  const [savingMeetingBookingId, setSavingMeetingBookingId] = useState('');
  const [meetingLinkDrafts, setMeetingLinkDrafts] = useState<Record<string, string>>({});
  const [pageError, setPageError] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setPageError('');
      const [bookingsRes, slotsRes, profileRes] = await Promise.all([
        getMyCounselorAppointments(token!),
        getMyCounselorAvailability(token!),
        getMyCounselorProfile(token!),
      ]);
      setBookings(bookingsRes.data);
      setSlots(slotsRes.data);
      setProfile(profileRes.data);
      setProfileDraft({
        name: profileRes.data.name || '',
        mobileNumber: profileRes.data.mobileNumber || '',
        professionalQualifications: profileRes.data.professionalQualifications || '',
        specialization: profileRes.data.specialization || '',
        description: profileRes.data.description || '',
        yearsExperience: String(profileRes.data.experience?.yearsExperience ?? 0),
        experienceDetails: profileRes.data.experience?.details || '',
        certificationDetails: profileRes.data.certificationDetails || '',
      });
      setMeetingLinkDrafts(Object.fromEntries(
        bookingsRes.data.map((booking: Booking) => [booking.id, booking.meetingLink || ''])
      ));
    } catch (err) {
      console.error('Error fetching counselor data:', err);
      setPageError('Could not load counselor profile and assigned appointments. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'COUNSELOR') {
      navigate('/dashboard');
      return;
    }
    fetchAll();
  }, [fetchAll, navigate, token, user?.role]);

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      setSavingProfile(true);
      const { data } = await updateMyCounselorProfile(token, {
        ...profileDraft,
        yearsExperience: Number(profileDraft.yearsExperience),
      });
      setProfile(data);
      alert('Profile updated successfully.');
      await fetchAll();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to update your profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCertificationEnrollment = async () => {
    if (!token) return;
    try {
      setEnrollingCertification(true);
      await enrollInCounselorCertification(token);
      await fetchAll();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Could not enrol in the certification programme.');
    } finally {
      setEnrollingCertification(false);
    }
  };

  const handleSaveMeetingLink = async (bookingId: string) => {
    if (!token) return;
    try {
      setSavingMeetingBookingId(bookingId);
      const { data } = await updateMyCounselorMeetingLink(
        bookingId,
        meetingLinkDrafts[bookingId] || '',
        token
      );
      setBookings((current) => current.map((booking) =>
        booking.id === bookingId ? { ...booking, meetingLink: data.meetingLink } : booking
      ));
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to update the meeting link.');
    } finally {
      setSavingMeetingBookingId('');
    }
  };
  const handleReportSubmit = async (data: any) => {
    if (!selectedBooking || !token) return;
    try {
      setSubmittingReport(true);
      await uploadReport(selectedBooking.id, data, token);
      setSelectedBooking(null);
      fetchAll(); // refresh to show report as uploaded
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to upload report');
    } finally {
      setSubmittingReport(false);
    }
  };

  // ── Computed Stats ──────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const todaysSessions = bookings.filter((b) => b.slot.date === today);
  const upcomingSessions = bookings.filter(
    (b) => new Date(b.slot.date) >= new Date() && b.paymentStatus === 'PAID'
  );
  const pendingReports = bookings.filter(
    (b) => new Date(b.slot.date) < new Date() && !b.report
  );
  const completedSessions = bookings.filter((b) => b.report);

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
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[24px] bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl font-black text-white shadow-xl">
                {(profile?.name || user?.name || 'CO').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-indigo-100 font-medium text-sm flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Counselor Dashboard
                </p>
                <h1 className="text-4xl font-black text-white">{profile?.name || user?.name}</h1>
                <p className="text-indigo-200 text-sm mt-1">
                  {profile?.specialization || user?.specialization || 'Academic & Career Counselor'}
                </p>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-white px-5 py-3 rounded-2xl font-bold transition-all border border-red-400/20"
            >
              <X className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {pageError && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {pageError}
          </div>
        )}
        {/* ═════════════════════════════════════════════════════════════════
            STAT CARDS
        ════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Calendar}
            label="Today's Sessions"
            value={todaysSessions.length}
            sub="scheduled today"
            color="bg-indigo-100 text-indigo-600"
          />
          <StatCard
            icon={Users}
            label="Upcoming"
            value={upcomingSessions.length}
            sub="confirmed bookings"
            color="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            icon={AlertCircle}
            label="Pending Reports"
            value={pendingReports.length}
            sub="need upload"
            color="bg-amber-100 text-amber-600"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={completedSessions.length}
            sub="reports submitted"
            color="bg-violet-100 text-violet-600"
          />
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            TAB NAVIGATION
        ════════════════════════════════════════════════════════════════ */}
        <div className="flex gap-2 mb-10 border-b border-gray-200 overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { key: 'sessions', label: 'Sessions', icon: <Calendar className="w-4 h-4" /> },
            { key: 'availability', label: 'Availability', icon: <CalendarPlus className="w-4 h-4" /> },
            { key: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
            { key: 'profile', label: 'My profile', icon: <UserCircle className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 -mb-px whitespace-nowrap ${
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
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Today's Schedule */}
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">Today's Schedule</h2>
              {todaysSessions.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No sessions today"
                  message="Enjoy your free day or add availability for students."
                />
              ) : (
                <div className="space-y-4">
                  {todaysSessions.map((b) => (
                    <div key={b.id} className="scholar-panel-card bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-gray-900 text-lg">{b.student.name}</p>
                          <p className="text-sm text-gray-500">{b.student.email}</p>
                        </div>
                        <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                          {b.slot.startTime}
                        </span>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {b.slot.startTime} - {b.slot.endTime}
                        </span>
                        {b.isFreeSession && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            Free
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Reports */}
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">Pending Reports</h2>
              {pendingReports.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="All caught up!"
                  message="No pending reports to upload."
                />
              ) : (
                <div className="space-y-4">
                  {pendingReports.map((b) => (
                    <div key={b.id} className="scholar-panel-card bg-white rounded-[24px] border border-amber-100 p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-black text-gray-900">{b.student.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(b.slot.date).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                          Due
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Report
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            TAB: SESSIONS
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'sessions' && (
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-6">All Sessions</h2>
            {bookings.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No sessions yet"
                message="Sessions will appear here once students book with you."
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings
                  .slice()
                  .sort((a, b) => new Date(b.slot.date).getTime() - new Date(a.slot.date).getTime())
                  .map((b) => {
                    const isPast = new Date(b.slot.date) < new Date();
                    return (
                      <div key={b.id} className="scholar-panel-card bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center font-black text-indigo-600">
                            {b.student.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full ${
                              b.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-amber-50 text-amber-600'
                            }`}
                          >
                            {b.paymentStatus === 'PAID' ? 'Confirmed' : 'Pending'}
                          </span>
                        </div>
                        <p className="font-black text-gray-900">{b.student.name}</p>
                        <div className="mt-3 space-y-2 text-sm text-gray-500">
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            {new Date(b.slot.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            {b.slot.startTime} - {b.slot.endTime}
                          </p>
                        </div>
                        <details className="mt-4 rounded-xl bg-slate-50 p-4">
                          <summary className="cursor-pointer text-sm font-bold text-slate-700">View counselling form</summary>
                          <dl className="mt-3 space-y-2 text-sm text-slate-600">
                            <div><dt className="font-semibold">Student</dt><dd>{b.student.name} · {b.student.email}</dd></div>
                            {b.educationBackground && <div><dt className="font-semibold">Education</dt><dd>{b.educationBackground}</dd></div>}
                            {b.currentStream && <div><dt className="font-semibold">Current stream</dt><dd>{b.currentStream}</dd></div>}
                            {b.marksPercentage !== null && <div><dt className="font-semibold">Marks</dt><dd>{b.marksPercentage}%</dd></div>}
                            {b.careerAspiration && <div><dt className="font-semibold">Career aspiration</dt><dd>{b.careerAspiration}</dd></div>}
                            {b.areasOfInterest && <div><dt className="font-semibold">Interests</dt><dd>{b.areasOfInterest}</dd></div>}
                            {b.subjectPreferences && <div><dt className="font-semibold">Subject preferences</dt><dd>{b.subjectPreferences}</dd></div>}
                            {b.hobbies && <div><dt className="font-semibold">Hobbies</dt><dd>{b.hobbies}</dd></div>}
                            {b.subjectAssessments?.map((assessment, index) => (
                              <div key={`${assessment.subject}-${index}`}>
                                <dt className="font-semibold">{assessment.subject} assessment · {assessment.overall}</dt>
                                <dd>{assessment.comments}</dd>
                              </div>
                            ))}
                          </dl>
                        </details>
                        <div className="mt-4 space-y-2">
                          <label htmlFor={`meeting-link-${b.id}`} className="block text-sm font-semibold text-slate-700">Secure meeting link</label>
                          <input
                            id={`meeting-link-${b.id}`}
                            type="url"
                            value={meetingLinkDrafts[b.id] || ''}
                            onChange={(event) => setMeetingLinkDrafts((current) => ({ ...current, [b.id]: event.target.value }))}
                            placeholder="https://meeting-provider.example/..."
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                          />
                          <button
                            onClick={() => handleSaveMeetingLink(b.id)}
                            disabled={savingMeetingBookingId === b.id || (meetingLinkDrafts[b.id] || '') === (b.meetingLink || '')}
                            className="rounded-xl border border-indigo-200 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                          >
                            {savingMeetingBookingId === b.id ? 'Saving...' : b.meetingLink ? 'Update meeting link' : 'Save meeting link'}
                          </button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          {isPast && !b.report ? (
                            <button
                              onClick={() => setSelectedBooking(b)}
                              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
                            >
                              <Upload className="w-4 h-4" />
                              Upload Report
                            </button>
                          ) : b.report ? (
                            <span className="flex items-center justify-center gap-2 text-emerald-600 font-bold py-3">
                              <CheckCircle2 className="w-4 h-4" />
                              {b.report.approvalStatus === 'APPROVED'
                                ? 'Report Approved'
                                : b.report.approvalStatus === 'REJECTED'
                                  ? 'Changes Requested'
                                  : 'Awaiting Admin Review'}
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2 text-gray-400 font-bold py-3">
                              <Clock className="w-4 h-4" />
                              Upcoming
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            TAB: AVAILABILITY
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'availability' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900">My Availability</h2>
              <p className="text-sm text-gray-500">Weekday slots are generated automatically.</p>
            </div>

            {slots.length === 0 ? (
              <EmptyState
                icon={CalendarPlus}
                title="No upcoming slots"
                message="Available weekday sessions are generated automatically by the current scheduling policy."
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`rounded-[20px] border p-5 ${
                      slot.isBooked ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100 shadow-sm'
                    }`}
                  >
                    <p className="font-bold text-gray-900">
                      {formatSlotDate(slot.date, 'en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {slot.startTime} - {slot.endTime}
                    </p>
                    <span
                      className={`inline-block mt-3 text-xs font-bold px-3 py-1 rounded-full ${
                        slot.isBooked
                          ? 'bg-rose-50 text-rose-500'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {slot.isBooked ? 'Booked' : 'Available'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && profile && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
            <form onSubmit={handleSaveProfile} className="scholar-panel-card space-y-5 rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-2xl font-black text-gray-900">My professional profile</h2>
                <p className="mt-1 text-sm text-gray-500">Update your contact and professional information. Your sign-in email cannot be changed here.</p>
              </div>
              <label className="block text-sm font-semibold text-gray-700">
                Full name
                <input required maxLength={120} value={profileDraft.name} onChange={(event) => setProfileDraft((current) => ({ ...current, name: event.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3" />
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Email address
                <input readOnly value={profile.email} className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-500" />
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Mobile number
                <input required type="tel" value={profileDraft.mobileNumber} onChange={(event) => setProfileDraft((current) => ({ ...current, mobileNumber: event.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3" />
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Counselling specialization
                <input required maxLength={120} value={profileDraft.specialization} onChange={(event) => setProfileDraft((current) => ({ ...current, specialization: event.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3" />
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Professional qualifications
                <textarea required maxLength={2000} rows={3} value={profileDraft.professionalQualifications} onChange={(event) => setProfileDraft((current) => ({ ...current, professionalQualifications: event.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3" />
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Public profile description
                <textarea maxLength={2000} rows={3} value={profileDraft.description} onChange={(event) => setProfileDraft((current) => ({ ...current, description: event.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3" />
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Years of professional experience
                <input required type="number" min={0} max={80} step={1} value={profileDraft.yearsExperience} onChange={(event) => setProfileDraft((current) => ({ ...current, yearsExperience: event.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3" />
              </label>
              {Number(profileDraft.yearsExperience) > 1 && (
                <label className="block text-sm font-semibold text-gray-700">
                  Professional experience details
                  <textarea required minLength={2} rows={3} value={profileDraft.experienceDetails} onChange={(event) => setProfileDraft((current) => ({ ...current, experienceDetails: event.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3" />
                </label>
              )}
              <label className="block text-sm font-semibold text-gray-700">
                Certification details
                <textarea maxLength={2000} rows={3} value={profileDraft.certificationDetails} onChange={(event) => setProfileDraft((current) => ({ ...current, certificationDetails: event.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3" />
              </label>
              <button type="submit" disabled={savingProfile} className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                {savingProfile ? 'Saving profile...' : 'Save profile'}
              </button>
            </form>

            <aside className="space-y-5">
              <section className="scholar-panel-card rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 text-indigo-600" />
                  <h3 className="text-lg font-black text-gray-900">Certification status</h3>
                </div>
                <p className="mt-4 font-semibold text-gray-800">
                  {profile.certificationStatus === 'VERIFIED'
                    ? 'Verified'
                    : profile.certificationStatus === 'PENDING_VERIFICATION'
                      ? 'Pending admin verification'
                      : 'No certification submitted'}
                </p>
                {profile.certificationVerifiedAt && <p className="mt-1 text-sm text-gray-500">Verified {new Date(profile.certificationVerifiedAt).toLocaleDateString()}</p>}
                <p className="mt-3 text-sm leading-6 text-gray-500">Self-reported certification details are not marked verified. An administrator must complete the verification process.</p>
              </section>
              <section className="scholar-panel-card rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-black text-gray-900">ScholarEx counsellor certification programme</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">A separate professional development programme. Enrolment and completion are tracked independently from student course enrolments and professional certificate verification.</p>
                {profile.certificationEnrollment ? (
                  <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
                    Status: {profile.certificationEnrollment.status.replace('_', ' ')}
                  </p>
                ) : (
                  <button onClick={handleCertificationEnrollment} disabled={enrollingCertification} className="mt-4 w-full rounded-xl bg-teal-600 px-4 py-3 font-bold text-white hover:bg-teal-700 disabled:opacity-50">
                    {enrollingCertification ? 'Enrolling...' : 'Enrol in certification programme'}
                  </button>
                )}
              </section>
              <section className="scholar-panel-card rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-indigo-600" />
                  <h3 className="text-lg font-black text-gray-900">Course catalogue</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">The existing ScholarEx course catalogue is for student learning. Browse it separately; counsellor certification enrolment remains in the professional programme above.</p>
                <Link to="/courses" className="mt-4 inline-flex rounded-xl border border-indigo-200 px-4 py-2 font-bold text-indigo-700 hover:bg-indigo-50">Browse courses</Link>
              </section>
            </aside>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            TAB: REPORTS
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'reports' && (
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-6">Submitted Reports</h2>
            {completedSessions.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No reports yet"
                message="Reports you submit will be listed here for reference."
              />
            ) : (
              <div className="space-y-4">
                {completedSessions.map((b) => (
                  <div key={b.id} className="scholar-panel-card bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900">{b.student.name}</p>
                        <p className="text-sm text-gray-500">
                          Report submitted {new Date(b.report!.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/booking/${b.id}/report`)}
                      className="text-indigo-600 font-bold hover:text-indigo-700 text-sm flex items-center gap-1"
                    >
                      View <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Report Upload Modal */}
      {selectedBooking && (
        <ReportModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onSubmit={handleReportSubmit}
          submitting={submittingReport}
          token={token!}
        />
      )}
    </div>
  );
}
