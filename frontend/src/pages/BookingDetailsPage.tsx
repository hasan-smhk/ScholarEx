import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getBookingById,
  resendPaymentConfirmationEmails,
  submitBookingDetails,
  recoverBookingPayment,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import PageBackground from '../components/PageBackground';
import { 
  Loader2, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  IndianRupee, 
  Gift, 
  CheckCircle2,
  AlertCircle,
  CreditCard,
  User,
  BookOpen,
  Sparkles,
  FileText,
  RefreshCw
} from 'lucide-react';
import RazorpayPayment from '../components/RazorpayPayment';

interface Booking {
  id: string;
  isFreeSession: boolean;
  paymentStatus: string;
  cancellationStatus: string;
  cancellationReviewNote: string | null;
  cancelledAt: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  studentPaymentEmailSentAt: string | null;
  counselorPaymentEmailSentAt: string | null;
  amount: number;
  educationBackground: string;
  currentStream: string;
  careerAspiration: string;
  areasOfInterest: string;
  subjectPreferences: string;
  hobbies: string;
  slot: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    counselor: {
      name: string;
      specialization: string;
    };
  };
}

export default function BookingDetailsPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    educationBackground: '',
    currentStream: '',
    careerAspiration: '',
    areasOfInterest: '',
    subjectPreferences: '',
    hobbies: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'payment' | 'complete'>('form');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentEmailNotifications, setPaymentEmailNotifications] = useState<{
    studentSent: boolean;
    counselorSent: boolean;
  } | null>(null);
  const [retryingPaymentEmails, setRetryingPaymentEmails] = useState(false);
  const [paymentEmailError, setPaymentEmailError] = useState('');
  const [recoveringPayment, setRecoveringPayment] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const formSubmitRef = useRef(false);
  const paymentSuccessRef = useRef(false);

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId || !token) {
        setError('Invalid booking session');
        setLoading(false);
        return;
      }
      
      try {
        const response = await getBookingById(bookingId, token);
        if (response.data.cancelledAt) {
          setError('This booking has been cancelled. Check My Bookings for its cancellation and refund status.');
          return;
        }
        let bookingData = response.data;
        let recoveredEmailNotifications: {
          studentSent: boolean;
          counselorSent: boolean;
        } | null = null;
        if (!bookingData.isFreeSession && bookingData.paymentStatus === 'PENDING') {
          try {
            const recoveryRes = await recoverBookingPayment(bookingId, token);
            if (recoveryRes.data?.recovered && recoveryRes.data?.booking) {
              bookingData = recoveryRes.data.booking;
              if (recoveryRes.data.emailNotifications) {
                recoveredEmailNotifications = recoveryRes.data.emailNotifications;
              }
            }
          } catch (recErr) {
            console.warn('Initial payment recovery check error:', recErr);
          }
        }
        setBooking(bookingData);
        if (!bookingData.isFreeSession && bookingData.paymentStatus === 'PAID') {
          setPaymentEmailNotifications(
            recoveredEmailNotifications || {
              studentSent: Boolean(bookingData.studentPaymentEmailSentAt),
              counselorSent: Boolean(bookingData.counselorPaymentEmailSentAt),
            }
          );
        }
        if (bookingData.isFreeSession || bookingData.paymentStatus === 'PAID') {
          setStep('complete');
        } else if (
          response.data.educationBackground &&
          response.data.currentStream &&
          response.data.careerAspiration
        ) {
          setStep('payment');
        }
        setFormData({
          educationBackground: response.data.educationBackground || '',
          currentStream: response.data.currentStream || '',
          careerAspiration: response.data.careerAspiration || '',
          areasOfInterest: response.data.areasOfInterest || '',
          subjectPreferences: response.data.subjectPreferences || '',
          hobbies: response.data.hobbies || '',
        });
      } catch (err) {
        setError('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    }
    loadBooking();
  }, [bookingId, token]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleManualRecovery = async () => {
    if (!bookingId || !token || recoveringPayment) return;
    try {
      setRecoveringPayment(true);
      setRecoveryMessage('');
      const res = await recoverBookingPayment(bookingId, token);
      if (res.data?.recovered && res.data?.booking) {
        setBooking(res.data.booking);
        setStep('complete');
        if (res.data.emailNotifications) {
          setPaymentEmailNotifications(res.data.emailNotifications);
        }
        setRecoveryMessage('Payment verified and confirmed from Razorpay!');
      } else {
        setRecoveryMessage(res.data?.message || 'No completed payment found on Razorpay for this session.');
      }
    } catch (err: any) {
      const reference = err?.response?.data?.paymentReference;
      setRecoveryMessage(
        (err?.response?.data?.error || 'Could not verify payment status with Razorpay.') +
        (reference?.bookingId ? ` Booking reference: ${reference.bookingId}.` : '') +
        (reference?.paymentId ? ` Razorpay payment reference: ${reference.paymentId}.` : '') +
        (reference?.orderId ? ` Razorpay order reference: ${reference.orderId}.` : '')
      );
    } finally {
      setRecoveringPayment(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !token || formSubmitRef.current) return;
    
    formSubmitRef.current = true;
    setSubmitting(true);
    try {
      await submitBookingDetails(bookingId, formData, token);
      
      if (booking?.isFreeSession) {
        setStep('complete');
      } else {
        setStep('payment');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save details');
    } finally {
      formSubmitRef.current = false;
      setSubmitting(false);
    }
  };

  async function retryPaymentConfirmationEmails() {
    if (!bookingId || !token || retryingPaymentEmails) return;
    setRetryingPaymentEmails(true);
    setPaymentEmailError('');
    try {
      const response = await resendPaymentConfirmationEmails(bookingId, token);
      setPaymentEmailNotifications(response.data.emailNotifications);
    } catch (err: any) {
      if (err.response?.data?.emailNotifications) {
        setPaymentEmailNotifications(err.response.data.emailNotifications);
      }
      setPaymentEmailError(err.response?.data?.error || 'Could not resend the payment confirmation emails.');
    } finally {
      setRetryingPaymentEmails(false);
    }
  }

  if (loading) {
    return (
      <PageBackground theme="booking" className="flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-teal-300" />
      </PageBackground>
    );
  }

  if (error) {
    return (
      <PageBackground theme="booking" className="flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-[24px] p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Oops!</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/counseling')}
            className="mt-6 bg-red-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-red-700 transition-colors"
          >
            Back to Counseling
          </button>
        </div>
      </PageBackground>
    );
  }

  if (!booking) {
    return (
      <PageBackground theme="booking" className="flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Booking not found</h2>
          <button
            onClick={() => navigate('/counseling')}
            className="rounded-2xl bg-[#0b3943] px-6 py-3 font-bold text-white transition-colors hover:bg-[#0d4a55]"
          >
            Back to Counseling
          </button>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground theme="booking" className="pb-16">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#071b24] via-[#0b3943] to-[#0c3440] py-12 text-white">
        <div className="max-w-4xl mx-auto px-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 font-medium text-teal-100 transition-colors hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              {step === 'form' && <FileText className="w-5 h-5" />}
              {step === 'payment' && <CreditCard className="w-5 h-5" />}
              {step === 'complete' && <CheckCircle2 className="w-5 h-5" />}
            </div>
            <span className="text-teal-100 font-medium text-sm uppercase tracking-wider">
              Step {step === 'form' ? '1' : step === 'payment' ? '2' : '3'} of 3
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black">
            {step === 'form' && 'Pre-Session Questionnaire'}
            {step === 'payment' && 'Complete Payment'}
            {step === 'complete' && 'Booking Confirmed!'}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8">
        {/* Progress Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between relative">
            <div 
              className={`flex-1 flex items-center gap-3 ${step !== 'form' ? 'opacity-50' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step === 'form' ? 'bg-teal-700 text-white' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {step !== 'form' ? <CheckCircle2 className="w-5 h-5" /> : '1'}
              </div>
              <span className="hidden md:block font-bold text-sm">Details</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-4 rounded-full">
              <div className={`h-full rounded-full bg-emerald-500 transition-all ${
                step === 'payment' || step === 'complete' ? 'w-full' : 'w-0'
              }`} />
            </div>
            <div 
              className={`flex-1 flex items-center gap-3 justify-end relative ${
                step === 'form' ? 'opacity-50' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step === 'payment' ? 'bg-teal-700 text-white' :
                step === 'complete' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {step === 'complete' ? <CheckCircle2 className="w-5 h-5" /> : '2'}
              </div>
              <span className="hidden md:block font-bold text-sm">Payment</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-4 rounded-full">
              <div className={`h-full rounded-full bg-emerald-500 transition-all ${
                step === 'complete' ? 'w-full' : 'w-0'
              }`} />
            </div>
            <div 
              className={`flex-1 flex items-center gap-3 justify-end ${step !== 'complete' ? 'opacity-50' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step === 'complete' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {step === 'complete' ? <CheckCircle2 className="w-5 h-5" /> : '3'}
              </div>
              <span className="hidden md:block font-bold text-sm">Confirmed</span>
            </div>
          </div>
        </div>

        {/* Session Info Card (always visible) */}
        <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-700" />
            Session Information
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100">
                  <User className="h-6 w-6 text-teal-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Counselor</p>
                  <p className="font-bold text-gray-900">{booking.slot.counselor.name}</p>
                  <p className="text-sm text-teal-700">{booking.slot.counselor.specialization}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-bold text-gray-900">
                    {new Date(booking.slot.date).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-bold text-gray-900">
                    {booking.slot.startTime} - {booking.slot.endTime}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  booking.isFreeSession ? 'bg-green-100' : 'bg-teal-100'
                }`}>
                  {booking.isFreeSession ? (
                    <Gift className="w-6 h-6 text-green-600" />
                  ) : (
                    <IndianRupee className="w-6 h-6 text-teal-700" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className={`font-bold ${booking.isFreeSession ? 'text-green-600' : 'text-gray-900'}`}>
                    {booking.isFreeSession ? (
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        Free Session
                      </span>
                    ) : (
                      `₹${booking.amount}`
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Questionnaire Form */}
        {step === 'form' && (
          <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Pre-Counseling Questionnaire</h2>
            <p className="text-gray-500 mb-8">Help us understand your background to provide personalized guidance.</p>

            <form onSubmit={handleSubmitForm} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Educational Background
                  </label>
                  <input
                    type="text"
                    name="educationBackground"
                    value={formData.educationBackground}
                    onChange={handleFormChange}
                    placeholder="e.g., CBSE 12th Science"
                    required
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition-all focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Current Stream / Field
                  </label>
                  <input
                    type="text"
                    name="currentStream"
                    value={formData.currentStream}
                    onChange={handleFormChange}
                    placeholder="e.g., Engineering, Commerce"
                    required
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition-all focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Career Aspirations
                </label>
                <textarea
                  name="careerAspiration"
                  value={formData.careerAspiration}
                  onChange={handleFormChange}
                  placeholder="What is your desired career path? What are your long-term goals?"
                  required
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 outline-none transition-all focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Areas of Interest
                  </label>
                  <input
                    type="text"
                    name="areasOfInterest"
                    value={formData.areasOfInterest}
                    onChange={handleFormChange}
                    placeholder="e.g., Technology, Medicine, Business"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition-all focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Subject Preferences
                  </label>
                  <input
                    type="text"
                    name="subjectPreferences"
                    value={formData.subjectPreferences}
                    onChange={handleFormChange}
                    placeholder="e.g., Mathematics, Physics, History"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition-all focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Hobbies & Personal Interests
                </label>
                <textarea
                  name="hobbies"
                  value={formData.hobbies}
                  onChange={handleFormChange}
                  placeholder="Tell us about your interests, hobbies, and extracurricular activities"
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 outline-none transition-all focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-2xl bg-[#0b3943] py-4 font-bold text-white transition-all hover:bg-[#0d4a55] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save & Continue
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-8 py-4 rounded-2xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 'payment' && (
          <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Payment Required</h2>
            <p className="text-gray-500 mb-8">
              Complete the payment to confirm your counseling session
            </p>
            <p className="mb-6 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900">
              Your slot is reserved for 60 minutes from booking. Complete payment before the reservation expires.
            </p>

            <div className="bg-amber-50 rounded-2xl p-6 mb-8 max-w-sm mx-auto">
              <p className="text-sm text-amber-600 font-semibold mb-1">Amount to Pay</p>
              <p className="text-4xl font-black text-gray-900">₹{booking.amount}</p>
            </div>
            {recoveryMessage && (
              <div className="mx-auto my-6 max-w-md rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm font-medium text-teal-900">
                {recoveryMessage}
              </div>
            )}
            {booking.paymentStatus === 'FAILED' ? (
              <div role="alert" className="my-6 max-w-md mx-auto rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
                <p className="font-bold">This reservation has expired or its payment failed.</p>
                <p className="mt-1">Do not retry payment for this reservation. Contact support before paying again.</p>
                <p className="mt-2">Booking reference: {booking.id}</p>
                {booking.razorpayPaymentId && <p>Razorpay payment reference: {booking.razorpayPaymentId}</p>}
                {booking.razorpayOrderId && <p>Razorpay order reference: {booking.razorpayOrderId}</p>}
                <Link to="/counseling" className="mt-3 inline-block font-bold underline">
                  Choose another session
                </Link>
              </div>
            ) : (
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowPayment(true)}
                className="flex items-center gap-2 rounded-2xl bg-[#0b3943] px-8 py-4 font-bold text-white transition-all hover:bg-[#0d4a55]"
              >
                <CreditCard className="w-5 h-5" />
                Pay with Razorpay
              </button>
              <button
                type="button"
                onClick={handleManualRecovery}
                disabled={recoveringPayment}
                className="flex items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50 px-6 py-4 font-bold text-teal-800 transition-all hover:bg-teal-100 disabled:opacity-50"
              >
                {recoveringPayment ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                {recoveringPayment ? 'Checking Razorpay...' : 'Already Paid? Check Status'}
              </button>
              <button
                onClick={() => setStep('form')}
                className="px-8 py-4 rounded-2xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
            </div>
            )}
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 'complete' && (
          <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-500 mb-8">
              Your counseling session has been scheduled. Check your email for details.
            </p>
            {paymentEmailNotifications &&
              (!paymentEmailNotifications.studentSent || !paymentEmailNotifications.counselorSent) && (
                <div role="status" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
                  <p>
                    Payment is confirmed, but the confirmation email{paymentEmailNotifications.studentSent && paymentEmailNotifications.counselorSent ? '' : 's'} could not be delivered
                    {!paymentEmailNotifications.studentSent && !paymentEmailNotifications.counselorSent ? ' to you or your counselor' :
                      !paymentEmailNotifications.studentSent ? ' to you' : ' to your counselor'}.
                  </p>
                  {paymentEmailError && <p className="mt-2">{paymentEmailError}</p>}
                  <button
                    type="button"
                    onClick={retryPaymentConfirmationEmails}
                    disabled={retryingPaymentEmails}
                    className="mt-3 rounded-lg border border-amber-300 px-3 py-2 font-bold disabled:opacity-50"
                  >
                    {retryingPaymentEmails ? 'Retrying...' : 'Retry confirmation email'}
                  </button>
                </div>
              )}

            <div className="bg-emerald-50 rounded-2xl p-6 mb-8 max-w-md mx-auto text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Session Date</p>
                  <p className="font-bold text-gray-900">
                    {new Date(booking.slot.date).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-bold text-gray-900">{booking.slot.startTime}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to="/dashboard"
                className="rounded-2xl bg-[#0b3943] px-8 py-4 font-bold text-white transition-all hover:bg-[#0d4a55]"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/counseling"
                className="px-8 py-4 rounded-2xl font-bold text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
              >
                Book Another Session
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Razorpay Modal */}
      {showPayment && !booking.isFreeSession && (
        <RazorpayPayment
          bookingId={bookingId!}
          amount={booking.amount}
          counselorName={booking.slot.counselor.name}
          date={new Date(booking.slot.date).toLocaleDateString()}
          time={`${booking.slot.startTime} - ${booking.slot.endTime}`}
          studentName={user?.name || ''}
          studentEmail={user?.email || ''}
          token={token!}
          onSuccess={(_paymentId, emailNotifications) => {
            if (paymentSuccessRef.current) return;
            paymentSuccessRef.current = true;
            setPaymentEmailNotifications(emailNotifications || null);
            setShowPayment(false);
            setStep('complete');
          }}
          onClose={() => setShowPayment(false)}
        />
      )}
    </PageBackground>
  );
}
