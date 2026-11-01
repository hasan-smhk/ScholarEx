import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, X, MapPin, Clock, Calendar, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCounselors, getMyCareerAssessment } from '../services/api';
import PaidBookingForm from '../components/PaidBookingForm';
import { formatSlotDate } from '../utils/slotDate';
import PageBackground from '../components/PageBackground';

interface Slot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

interface Counselor {
  id: string;
  name: string;
  specialization: string;
  sessionFee?: number;
  rating?: number;
  experience?: string;
  location?: string;
  slots: Slot[];
}

const formatCounselingTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

export default function CounselorListPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [assessmentReady, setAssessmentReady] = useState(false);

  useEffect(() => {
    let active = true;
    let firstLoad = true;
    let refreshInProgress = false;
    async function loadCounselors() {
      if (refreshInProgress) return;
      refreshInProgress = true;
      try {
        const response = await getCounselors();
        if (active) {
          setCounselors(response.data);
          setRefreshError(null);
        }
      } catch (err: any) {
        if (active && firstLoad) {
          setError(err.response?.data?.error || 'Failed to load counselors');
        } else if (active) {
          setRefreshError(err.response?.data?.error || 'Could not refresh counselor availability.');
        }
      } finally {
        refreshInProgress = false;
        if (active) {
          setLoading(false);
          firstLoad = false;
        }
      }
    }
    loadCounselors();
    const refreshInterval = window.setInterval(loadCounselors, 15_000);
    window.addEventListener('focus', loadCounselors);
    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', loadCounselors);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: { pathname: '/counselors' } }, replace: true });
      return;
    }

    let active = true;
    getMyCareerAssessment(token)
      .then(({ data }) => {
        if (!active) return;
        if (!data?.report) {
          navigate('/counseling', { replace: true });
          return;
        }
        setAssessmentReady(true);
      })
      .catch((err: any) => {
        if (active) {
          setError(err.response?.data?.error || 'Could not verify your career report');
        }
      });

    return () => {
      active = false;
    };
  }, [token, navigate]);

  const handleBookSlot = (counselor: Counselor) => {
    if (!user || !token) {
      navigate('/login', { state: { from: { pathname: '/counselors' } } });
      return;
    }
    if (!assessmentReady) return;
    setSelectedCounselor(counselor);
  };

  const handleCloseModal = () => {
    setSelectedCounselor(null);
  };

  if (loading || (!assessmentReady && !error)) {
    return (
      <PageBackground theme="counseling" className="flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-teal-300" />
          <p className="font-medium text-slate-200">Loading counselors...</p>
        </div>
      </PageBackground>
    );
  }

  if (error) {
    return (
      <PageBackground theme="counseling" className="flex items-center justify-center p-6">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-2xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Oops!</h2>
          <p className="text-red-600">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 rounded-2xl bg-[#0b3943] px-6 py-3 font-bold text-white transition-colors hover:bg-[#0d4a55]">Try Again</button>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground theme="counseling" className="pb-20">
      <header className="relative isolate overflow-hidden bg-gradient-to-br from-[#071b24] via-[#0b3943] to-[#0c3440] py-16 text-white sm:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full border border-white/10 sm:h-96 sm:w-96" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-2 top-0 h-56 w-56 rounded-full border border-white/10 sm:h-72 sm:w-72" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_auto] lg:px-12">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-teal-200">Personalised counselling</p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Find direction.
              <br />
              <span className="text-[#c8f36a]">Build your future.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">
              One-to-one career guidance to help you explore your strengths, choose a path, and plan your next steps.
            </p>
            <p className="mt-5 text-sm text-teal-100">A free career report is required before booking a paid session.</p>
          </div>
          <div className="hidden h-44 w-44 items-center justify-center rounded-[2rem] border border-white/15 bg-white/5 text-7xl shadow-2xl backdrop-blur-sm lg:flex" aria-hidden="true">
            🎓
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pt-10 sm:px-8 sm:pt-14 lg:px-12">
        {refreshError && (
          <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
            {refreshError} Availability will be refreshed when the connection is restored.
          </p>
        )}
        <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-200">Your counselor</p>
            <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">Career guidance, made personal</h2>
          </div>
          <p className="text-sm text-slate-300">Weekdays · 5:00 PM–8:00 PM IST</p>
        </div>
        {counselors.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white p-12 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
              <AlertCircle className="h-8 w-8 text-teal-600" />
            </div>
            <h3 className="mb-2 text-xl font-black text-slate-900">No counselor slots available</h3>
            <p className="text-slate-600">Please check back later for new career-guidance appointments.</p>
          </div>
        ) : (
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6">
            {counselors.map((counselor) => {
              const availableSlots = counselor.slots.filter((s) => !s.isBooked);

              return (
                <article key={counselor.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl transition-transform duration-300 hover:-translate-y-1">
                  <div className="bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6 sm:p-8">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-700 to-cyan-700 text-xl font-black text-white shadow-lg">
                        {counselor.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="truncate text-xl font-black leading-tight text-slate-900">{counselor.name}</h3>
                        <p className="mt-1 truncate text-sm font-bold text-teal-700">{counselor.specialization}</p>
                        {counselor.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(counselor.rating!) ? 'text-amber-400 fill-current' : 'text-gray-300'}`} />
                            ))}
                            <span className="text-xs text-gray-500 ml-1">({counselor.rating})</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {counselor.experience && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600"><Clock className="w-3.5 h-3.5" /><span>{counselor.experience}</span></div>
                      )}
                      {counselor.location && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600"><MapPin className="w-3.5 h-3.5" /><span>{counselor.location}</span></div>
                      )}
                      {typeof counselor.sessionFee === 'number' && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <span aria-hidden="true">₹</span>
                          <span>{counselor.sessionFee.toLocaleString('en-IN')} per session · payment required</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-800">Upcoming schedule</h4>
                      <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">{availableSlots.length} open</span>
                    </div>

                    {availableSlots.length === 0 ? (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
                        <p className="text-sm font-medium text-slate-500">No available slots right now</p>
                      </div>
                    ) : (
                      <>
                        <div className="max-h-[260px] space-y-2.5 overflow-y-auto pr-1">
                          {availableSlots.slice(0, 6).map((slot) => (
                            <div key={slot.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                                  <Calendar className="h-4 w-4 text-teal-700" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">
                                    {formatSlotDate(slot.date, 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatCounselingTime(slot.startTime)} – {formatCounselingTime(slot.endTime)}
                                  </p>
                                </div>
                              </div>
                              <Clock className="h-4 w-4 text-teal-600" aria-hidden="true" />
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => handleBookSlot(counselor)}
                          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0b3943] px-4 py-4 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#0d4a55]"
                        >
                          Pay and book a slot
                          <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {selectedCounselor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-3 sm:p-5">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-7">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Career guidance</p>
                <h2 className="text-xl font-black text-slate-900 sm:text-2xl">Book your session</h2>
                <p className="mt-1 text-sm text-slate-600">
                  A payment is required to confirm this counseling session.
                </p>
              </div>
              <button onClick={handleCloseModal} aria-label="Close booking form" className="shrink-0 rounded-full bg-slate-100 p-2 transition-colors hover:bg-slate-200">
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 sm:p-6">
              <PaidBookingForm
                counselor={selectedCounselor}
                onClose={handleCloseModal}
              />
            </div>
          </div>
        </div>
      )}
    </PageBackground>
  );
}
