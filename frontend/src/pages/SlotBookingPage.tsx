import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageBackground from '../components/PageBackground';
import { 
  Calendar, 
  Clock, 
  ArrowLeft, 
  CheckCircle, 
  Loader2, 
  ShieldCheck, 
  CreditCard,
  Info,
  Star,
  Sparkles
} from 'lucide-react';

// Types
interface Slot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  counselorId: string;
}

interface Counselor {
  id: string;
  name: string;
  isFree: boolean;
  specialization: string;
}

// Dummy Data
const DUMMY_COUNSELOR: Counselor = {
  id: 'c1',
  name: 'Syed Baqar',
  isFree: true,
  specialization: 'Career Guidance'
};

const DUMMY_SLOTS: Slot[] = [
  { id: 's1', counselorId: 'c1', date: '2024-11-08', startTime: '10:00 AM', endTime: '11:00 AM' },
  { id: 's2', counselorId: 'c1', date: '2024-11-08', startTime: '2:00 PM', endTime: '3:00 PM' },
  { id: 's3', counselorId: 'c1', date: '2024-11-09', startTime: '11:00 AM', endTime: '12:00 PM' },
  { id: 's4', counselorId: 'c1', date: '2024-11-09', startTime: '4:00 PM', endTime: '5:00 PM' },
  { id: 's5', counselorId: 'c1', date: '2024-11-10', startTime: '10:00 AM', endTime: '11:00 AM' },
  { id: 's6', counselorId: 'c1', date: '2024-11-10', startTime: '3:00 PM', endTime: '4:00 PM' },
];

