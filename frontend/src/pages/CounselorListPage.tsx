import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, X, MapPin, Clock, Calendar, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCounselingEligibility, getCounselors } from '../services/api';
import BookingForm from '../components/BookingForm';
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
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [hasUsedFreeSession, setHasUsedFreeSession] = useState<boolean | null>(
    user?.hasUsedFreeSession ?? null
  );

  useEffect(() => {
    async function loadCounselors() {
      try {
        setLoading(true);
        const response = await getCounselors();
        setCounselors(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load counselors');
      } finally {
        setLoading(false);
      }
    }
    loadCounselors();
  }, []);

  useEffect(() => {
    if (!token) {
      setHasUsedFreeSession(null);
      return;
    }

    let active = true;
    getCounselingEligibility(token)
      .then(({ data }) => {
        if (active) setHasUsedFreeSession(data.hasUsedFreeSession);
      })
      .catch((err: any) => {
        if (active) {
          setError(err.response?.data?.error || 'Could not verify counseling eligibility');
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (user?.hasUsedFreeSession) setHasUsedFreeSession(true);
  }, [user?.hasUsedFreeSession]);

  const handleBookSlot = (counselor: Counselor) => {
    if (!user || !token) {
      navigate('/login', { state: { from: { pathname: '/counselors' } } });
      return;
    }
    if (hasUsedFreeSession === null) return;
    setSelectedCounselor(counselor);
  };

  const handleCloseModal = () => {
    setSelectedCounselor(null);
  };

  if (loading) {
    return (
      <PageBackground theme="counseling" className="flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-gray-500 font-medium">Loading counselors...</p>
        </div>
      </PageBackground>
    );
  }

  if (error) {
    return (
      <PageBackground theme="counseling" className="flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-[24px] p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Oops!</h2>
          <p className="text-red-600">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 bg-red-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-red-700 transition-colors">Try Again</button>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground theme="counseling" className="pb-16">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-black">Counseling Slots</h1>
          <p className="text-indigo-200 mt-2 text-lg">Weekdays, 5:00 PM–8:00 PM. We will match your goals with an available counselor and slot.</p>
          {user && hasUsedFreeSession === false && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <span className="text-sm font-bold">🎉 Your first session is FREE!</span>
            </div>
          )}
          {!user && <p className="mt-4 text-sm text-indigo-100">Sign in to complete the booking form and reserve a slot.</p>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-6">
        {counselors.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 text-center shadow-sm border border-gray-100 mt-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Counselors Available</h3>
            <p className="text-gray-500">Please check back later.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {counselors.map((counselor) => {
              const availableSlots = counselor.slots.filter((s) => !s.isBooked);

              return (
                <div key={counselor.id} className="bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                  <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0">
                        {counselor.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-gray-900 text-lg leading-tight truncate">{counselor.name}</h3>
                        <p className="text-sm text-indigo-600 font-medium mt-0.5 truncate">{counselor.specialization}</p>
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
                    <div className="flex flex-wrap gap-3 mt-4">
                      {counselor.experience && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500"><Clock className="w-3.5 h-3.5" /><span>{counselor.experience}</span></div>
                      )}
                      {counselor.location && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500"><MapPin className="w-3.5 h-3.5" /><span>{counselor.location}</span></div>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-700">Upcoming schedule</h4>
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{availableSlots.length} open</span>
                    </div>

                    {availableSlots.length === 0 ? (
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-sm text-gray-400 font-medium">No available slots</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                          {availableSlots.slice(0, 6).map((slot) => (
                            <div key={slot.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                                  <Calendar className="w-4 h-4 text-indigo-500" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-800">
                                    {formatSlotDate(slot.date, 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatCounselingTime(slot.startTime)} – {formatCounselingTime(slot.endTime)}
                                  </p>
                                </div>
                              </div>
                              <Clock className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => handleBookSlot(counselor)}
                          disabled={Boolean(user && hasUsedFreeSession === null)}
                          className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
                        >
                          {user && hasUsedFreeSession === null ? 'Checking eligibility…' : 'Get matched to a slot'}
                          <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedCounselor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button onClick={handleCloseModal} className="absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors">
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-black text-gray-900 mb-2">Book Your Session</h2>
              <p className="text-gray-500 mb-6">Submit your details to receive an automatically matched counselor and appointment time.</p>
              <BookingForm
                counselor={selectedCounselor}
                hasUsedFreeSession={hasUsedFreeSession === true}
                onClose={handleCloseModal}
              />
            </div>
          </div>
        </div>
      )}
    </PageBackground>
  );
}
