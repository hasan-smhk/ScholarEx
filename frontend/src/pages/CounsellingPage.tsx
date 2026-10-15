import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Star, Clock, Calendar, ChevronRight, Award, Loader2, CheckCircle, Sparkles } from 'lucide-react';

// Types for the API
interface Counselor {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  rating: number;
  totalSessions: number;
  availableSlots: AvailableSlot[];
  isFree: boolean;
  bio?: string;
}

interface AvailableSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

// Enhanced Dummy Data
const DUMMY_COUNSELORS: Counselor[] = [
  {
    id: 'c1',
    name: 'Dr. Priya Sharma',
    specialization: 'Career Guidance & Subject Selection',
    experience: '10+ years',
    rating: 4.9,
    totalSessions: 200,
    isFree: true,
    bio: 'Expert in career counselling with focus on science and commerce streams.',
    availableSlots: [
      { id: 's1', date: '2024-11-07', startTime: '10:00 AM', endTime: '11:00 AM' },
      { id: 's2', date: '2024-11-08', startTime: '2:00 PM', endTime: '3:00 PM' },
      { id: 's3', date: '2024-11-09', startTime: '11:00 AM', endTime: '12:00 PM' },
    ]
  },
  {
    id: 'c2',
    name: 'Mr. Syed Baqar',
    specialization: 'Academic Strategy & Performance',
    experience: '8+ years',
    rating: 4.8,
    totalSessions: 180,
    isFree: false,
    bio: 'Specializes in helping students improve academic performance and study habits.',
    availableSlots: [
      { id: 's4', date: '2024-11-07', startTime: '3:00 PM', endTime: '4:00 PM' },
      { id: 's5', date: '2024-11-10', startTime: '10:00 AM', endTime: '11:00 AM' },
    ]
  },
  {
    id: 'c3',
    name: 'Ms. Anjali Desai',
    specialization: 'Exam Preparation & Confidence',
    experience: '7+ years',
    rating: 4.9,
    totalSessions: 165,
    isFree: true,
    bio: 'Helps students overcome exam anxiety and build confidence for board exams.',
    availableSlots: [
      { id: 's6', date: '2024-11-08', startTime: '10:00 AM', endTime: '11:00 AM' },
      { id: 's7', date: '2024-11-09', startTime: '3:00 PM', endTime: '4:00 PM' },
      { id: 's8', date: '2024-11-10', startTime: '2:00 PM', endTime: '3:00 PM' },
    ]
  }
];

export default function CounselorsListPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCounselor, setExpandedCounselor] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCounselors(DUMMY_COUNSELORS);
      setLoading(false);
    }, 800);
  }, []);

  const handleBooking = (counselorId: string, slotId: string) => {
    if (!token) {
      navigate('/login');
      return;
    }
    navigate(`/counseling/confirm?counselor=${counselorId}&slot=${slotId}`);
  };

  if (loading) {
    return (
      <div className="scholar-page min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading counselors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scholar-page min-h-screen">
      {/* Header */}
      <div className="scholar-dashboard-hero relative py-24 overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-pink-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-violet-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        ></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-purple-500/30 text-purple-100 px-4 py-2 rounded-full text-sm font-bold mb-4 border border-purple-400/30 mb-6">
              <Sparkles className="w-4 h-4" />
              Step 1 of 2
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
              Choose Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-yellow-300"> Counselor</span>
            </h1>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Connect with our expert team to guide your academic journey and unlock your potential.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-20">
        <div className="space-y-6">
          {counselors.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center shadow-lg border border-purple-100">
              <p className="text-gray-500 text-lg">No counselors available right now. Please check back soon!</p>
            </div>
          ) : (
            counselors.map((counselor, index) => (
              <div
                key={counselor.id}
                className="bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-purple-100 overflow-hidden group"
              >
                {/* Top accent line */}
                <div className="h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-violet-600"></div>

                <div className="p-6 md:p-8">
                  {/* Top section - Counselor Info */}
                  <div className="flex flex-col md:flex-row gap-6 mb-8">
                    {/* Avatar */}
                    <div className="shrink-0">
                      <div className="w-[100px] h-[100px] md:w-[140px] md:h-[140px] rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-violet-600 flex items-center justify-center text-5xl font-black text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {counselor.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>

                    {/* Counselor Details */}
                    <div className="flex-1">
                      {/* Name and Badge */}
                      <div className="flex flex-wrap items-start gap-3 mb-3">
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900">{counselor.name}</h2>
                        {counselor.isFree && (
                          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-black border border-green-200">
                            <CheckCircle className="w-4 h-4" />
                            Free Session
                          </span>
                        )}
                      </div>

                      {/* Specialization */}
                      <p className="text-purple-600 font-bold text-base mb-3">{counselor.specialization}</p>

                      {/* Bio */}
                      <p className="text-gray-600 text-sm leading-6 mb-4">{counselor.bio}</p>

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-amber-400 fill-current" />
                          <span className="font-black text-lg text-gray-900">{counselor.rating}</span>
                          <span className="text-gray-500 text-sm">(Highly Rated)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-purple-600" />
                          <span className="font-bold text-gray-900">{counselor.experience}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-pink-600" />
                          <span className="text-gray-900 font-bold">{counselor.totalSessions}</span>
                          <span className="text-gray-600 text-sm">sessions</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 my-8"></div>

                  {/* Slots Section */}
                  <div>
                    <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      Available Time Slots
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {counselor.availableSlots.map((slot) => {
                        const slotDate = new Date(slot.date);
                        const formattedDate = slotDate.toLocaleDateString('en-IN', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        });

                        return (
                          <button
                            key={slot.id}
                            onClick={() => handleBooking(counselor.id, slot.id)}
                            className="relative group/slot p-5 rounded-2xl border-2 border-gray-200 hover:border-purple-500 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 transition-all duration-300 text-left"
                          >
                            {/* Background gradient on hover */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover/slot:opacity-100 transition-opacity"></div>

                            <div className="relative">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-purple-600 group-hover/slot:text-purple-700" />
                                <p className="font-black text-gray-900 text-base">{formattedDate}</p>
                              </div>
                              <p className="text-sm font-bold text-gray-600 ml-6 group-hover/slot:text-gray-900">
                                {slot.startTime} - {slot.endTime}
                              </p>
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 group-hover/slot:text-purple-600 group-hover/slot:translate-x-1 transition-all">
                                <ChevronRight className="w-5 h-5" />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-center text-white border border-purple-400/50">
          <h3 className="text-2xl font-black mb-2">Not sure which counselor to choose?</h3>
          <p className="text-purple-100 mb-6">All our counselors are experts. You can start with any one, or book a free introductory session.</p>
          <button
            onClick={() => navigate('/counseling')}
            className="inline-flex items-center gap-2 bg-white text-purple-600 font-black px-8 py-3 rounded-2xl hover:bg-purple-50 transition-colors"
          >
            Learn More <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
