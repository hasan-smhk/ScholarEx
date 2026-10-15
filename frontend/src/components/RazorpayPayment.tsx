import { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  createPaymentOrder,
  verifyPayment,
} from '../services/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPaymentProps {
  bookingId: string;
  amount: number;
  counselorName: string;
  date: string;
  time: string;
  studentName: string;
  studentEmail: string;
  token: string;
  onSuccess: (paymentId: string) => void;
  onClose?: () => void;
  onCancel?: () => void;
}

const RazorpayPayment = ({
  bookingId,
  amount,
  counselorName,
  date,
  time,
  studentName,
  studentEmail,
  token,
  onSuccess,
  onClose,
  onCancel,
}: RazorpayPaymentProps) => {
  const closeHandler = onClose ?? onCancel ?? (() => undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const paymentInProgressRef = useRef(false);
  const verificationInProgressRef = useRef(false);
  const successHandledRef = useRef(false);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (paymentInProgressRef.current || successHandledRef.current) return;

    paymentInProgressRef.current = true;
    try {
      setLoading(true);
      setError('');

      // Step 1: Create order on backend
      const orderRes = await createPaymentOrder(bookingId, amount, token);
      const { orderId } = orderRes.data;

      // Step 2: Open Razorpay checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        order_id: orderId,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'ScholarEx',
        description: `Counselling Session with ${counselorName}`,
        prefill: {
          name: studentName,
          email: studentEmail,
        },
        handler: async (response: any) => {
          if (verificationInProgressRef.current || successHandledRef.current) return;
          verificationInProgressRef.current = true;

          // Step 3: Verify payment on backend
          try {
            await verifyPayment(
              orderId,
              response.razorpay_payment_id,
              response.razorpay_signature,
              bookingId,
              token
            );

            successHandledRef.current = true;
            onSuccess(response.razorpay_payment_id);
          } catch (err: any) {
            verificationInProgressRef.current = false;
            setError(err?.response?.data?.error || 'Payment verification failed');
          } finally {
            paymentInProgressRef.current = false;
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            if (!successHandledRef.current) {
              paymentInProgressRef.current = false;
              verificationInProgressRef.current = false;
              setLoading(false);
              setError('Payment cancelled');
            }
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response: any) => {
        paymentInProgressRef.current = false;
        verificationInProgressRef.current = false;
        setLoading(false);
        setError(response?.error?.description || 'Payment failed');
      });
      razorpay.open();
    } catch (err: any) {
      console.error(err);
      paymentInProgressRef.current = false;
      setLoading(false);
      setError(err?.response?.data?.error || 'Failed to initiate payment');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-extrabold text-gray-900">Confirm Payment</h2>
          <button
            onClick={closeHandler}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Details */}
        <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-xs text-gray-500 font-medium">Counselor</p>
            <p className="text-sm font-bold text-gray-900">{counselorName}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 font-medium">Date</p>
              <p className="text-sm font-bold text-gray-900">{date}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Time</p>
              <p className="text-sm font-bold text-gray-900">{time}</p>
            </div>
          </div>
          <div className="pt-3 border-t border-gray-200 flex justify-between">
            <p className="text-sm font-bold text-gray-600">Total Amount</p>
            <p className="text-lg font-extrabold text-indigo-600">₹{amount}</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={closeHandler}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Pay Now'
            )}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Powered by Razorpay • Secure payment
        </p>
      </div>
    </div>
  );
};

export default RazorpayPayment;
