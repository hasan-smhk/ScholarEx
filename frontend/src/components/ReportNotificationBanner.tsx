import { useState, useEffect } from 'react';
import { AlertCircle, X, CheckCircle } from 'lucide-react';

interface ReportNotificationBannerProps {
  show: boolean;
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

const ReportNotificationBanner = ({
  show,
  type,
  message,
  onClose,
}: ReportNotificationBannerProps) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const bgColor = type === 'success' ? 'bg-emerald-50' : 'bg-red-50';
  const borderColor = type === 'success' ? 'border-emerald-200' : 'border-red-200';
  const textColor = type === 'success' ? 'text-emerald-800' : 'text-red-800';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`fixed top-4 right-4 max-w-md ${bgColor} border ${borderColor} rounded-lg p-4 shadow-lg z-50`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${type === 'success' ? 'text-emerald-600' : 'text-red-600'} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColor}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`text-gray-400 hover:text-gray-600 flex-shrink-0`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ReportNotificationBanner;
