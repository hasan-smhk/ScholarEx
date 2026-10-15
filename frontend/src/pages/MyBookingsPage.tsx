import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Booking {
  id: string;
  isFreeSession: boolean;
  paymentStatus: string;
  meetingLink: string | null;
  createdAt: string;
  slot: {
    date: string;
    startTime: string;
    endTime: string;
    counselor: { name: string; specialization: string };
  };
  report: { id: string; approvalStatus: string; createdAt: string } | null;
}

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBookings() {
      try {
        const response = await getMyBookings(token!);
        setBookings(response.data);
      } catch (err) {
        setError('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    }
    if (token) loadBookings();
  }, [token]);

  if (!user) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Please login to view your bookings</h2>
      </div>
    );
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading bookings...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <main className="scholar-page min-h-screen px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 rounded-3xl bg-gradient-to-r from-[#123a40] via-[#15545a] to-[#285e62] px-7 py-8 text-white shadow-lg sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-200">Your journey</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">My counselling sessions</h1>
          <p className="mt-2 text-sm text-teal-50/80">Review session details, join confirmed meetings, and access approved reports.</p>
        </header>

        {bookings.length === 0 ? (
          <section className="scholar-panel-card rounded-3xl p-10 text-center sm:p-14">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-2xl">✦</div>
            <h2 className="mt-5 text-xl font-bold text-slate-900">Your next step starts here</h2>
            <p className="mt-2 text-slate-600">No bookings yet. Find a counselor to begin your journey.</p>
            <button
              onClick={() => navigate('/counselors')}
              className="mt-6 rounded-xl bg-teal-700 px-5 py-3 font-bold text-white transition-colors hover:bg-teal-800"
            >
              Find a counselor
            </button>
          </section>
        ) : (
          <div className="space-y-5">
            {bookings.map((booking) => (
              <article key={booking.id} className="scholar-panel-card rounded-3xl p-6 sm:p-7">
                <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-900">{booking.slot.counselor.name}</h2>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        booking.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {booking.paymentStatus === 'PAID' ? 'Confirmed' : 'Payment pending'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-teal-800">{booking.slot.counselor.specialization}</p>
                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                      <span>{new Date(booking.slot.date).toLocaleDateString()}</span>
                      <span>{booking.slot.startTime} – {booking.slot.endTime}</span>
                      <span>{booking.isFreeSession ? 'Complimentary session' : 'Paid session'}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Booked {new Date(booking.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <button
                      onClick={() => navigate(`/booking/${booking.id}`)}
                      className="rounded-xl border border-teal-200 px-4 py-2.5 text-sm font-bold text-teal-800 transition-colors hover:bg-teal-50"
                    >
                      View details
                    </button>
                    {booking.paymentStatus === 'PAID' && booking.meetingLink && (
                      <a
                        href={booking.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-teal-800"
                      >
                        Join session
                      </a>
                    )}
                    {booking.report?.approvalStatus === 'APPROVED' && (
                      <button
                        onClick={() => navigate(`/booking/${booking.id}/report`)}
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-700"
                      >
                        View report
                      </button>
                    )}
                  </div>
                </div>
                {booking.report && booking.report.approvalStatus !== 'APPROVED' && (
                  <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
                    Report status: {booking.report.approvalStatus === 'PENDING_REVIEW' ? 'Awaiting admin approval' : 'Counselor revisions requested'}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
