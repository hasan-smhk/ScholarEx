import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CreditCard, Loader2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createBooking } from '../services/api';
import { formatSlotDate } from '../utils/slotDate';

interface Counselor {
  id: string;
  name: string;
  specialization: string;
  sessionFee?: number;
  serviceFee?: number;
  slots: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
  }>;
}

interface Props {
  counselor: Counselor;
  onClose: () => void;
}

export default function PaidBookingForm({ counselor, onClose }: Props) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [preferredSlotId, setPreferredSlotId] = useState('');
  const submitInProgress = useRef(false);

  const availableSlots = counselor.slots
    .slice()
    .sort((left, right) =>
      left.date.localeCompare(right.date) || left.startTime.localeCompare(right.startTime)
    );

  const formatTime = (value: string) => {
    const [hour, minute] = value.split(':').map(Number);
    return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || submitInProgress.current) return;
    if (!preferredSlotId) {
      setError('Choose your preferred session time to continue.');
      return;
    }
    submitInProgress.current = true;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await createBooking({
        preferredCounselorId: counselor.id,
        preferredSlotId,
      }, token);
      onClose();
      navigate(`/booking/${data.id}`);
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.error ||
        'Could not reserve a counseling slot. Please try again.'
      );
    } finally {
      submitInProgress.current = false;
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-slate-900">
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      <div className="rounded-2xl bg-teal-50 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-800"><User className="h-5 w-5" /></span>
          <div>
            <p className="text-xs text-slate-500">Selected counselor</p>
            <p className="font-bold text-slate-900">{counselor.name}</p>
            <p className="text-sm text-teal-800">{counselor.specialization}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-700"><Calendar className="h-5 w-5" /></span>
          <div>
            <p className="text-xs text-slate-500">Available counseling hours</p>
            <p className="font-bold text-slate-900">Monday–Friday, 2:00 PM–8:00 PM IST</p>
            <p className="text-xs text-slate-600">Choose a time from this counselor's available slots.</p>
          </div>
        </div>
      </div>

      <label className="block text-sm font-semibold text-slate-700">
        Preferred session time
        <select
          required
          value={preferredSlotId}
          onChange={(event) => setPreferredSlotId(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
        >
          <option value="">Select an available date and time</option>
          {availableSlots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {formatSlotDate(slot.date, 'en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })} · {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
        <div className="flex items-start gap-3">
          <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />
          <div>
            <h3 className="font-bold text-indigo-950">Payment is required to confirm</h3>
            <p className="mt-1 text-sm leading-6 text-indigo-900">
              Your student report details will be shared with the counselor. Review the fee breakdown and complete payment on the next screen. Your meeting link will be emailed after payment is confirmed.
            </p>
            {typeof counselor.sessionFee === 'number' && (
              <div className="mt-2 space-y-1 text-sm text-indigo-950">
                <p>Session fee: ₹{counselor.sessionFee.toLocaleString('en-IN')}</p>
                <p>Service fee: ₹{(counselor.serviceFee ?? 0).toLocaleString('en-IN')}</p>
                <p className="font-black">
                  Total: ₹{(counselor.sessionFee + (counselor.serviceFee ?? 0)).toLocaleString('en-IN')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || availableSlots.length === 0}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-4 font-bold text-white hover:bg-indigo-800 disabled:cursor-wait disabled:opacity-60"
      >
        {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Reserving your slot…</> : 'Continue to payment'}
      </button>
      {availableSlots.length === 0 && (
        <p className="text-sm text-amber-800" role="status">
          This counselor has no available slots right now. Please choose another counselor or check back later.
        </p>
      )}
    </form>
  );
}