export default function SlotBookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  
  const counselorId = searchParams.get('counselor');
  
  const [slots, setSlots] = useState<Slot[]>(DUMMY_SLOTS);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [counselor, setCounselor] = useState<Counselor>(DUMMY_COUNSELOR);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In reality, fetch slots based on counselorId
    // fetch(`/api/slots?counselorId=${counselorId}`);
  }, [counselorId]);

  const handleSlotSelect = (slotId: string) => {
    setSelectedSlotId(slotId);
    setError(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlotId) {
      setError('Please select a time slot to continue');
      return;
    }

    if (!token) {
      navigate('/login');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setBookingConfirmed(true);
      setIsLoading(false);
    }, 2000);
    
    // In reality:
    // await api.post('/bookings', { counselorId, slotId: selectedSlotId });
  };

  const selectedSlot = slots.find(s => s.id === selectedSlotId);

  const formatSlotDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dayLabel = date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    
    if (date.toDateString() === today.toDateString()) {
      dayLabel = `Today, ${dayLabel}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dayLabel = `Tomorrow, ${dayLabel}`;
    }
    
    return dayLabel;
  };

  if (bookingConfirmed) {
    return (
      <PageBackground theme="success" className="flex items-center justify-center overflow-hidden p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-emerald-100">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-3">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-6">
            Your session with <span className="font-bold text-emerald-600">{counselor.name}</span> is booked for:
          </p>
          <div className="bg-emerald-50 rounded-2xl p-6 mb-8 border border-emerald-100">
            <p className="font-black text-emerald-800 text-lg mb-2">{selectedSlot ? formatSlotDate(selectedSlot.date) : ''}</p>
            <p className="text-emerald-600 font-bold">{selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : ''}</p>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black py-4 rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/30"
            >
              Go to Dashboard
            </button>
            <button 
              onClick={() => navigate('/counselors')}
              className="w-full text-emerald-600 font-bold py-3 hover:bg-emerald-50 rounded-2xl transition-colors"
            >
              Book Another Session
            </button>
          </div>
        </div>
      </PageBackground>
    );
  }

  // Group slots by date
  const groupedSlots = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);

  const sortedDates = Object.keys(groupedSlots).sort();

  return (
    <PageBackground theme="booking" texture="grid">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#071b24] via-[#0b3943] to-[#0c3440] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-teal-100">
            Step 2 of 2
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
            Confirm Your Session
          </h1>
          <p className="text-xl text-white/80">
            Select a time slot that works for you
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-16">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Slot Selection */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-lg">
              {/* Back Button */}
              <button 
                onClick={() => navigate('/counselors')}
                className="mb-6 flex items-center gap-2 font-bold text-teal-700 transition-colors hover:text-teal-900"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Counselors
              </button>

              {/* Counselor Info Card */}
              <div className="mb-8 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-700 to-cyan-700 text-2xl font-black text-white shadow-lg">
                    {counselor.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">{counselor.name}</h2>
                    <p className="font-bold text-teal-700">{counselor.specialization}</p>
                    {counselor.isFree ? (
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3 py-1 rounded-full text-xs font-black border border-green-200 mt-2">
                        <Sparkles className="w-3 h-3" />
                        Free Session
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-2xl mb-6 flex items-center gap-3">
                  <Info className="w-5 h-5 text-red-600" />
                  <span className="font-bold">{error}</span>
                </div>
              )}

              {/* Slots by Date */}
              <div className="space-y-8">
                {sortedDates.map(dateStr => (
                  <div key={dateStr}>
                    <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-teal-700" />
                      {formatSlotDate(dateStr)}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {groupedSlots[dateStr].map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => handleSlotSelect(slot.id)}
                          className={`p-5 rounded-2xl border-2 transition-all duration-300 text-left group ${
                            selectedSlotId === slot.id
                              ? 'bg-gradient-to-br from-teal-700 to-cyan-700 border-teal-700 text-white shadow-lg shadow-teal-700/30'
                              : 'bg-white border-gray-200 hover:border-teal-500 hover:bg-teal-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Clock className={`w-5 h-5 ${
                              selectedSlotId === slot.id ? 'text-white' : 'text-teal-700'
                            }`} />
                            <div>
                              <p className={`font-bold ${
                                selectedSlotId === slot.id ? 'text-white' : 'text-gray-900'
                              }`}>
                                {slot.startTime} - {slot.endTime}
                              </p>
                              {selectedSlotId === slot.id && (
                                <p className="text-teal-100 text-sm font-bold">Selected</p>
                              )}
                            </div>
                            {selectedSlotId === slot.id && (
                              <CheckCircle className="w-5 h-5 text-white ml-auto" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-3xl border border-white/10 bg-white p-6 shadow-lg">
              <h3 className="text-xl font-black text-gray-900 mb-6">Booking Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                    <Star className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <p className="text-gray-500 font-bold">Counselor</p>
                    <p className="font-bold text-gray-900">{counselor.name}</p>
                  </div>
                </div>
                
                {selectedSlot ? (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                      <Calendar className="w-5 h-5 text-teal-700" />
                    </div>
                    <div>
                      <p className="text-gray-500 font-bold">Time Slot</p>
                      <p className="font-bold text-gray-900">{formatSlotDate(selectedSlot.date)}</p>
                      <p className="font-bold text-teal-700">{selectedSlot.startTime} - {selectedSlot.endTime}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <p className="font-bold">Select a time slot</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600 font-bold">Session Type</span>
                  <span className="font-black text-emerald-600">{counselor.isFree ? 'FREE' : 'PAID'}</span>
                </div>
                
                {!counselor.isFree && (
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600 font-bold">Total (including service fee)</span>
                    <span className="font-black text-gray-900">₹525</span>
                  </div>
                )}

                <button
                  onClick={handleConfirmBooking}
                  disabled={!selectedSlotId || isLoading}
                  className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                    selectedSlotId && !isLoading
                      ? 'bg-gradient-to-r from-teal-700 to-cyan-700 text-white hover:from-teal-800 hover:to-cyan-800 shadow-lg shadow-teal-500/30'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Confirming...
                    </>
                  ) : !counselor.isFree ? (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Proceed to Payment
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirm Free Booking
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Secure booking • Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageBackground>
  );
}
