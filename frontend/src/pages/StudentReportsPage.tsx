import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyReports } from '../services/api';

interface StudentReport {
  id: string;
  bookingId: string;
  strengths: string | null;
  areasOfImprovement: string | null;
  recommendations: string | null;
  nextSteps: string | null;
  createdAt: string;
  booking: {
    id: string;
    slot: {
      date: string;
      startTime: string;
      endTime: string;
      counselor: {
        name: string;
        specialization: string;
      };
    };
  };
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export default function StudentReportsPage() {
  const { user, token } = useAuth();
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!token || user?.role !== 'STUDENT') return;
    let active = true;

    getMyReports(token)
      .then(({ data }) => {
        if (active) setReports(data);
      })
      .catch(() => {
        if (active) setError('Could not load your reports. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, user?.role, retryCount]);

  if (user?.role !== 'STUDENT') return <Navigate to="/dashboard" replace />;

  return (
    <main className="scholar-page min-h-screen px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-2 font-semibold text-teal-800 hover:text-teal-600">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <header className="mb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-teal-700">Student portal</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">My reports</h1>
          <p className="mt-2 text-slate-600">
            Reports prepared by counselors or administrators are shown here once approved for viewing.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20" role="status" aria-label="Loading reports">
            <Loader2 className="h-10 w-10 animate-spin text-teal-700" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
            <button
              type="button"
              onClick={() => {
                setError('');
                setLoading(true);
                setRetryCount((count) => count + 1);
              }}
              className="mt-4 rounded-xl bg-red-700 px-4 py-2 font-bold text-white hover:bg-red-800"
            >
              Try again
            </button>
          </div>
        ) : reports.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <FileText className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">No reports available yet</h2>
            <p className="mt-2 text-slate-600">
              Approved reports from your counseling sessions will appear here.
            </p>
          </section>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => (
              <article key={report.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <p className="text-sm font-semibold text-teal-700">Approved session report</p>
                    <h2 className="mt-1 text-xl font-black text-slate-900">
                      {report.booking.slot.counselor.name}
                    </h2>
                    <p className="text-sm text-slate-600">{report.booking.slot.counselor.specialization}</p>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>{formatDate(report.booking.slot.date)}</p>
                    <p>{report.booking.slot.startTime} – {report.booking.slot.endTime}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {[
                    ['Strengths', report.strengths],
                    ['Areas of improvement', report.areasOfImprovement],
                    ['Recommendations', report.recommendations],
                    ['Next steps', report.nextSteps],
                  ].map(([label, content]) => content && (
                    <section key={label} className="rounded-2xl bg-slate-50 p-5">
                      <h3 className="font-bold text-slate-900">{label}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{content}</p>
                    </section>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                  <span>Published {formatDate(report.createdAt)}</span>
                  <Link
                    to={`/booking/${report.bookingId}/report`}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 font-bold text-white hover:bg-teal-800"
                  >
                    <FileText className="h-4 w-4" />
                    Open full report
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
