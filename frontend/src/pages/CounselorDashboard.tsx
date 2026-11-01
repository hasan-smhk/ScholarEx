import { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandMark from '../components/BrandMark';
import CounselorChecklistModal from '../components/CounselorChecklistModal';
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
  Video,
} from 'lucide-react';
import {
  enrollInCounselorCertification,
  getMyCounselorAppointments,
  getMyCounselorAvailability,
  getMyCounselorProfile,
  updateMyCounselorMeetingLink,
  updateMyCounselorAvailability,
  updateMyCounselorProfile,
} from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Booking {
  id: string;
  isFreeSession: boolean;
  paymentStatus: string;
  cancellationStatus: string;
  cancelledAt: string | null;
  amount: number;
  report?: { createdAt: string; approvalStatus: string } | null;
  meetingLink: string | null;
  meetingLinkEmailSentAt: string | null;
  sessionChecklistAnswers: Record<string, string> | null;
  sessionChecklistCompletedAt: string | null;
  marksPercentage: number | null;
  educationBackground: string | null;
  currentStream: string | null;
  careerAspiration: string | null;
  areasOfInterest: string | null;
  subjectPreferences: string | null;
  hobbies: string | null;
  subjectAssessments: Array<{ subject: string; overall: string; comments: string }> | null;
  studentName: string | null;
  studentAge: number | null;
  schoolCollege: string | null;
  fatherName: string | null;
  fatherAge: number | null;
  fatherOcuupation: string | null;
  fatherEducation: string | null;
  motherName: string | null;
  motherAge: number | null;
  motherOcuupation: string | null;
  motherEducation: string | null;
  AnnualfamilyIncome: number | null;
  familyType: string | null;
  address: string | null;
  phoneNo: string | null;
  emailId: string | null;
  student: {
    id: string;
    name: string;
    email: string;
    careerAssessment: {
      studentClass: string;
      schoolCollege: string;
      phoneNumber: string;
      educationBoard: string;
      academicPerformance: string;
      strongSubjects: string;
      dislikedSubjects: string;
      hobbies: string;
      strengths: string;
      improvementAreas: string;
      coursesOfInterest: string;
      learningStyle: string;
      likes: string;
      dislikes: string;
      careerGoal: string;
      parentsAspiration: string;
    } | null;
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
  isAvailable: boolean;
  isBooked: boolean;
}

const COUNSELING_TIME_OPTIONS = [
  { startTime: '17:00', endTime: '18:00', label: '5:00 PM – 6:00 PM' },
  { startTime: '18:00', endTime: '19:00', label: '6:00 PM – 7:00 PM' },
  { startTime: '19:00', endTime: '20:00', label: '7:00 PM – 8:00 PM' },
];

function hasSessionEnded(booking: Booking): boolean {
  const date = booking.slot.date.slice(0, 10);
  const sessionEnd = new Date(`${date}T${booking.slot.endTime}:00+05:30`);
  return sessionEnd.getTime() < Date.now();
}

function hasSessionStarted(booking: Booking): boolean {
  const date = booking.slot.date.slice(0, 10);
  const sessionStart = new Date(`${date}T${booking.slot.startTime}:00+05:30`);
  return sessionStart.getTime() <= Date.now();
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

// ─── Report Preparation Modal ────────────────────────────────────────────────
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
            <h2 className="text-xl font-black text-gray-900">Prepare Student Report</h2>
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
            <p className="mb-3 text-sm text-violet-900">Selected academic and career responses are sent to your configured AI provider. Family, relationship, and emotional-wellbeing answers remain in ScholarEx and are excluded from AI generation. Review and edit the draft before counselor approval, administrator review, and delivery to the student.</p>
            <button
              onClick={handleGenerate}
              disabled={generating || submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2 font-bold text-white disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? 'Generating...' : 'Generate AI report draft'}
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
                Submit for Admin Approval
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
  const [availabilityDate, setAvailabilityDate] = useState('');
  const [selectedAvailabilityTimes, setSelectedAvailabilityTimes] = useState<string[]>([]);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
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
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'students' | 'meetings' | 'availability' | 'reports' | 'profile'>('overview');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedChecklistBooking, setSelectedChecklistBooking] = useState<Booking | null>(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [enrollingCertification, setEnrollingCertification] = useState(false);
  const [savingMeetingBookingId, setSavingMeetingBookingId] = useState('');
  const [meetingLinkDrafts, setMeetingLinkDrafts] = useState<Record<string, string>>({});
  const [pageError, setPageError] = useState('');

  const localToday = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);

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

  const handleAvailabilityDateChange = (date: string) => {
    setAvailabilityDate(date);
    setAvailabilityError('');
    setSelectedAvailabilityTimes(
      slots
        .filter((slot) =>
          new Date(slot.date).toISOString().slice(0, 10) === date &&
          slot.isAvailable &&
          !slot.isBooked
        )
        .map((slot) => slot.startTime)
    );
  };

  const handleSaveAvailability = async () => {
    if (!token || !availabilityDate) {
      setAvailabilityError('Choose a date before saving availability.');
      return;
    }
    const weekday = new Date(`${availabilityDate}T00:00:00`).getDay();
    if (weekday === 0 || weekday === 6) {
      setAvailabilityError('Availability can only be set for weekdays.');
      return;
    }

    try {
      setSavingAvailability(true);
      setAvailabilityError('');
      const { data } = await updateMyCounselorAvailability(
        token,
        availabilityDate,
        selectedAvailabilityTimes
      );
      setSlots(data);
      setSelectedAvailabilityTimes(
        data
          .filter((slot: Slot) =>
            new Date(slot.date).toISOString().slice(0, 10) === availabilityDate &&
            slot.isAvailable &&
            !slot.isBooked
          )
          .map((slot: Slot) => slot.startTime)
      );
    } catch (err: any) {
      setAvailabilityError(err?.response?.data?.error || 'Failed to update availability.');
    } finally {
      setSavingAvailability(false);
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
        booking.id === bookingId
          ? {
              ...booking,
              meetingLink: data.meetingLink,
              meetingLinkEmailSentAt: data.meetingLinkEmailSent ? new Date().toISOString() : null,
            }
          : booking
      ));
      if (data.meetingLinkEmailDeferred) {
        alert('The meeting link was saved. It will be emailed after the paid booking is confirmed.');
      } else if (data.meetingLink && !data.meetingLinkEmailSent) {
        alert('The meeting link was saved, but its email could not be sent. Retry after fixing email delivery.');
      } else if (data.meetingLinkEmailSent) {
        alert('The meeting link was saved and emailed to the student.');
      }
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

  const handleChecklistSaved = (bookingId: string, answers: Record<string, string>, completedAt: string) => {
    setBookings((current) => current.map((booking) =>
      booking.id === bookingId
        ? {
            ...booking,
            sessionChecklistAnswers: answers,
            sessionChecklistCompletedAt: completedAt,
          }
        : booking
    ));
    setSelectedChecklistBooking(null);
  };

  // ── Computed Stats ──────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const todaysSessions = bookings.filter((b) => b.slot.date === today);
  const upcomingSessions = bookings.filter(
    (b) => !b.cancelledAt && new Date(b.slot.date) >= new Date() && b.paymentStatus === 'PAID'
  );
  const pendingReports = bookings.filter(
    (b) =>
      !b.cancelledAt &&
      b.sessionChecklistCompletedAt &&
      !b.report &&
      (b.isFreeSession || b.paymentStatus === 'PAID')
  );
  const completedSessions = bookings.filter((b) => b.report);
  const eligibleMeetingBookings = bookings.filter(
    (booking) => !booking.cancelledAt
  );

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
          <Link to="/" className="mb-8 inline-flex items-center gap-2.5 text-xl font-black tracking-tight text-white">
            <BrandMark className="h-10 w-12 rounded-lg bg-white object-contain p-0.5 shadow-sm" />
            Scholar<span className="text-teal-200">Ex</span>
          </Link>
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
            { key: 'students', label: 'Student details', icon: <Users className="w-4 h-4" /> },
            { key: 'meetings', label: 'Session links', icon: <Video className="w-4 h-4" /> },
            { key: 'availability', label: 'Availability', icon: <CalendarPlus className="w-4 h-4" /> },
            { key: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
            { key: 'profile', label: 'My profile', icon: <UserCircle className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
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
                        Prepare AI Report
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
                    const isPast = hasSessionEnded(b);
                    return (
                      <div key={b.id} className="scholar-panel-card bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center font-black text-indigo-600">
                            {b.student.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full ${
                              b.cancelledAt
                                ? 'bg-slate-100 text-slate-600'
                                : b.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-amber-50 text-amber-600'
                            }`}
                          >
                            {b.cancelledAt ? 'Cancelled' : b.paymentStatus === 'PAID' ? 'Confirmed' : 'Pending'}
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
                            <div><dt className="font-semibold">Student</dt><dd>{b.studentName || b.student.name}{b.studentAge !== null ? ` · Age ${b.studentAge}` : ''}</dd></div>
                            <div><dt className="font-semibold">Contact email</dt><dd>{b.emailId || b.student.email}</dd></div>
                            {b.phoneNo && <div><dt className="font-semibold">Phone</dt><dd>{b.phoneNo}</dd></div>}
                            {b.address && <div><dt className="font-semibold">Address</dt><dd>{b.address}</dd></div>}
                            {b.schoolCollege && <div><dt className="font-semibold">School / college</dt><dd>{b.schoolCollege}</dd></div>}
                            {b.educationBackground && <div><dt className="font-semibold">Education</dt><dd>{b.educationBackground}</dd></div>}
                            {b.currentStream && <div><dt className="font-semibold">Current stream</dt><dd>{b.currentStream}</dd></div>}
                            {b.marksPercentage !== null && <div><dt className="font-semibold">Marks</dt><dd>{b.marksPercentage}%</dd></div>}
                            {b.careerAspiration && <div><dt className="font-semibold">Career aspiration</dt><dd>{b.careerAspiration}</dd></div>}
                            {b.areasOfInterest && <div><dt className="font-semibold">Interests</dt><dd>{b.areasOfInterest}</dd></div>}
                            {b.subjectPreferences && <div><dt className="font-semibold">Subject preferences</dt><dd>{b.subjectPreferences}</dd></div>}
                            {b.hobbies && <div><dt className="font-semibold">Hobbies</dt><dd>{b.hobbies}</dd></div>}
                            {b.familyType && <div><dt className="font-semibold">Family type</dt><dd>{b.familyType}</dd></div>}
                            {b.AnnualfamilyIncome !== null && <div><dt className="font-semibold">Annual family income</dt><dd>{b.AnnualfamilyIncome}</dd></div>}
                            {b.fatherName && <div><dt className="font-semibold">Father's name</dt><dd>{b.fatherName}</dd></div>}
                            {b.fatherAge !== null && <div><dt className="font-semibold">Father's age</dt><dd>{b.fatherAge}</dd></div>}
                            {b.fatherOcuupation && <div><dt className="font-semibold">Father's occupation</dt><dd>{b.fatherOcuupation}</dd></div>}
                            {b.fatherEducation && <div><dt className="font-semibold">Father's education</dt><dd>{b.fatherEducation}</dd></div>}
                            {b.motherName && <div><dt className="font-semibold">Mother's name</dt><dd>{b.motherName}</dd></div>}
                            {b.motherAge !== null && <div><dt className="font-semibold">Mother's age</dt><dd>{b.motherAge}</dd></div>}
                            {b.motherOcuupation && <div><dt className="font-semibold">Mother's occupation</dt><dd>{b.motherOcuupation}</dd></div>}
                            {b.motherEducation && <div><dt className="font-semibold">Mother's education</dt><dd>{b.motherEducation}</dd></div>}
                            {b.subjectAssessments?.map((assessment, index) => (
                              <div key={`${assessment.subject}-${index}`}>
                                <dt className="font-semibold">{assessment.subject} assessment · {assessment.overall}</dt>
                                <dd>{assessment.comments}</dd>
                              </div>
                            ))}
                          </dl>
                        </details>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          {b.cancelledAt ? (
                            <span className="flex items-center justify-center text-slate-500 font-semibold py-3">This appointment was cancelled</span>
                          ) : b.meetingLink && b.meetingLinkEmailSentAt ? (
                            <a
                              href={b.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="mb-3 block w-full rounded-xl border border-indigo-200 bg-indigo-50 py-3 text-center font-bold text-indigo-700 hover:bg-indigo-100"
                            >
                              Open session
                            </a>
                          ) : null}
                          {!b.cancelledAt && b.sessionChecklistCompletedAt && !b.report ? (
                            <button
                              onClick={() => setSelectedBooking(b)}
                              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
                            >
                              <Sparkles className="w-4 h-4" />
                              Prepare AI Report
                            </button>
                          ) : !b.cancelledAt && b.report ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/booking/${b.id}/report`)}
                              className="flex w-full items-center justify-center gap-2 py-3 font-bold text-emerald-700 hover:text-emerald-800"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              {b.report.approvalStatus === 'APPROVED'
                                ? 'Report approved'
                                : b.report.approvalStatus === 'REJECTED'
                                  ? 'Changes requested'
                                  : b.report.approvalStatus === 'COUNSELOR_REVIEW'
                                    ? 'Review and approve report'
                                    : 'Awaiting admin review'}
                            </button>
                          ) : !b.cancelledAt && !b.sessionChecklistCompletedAt &&
                            hasSessionStarted(b) &&
                            (b.isFreeSession || b.paymentStatus === 'PAID') &&
                            b.meetingLink &&
                            b.meetingLinkEmailSentAt ? (
                            <button
                              type="button"
                              onClick={() => setSelectedChecklistBooking(b)}
                              className="w-full rounded-2xl bg-teal-700 py-3 font-bold text-white transition-colors hover:bg-teal-800"
                            >
                              Open counselor checklist
                            </button>
                          ) : !b.cancelledAt ? (
                            <span className="flex items-center justify-center gap-2 py-3 font-bold text-gray-400">
                              <Clock className="w-4 h-4" />
                              {isPast ? 'Session checklist not ready' : 'Upcoming'}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <section>
            <h2 className="mb-2 text-2xl font-black text-gray-900">Student details</h2>
            <p className="mb-6 text-sm text-gray-600">
              Student assessment details for students assigned to your sessions. These details are private to your counselor account.
            </p>
            {bookings.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No student details yet"
                message="Student details will appear here after a student books an appointment with you."
              />
            ) : (
              <div className="space-y-5">
                {bookings.map((booking) => (
                  <article key={booking.id} className="scholar-panel-card rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-black text-gray-900">
                          {booking.studentName || booking.student.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {booking.emailId || booking.student.email}
                          {booking.phoneNo ? ` · ${booking.phoneNo}` : ''}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(booking.slot.date).toLocaleDateString('en-IN')} · {booking.slot.startTime}–{booking.slot.endTime}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        booking.cancelledAt
                          ? 'bg-slate-100 text-slate-600'
                          : booking.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}>
                        {booking.cancelledAt ? 'Cancelled' : booking.paymentStatus === 'PAID' ? 'Confirmed' : 'Payment pending'}
                      </span>
                    </div>
                    <dl className="mt-5 grid gap-4 border-t border-gray-100 pt-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      {booking.studentAge !== null && <div><dt className="font-semibold text-gray-500">Age</dt><dd className="mt-1 text-gray-900">{booking.studentAge}</dd></div>}
                      {booking.schoolCollege && <div><dt className="font-semibold text-gray-500">School / college</dt><dd className="mt-1 text-gray-900">{booking.schoolCollege}</dd></div>}
                      {booking.educationBackground && <div><dt className="font-semibold text-gray-500">Education background</dt><dd className="mt-1 text-gray-900">{booking.educationBackground}</dd></div>}
                      {booking.currentStream && <div><dt className="font-semibold text-gray-500">Current class / stream</dt><dd className="mt-1 text-gray-900">{booking.currentStream}</dd></div>}
                      {booking.marksPercentage !== null && <div><dt className="font-semibold text-gray-500">Latest marks</dt><dd className="mt-1 text-gray-900">{booking.marksPercentage}%</dd></div>}
                      {booking.careerAspiration && <div><dt className="font-semibold text-gray-500">Career aspiration</dt><dd className="mt-1 text-gray-900">{booking.careerAspiration}</dd></div>}
                      {booking.areasOfInterest && <div><dt className="font-semibold text-gray-500">Areas of interest</dt><dd className="mt-1 text-gray-900">{booking.areasOfInterest}</dd></div>}
                      {booking.subjectPreferences && <div><dt className="font-semibold text-gray-500">Subject preferences</dt><dd className="mt-1 text-gray-900">{booking.subjectPreferences}</dd></div>}
                      {booking.hobbies && <div><dt className="font-semibold text-gray-500">Hobbies</dt><dd className="mt-1 text-gray-900">{booking.hobbies}</dd></div>}
                      {booking.address && <div><dt className="font-semibold text-gray-500">Address</dt><dd className="mt-1 text-gray-900">{booking.address}</dd></div>}
                      {booking.familyType && <div><dt className="font-semibold text-gray-500">Family type</dt><dd className="mt-1 text-gray-900">{booking.familyType}</dd></div>}
                      {booking.AnnualfamilyIncome !== null && <div><dt className="font-semibold text-gray-500">Annual family income</dt><dd className="mt-1 text-gray-900">{booking.AnnualfamilyIncome}</dd></div>}
                      {booking.fatherName && <div><dt className="font-semibold text-gray-500">Father's name</dt><dd className="mt-1 text-gray-900">{booking.fatherName}</dd></div>}
                      {booking.fatherAge !== null && <div><dt className="font-semibold text-gray-500">Father's age</dt><dd className="mt-1 text-gray-900">{booking.fatherAge}</dd></div>}
                      {booking.fatherOcuupation && <div><dt className="font-semibold text-gray-500">Father's occupation</dt><dd className="mt-1 text-gray-900">{booking.fatherOcuupation}</dd></div>}
                      {booking.fatherEducation && <div><dt className="font-semibold text-gray-500">Father's education</dt><dd className="mt-1 text-gray-900">{booking.fatherEducation}</dd></div>}
                      {booking.motherName && <div><dt className="font-semibold text-gray-500">Mother's name</dt><dd className="mt-1 text-gray-900">{booking.motherName}</dd></div>}
                      {booking.motherAge !== null && <div><dt className="font-semibold text-gray-500">Mother's age</dt><dd className="mt-1 text-gray-900">{booking.motherAge}</dd></div>}
                      {booking.motherOcuupation && <div><dt className="font-semibold text-gray-500">Mother's occupation</dt><dd className="mt-1 text-gray-900">{booking.motherOcuupation}</dd></div>}
                      {booking.motherEducation && <div><dt className="font-semibold text-gray-500">Mother's education</dt><dd className="mt-1 text-gray-900">{booking.motherEducation}</dd></div>}
                    </dl>
                    {booking.student.careerAssessment && (
                      <div className="mt-5 border-t border-gray-100 pt-5">
                        <h4 className="text-sm font-bold text-gray-700">Student career assessment</h4>
                        <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                          {([
                            ['Class / level', booking.student.careerAssessment.studentClass],
                            ['School / college', booking.student.careerAssessment.schoolCollege],
                            ['Education board', booking.student.careerAssessment.educationBoard],
                            ['Academic performance', booking.student.careerAssessment.academicPerformance],
                            ['Subjects liked / strong in', booking.student.careerAssessment.strongSubjects],
                            ['Subjects disliked / difficult', booking.student.careerAssessment.dislikedSubjects],
                            ['Hobbies and talents', booking.student.careerAssessment.hobbies],
                            ['Known strengths', booking.student.careerAssessment.strengths],
                            ['Improvement areas', booking.student.careerAssessment.improvementAreas],
                            ['Courses of interest', booking.student.careerAssessment.coursesOfInterest],
                            ['Learning style', booking.student.careerAssessment.learningStyle],
                            ['Likes', booking.student.careerAssessment.likes],
                            ['Dislikes', booking.student.careerAssessment.dislikes],
                            ['Career goal', booking.student.careerAssessment.careerGoal],
                            ['Parent aspiration', booking.student.careerAssessment.parentsAspiration],
                          ] as const).filter(([, value]) => value).map(([label, value]) => (
                            <div key={label}>
                              <dt className="font-semibold text-gray-500">{label}</dt>
                              <dd className="mt-1 whitespace-pre-wrap text-gray-900">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                    {booking.subjectAssessments?.length ? (
                      <div className="mt-5 border-t border-gray-100 pt-5">
                        <h4 className="text-sm font-bold text-gray-700">Subject assessments</h4>
                        <ul className="mt-3 space-y-3">
                          {booking.subjectAssessments.map((assessment, index) => (
                            <li key={`${assessment.subject}-${index}`} className="rounded-xl bg-slate-50 p-4 text-sm">
                              <p className="font-semibold text-gray-900">{assessment.subject} · {assessment.overall}</p>
                              {assessment.comments && <p className="mt-1 text-gray-600">{assessment.comments}</p>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'meetings' && (
          <section>
            <h2 className="text-2xl font-black text-gray-900">Session links</h2>
            <p className="mb-6 mt-2 text-sm text-gray-600">
              Add a secure Google Meet or Zoom link for any booked session. Students receive the link from info@jzdtechnologies.com. Free-session links are emailed immediately; paid-session links are emailed once payment is confirmed.
            </p>
            {eligibleMeetingBookings.length === 0 ? (
              <EmptyState
                icon={Video}
                title="No active sessions"
                message="Meeting links are available for every active booked session, including free and unpaid paid sessions."
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {eligibleMeetingBookings.map((booking) => (
                  <section key={booking.id} className="scholar-panel-card rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-black text-gray-900">{booking.student.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">{booking.emailId || booking.student.email}</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        {booking.isFreeSession ? 'Free session' : `Paid · ${booking.paymentStatus.toLowerCase()}`}
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-gray-600">
                      {new Date(booking.slot.date).toLocaleDateString('en-IN')} · {booking.slot.startTime}–{booking.slot.endTime}
                    </p>
                    <div className="mt-5 space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                      <label htmlFor={`meeting-link-${booking.id}`} className="block text-sm font-semibold text-slate-700">
                        Secure meeting link
                      </label>
                      <input
                        id={`meeting-link-${booking.id}`}
                        type="url"
                        value={meetingLinkDrafts[booking.id] || ''}
                        onChange={(event) => setMeetingLinkDrafts((current) => ({ ...current, [booking.id]: event.target.value }))}
                        placeholder="https://meet.google.com/... or https://zoom.us/..."
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                      />
                      <button
                        onClick={() => handleSaveMeetingLink(booking.id)}
                        disabled={savingMeetingBookingId === booking.id || (
                          (meetingLinkDrafts[booking.id] || '') === (booking.meetingLink || '') &&
                          (!booking.meetingLink || Boolean(booking.meetingLinkEmailSentAt))
                        )}
                        className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {savingMeetingBookingId === booking.id
                          ? 'Saving...'
                          : booking.meetingLink && !booking.meetingLinkEmailSentAt
                            ? 'Retry session link email'
                            : booking.meetingLink
                              ? 'Update meeting link'
                              : 'Save and email link'}
                      </button>
                      {booking.meetingLinkEmailSentAt && (
                        <p className="text-xs text-emerald-700">Meeting link emailed to the student.</p>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            TAB: AVAILABILITY
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'availability' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900">My Availability</h2>
              <p className="text-sm text-gray-500">Weekdays · 5:00 PM–8:00 PM IST</p>
            </div>

            <section className="mb-8 rounded-[20px] border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">Set your session times</h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose a weekday and select the one-hour sessions you can offer. Changes are reflected in student booking.
              </p>
              <label className="mt-5 block max-w-xs text-sm font-semibold text-gray-700">
                Availability date
                <input
                  type="date"
                  min={localToday}
                  value={availabilityDate}
                  onChange={(event) => handleAvailabilityDateChange(event.target.value)}
                  className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3"
                />
              </label>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {COUNSELING_TIME_OPTIONS.map((option) => {
                  const slot = slots.find((candidate) =>
                    availabilityDate &&
                    new Date(candidate.date).toISOString().slice(0, 10) === availabilityDate &&
                    candidate.startTime === option.startTime &&
                    candidate.isBooked
                  );
                  return (
                    <label
                      key={option.startTime}
                      className={`flex items-center gap-3 rounded-xl border p-4 ${
                        slot ? 'cursor-not-allowed border-gray-200 bg-gray-50' : 'cursor-pointer border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(slot) || selectedAvailabilityTimes.includes(option.startTime)}
                        disabled={!availabilityDate || Boolean(slot)}
                        onChange={(event) =>
                          setSelectedAvailabilityTimes((current) =>
                            event.target.checked
                              ? [...new Set([...current, option.startTime])]
                              : current.filter((time) => time !== option.startTime)
                          )
                        }
                        className="h-4 w-4 accent-indigo-600"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-gray-800">{option.label}</span>
                        {slot && <span className="text-xs text-gray-500">Already booked</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
              {availabilityError && (
                <p className="mt-4 flex items-center gap-2 text-sm text-rose-600" role="alert">
                  <AlertCircle className="h-4 w-4" />
                  {availabilityError}
                </p>
              )}
              <button
                type="button"
                onClick={handleSaveAvailability}
                disabled={!availabilityDate || savingAvailability}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingAvailability ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save availability
              </button>
            </section>

            <h3 className="mb-4 text-lg font-bold text-gray-900">Upcoming availability and appointments</h3>
            {slots.length === 0 ? (
              <EmptyState
                icon={CalendarPlus}
                title="No upcoming availability"
                message="Select a weekday above and add the times you are available for students to book."
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
      {selectedChecklistBooking && token && (
        <CounselorChecklistModal
          booking={selectedChecklistBooking}
          token={token}
          onClose={() => setSelectedChecklistBooking(null)}
          onSaved={(answers, completedAt) =>
            handleChecklistSaved(selectedChecklistBooking.id, answers, completedAt)
          }
        />
      )}
    </div>
  );
}
