import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Home, Calendar } from 'lucide-react';
import { getBookingById, resendPaymentConfirmationEmails } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PageBackground from '../components/PageBackground';

interface Booking {
  id: string;
  isFreeSession: boolean;
  paymentStatus: string;
  studentPaymentEmailSentAt: string | null;
  counselorPaymentEmailSentAt: string | null;
  cancelledAt: string | null;
  amount: number;
  serviceFee: number;
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

const formatSessionTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
};

export default function BookingCompletePage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState<{ studentSent: boolean; counselorSent: boolean } | null>(null);
  const [emailError, setEmailError] = useState('');
  const [retryingEmails, setRetryingEmails] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadBooking() {
      if (!bookingId || !token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const response = await getBookingById(bookingId, token);
        if (!active) return;

        const loadedBooking = response.data;
        if (loadedBooking.cancelledAt) {
          navigate(`/booking/${bookingId}`, { replace: true });
          return;
        }
        if (!loadedBooking.isFreeSession && loadedBooking.paymentStatus !== 'PAID') {
          navigate(`/booking/${bookingId}`, { replace: true });
          return;
        }

        setBooking(loadedBooking);
        if (!loadedBooking.isFreeSession) {
          setEmailNotifications({
            studentSent: Boolean(loadedBooking.studentPaymentEmailSentAt),
            counselorSent: Boolean(loadedBooking.counselorPaymentEmailSentAt),
          });
        }
      } catch {
        if (active) navigate('/counselors', { replace: true });
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBooking();
    return () => {
      active = false;
    };
  }, [bookingId, navigate, token]);

  async function retryConfirmationEmails() {
    if (!bookingId || !token || retryingEmails) return;
    setRetryingEmails(true);
    setEmailError('');
    try {
      const response = await resendPaymentConfirmationEmails(bookingId, token);
      setEmailNotifications(response.data.emailNotifications);
    } catch (err: any) {
      if (err.response?.data?.emailNotifications) {
        setEmailNotifications(err.response.data.emailNotifications);
      }
      setEmailError(err.response?.data?.error || 'Could not resend confirmation emails.');
    } finally {
      setRetryingEmails(false);
    }
  }

  if (loading || !booking) {
    return <PageBackground theme="success" className="flex items-center justify-center text-white">Loading booking...</PageBackground>;
  }

  return (
    <PageBackground theme="success" className="py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">🎉 Booking Confirmed!</h1>
          <p className="text-gray-600 text-lg">
            Your counseling session has been successfully booked. Your counselor will add the video meeting link, and it will be emailed from info@jzdtechnologies.com.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {emailNotifications && (!emailNotifications.studentSent || !emailNotifications.counselorSent) && (
            <div role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p>Payment is confirmed, but some confirmation emails have not been delivered.</p>
              {emailError && <p className="mt-2">{emailError}</p>}
              <button
                type="button"
                onClick={retryConfirmationEmails}
                disabled={retryingEmails}
                className="mt-3 rounded-lg border border-amber-300 px-3 py-2 font-bold disabled:opacity-50"
              >
                {retryingEmails ? 'Retrying...' : 'Retry confirmation emails'}
              </button>
            </div>
          )}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <div>
              <p className="text-sm text-gray-500">Booking ID</p>
              <p className="font-bold text-gray-900">#{bookingId?.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="font-bold text-blue-900">{booking.slot.counselor.name}</p>
            <p className="text-sm text-blue-700">{booking.slot.counselor.specialization}</p>
            <p className="mt-2 text-sm text-blue-700">
              {new Date(booking.slot.date).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              {' · '}{formatSessionTime(booking.slot.startTime)}–{formatSessionTime(booking.slot.endTime)}
            </p>
          </div>
          <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="font-bold text-indigo-900">What happens next</p>
            <ol className="mt-3 space-y-2 text-sm text-indigo-800">
              <li>1. Attend your booked counselling appointment.</li>
              <li>2. Your counselor prepares an AI-assisted report for the counselling area, then reviews it.</li>
              <li>3. An administrator verifies and approves the report.</li>
              <li>4. After approval, we email you a private link to view your report.</li>
            </ol>
            <p className="mt-3 text-xs text-indigo-700">
              {booking.isFreeSession
                ? 'This was your free first session. Future sessions are charged at the assigned counselor’s fee.'
                : booking.serviceFee > 0
                  ? `Total paid: ₹${booking.amount} (includes ₹${booking.serviceFee} service fee). Future sessions are charged at the assigned counselor’s fee, plus the service fee.`
                  : `Session fee paid: ₹${booking.amount}. Future sessions are charged at the assigned counselor’s fee, plus the service fee.`}
            </p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            <Home className="w-5 h-5" /> Go to Dashboard
          </button>
        </div>
      </div>
    </PageBackground>
  );
}
