import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CreditCard, Loader2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createBooking } from '../services/api';

interface Counselor {
  id: string;
  name: string;
  specialization: string;
  sessionFee?: number;
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
  const submitInProgress = useRef(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || submitInProgress.current) return;
    submitInProgress.current = true;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await createBooking({ preferredCounselorId: counselor.id }, token);
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
            <p className="font-bold text-slate-900">Monday–Friday, 5:00 PM–8:00 PM IST</p>
            <p className="text-xs text-slate-600">The earliest suitable open slot will be reserved for payment.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
        <div className="flex items-start gap-3">
          <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />
          <div>
            <h3 className="font-bold text-indigo-950">Payment is required to confirm</h3>
            <p className="mt-1 text-sm leading-6 text-indigo-900">
              Your student report details will be shared with the counselor. Review the session fee and complete payment on the next screen. Your meeting link will be emailed after payment is confirmed.
            </p>
            {typeof counselor.sessionFee === 'number' && (
              <p className="mt-2 text-sm font-black text-indigo-950">
                Session fee: ₹{counselor.sessionFee.toLocaleString('en-IN')}
              </p>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-4 font-bold text-white hover:bg-indigo-800 disabled:cursor-wait disabled:opacity-60"
      >
        {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Reserving a slot…</> : 'Continue to payment'}
      </button>
    </form>
  );
}
