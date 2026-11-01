import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CalendarDays, GraduationCap, Loader2, RefreshCw, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/api';

interface SubjectAssessment {
  subject: string;
  overall: string;
  comments: string;
}

interface StudentBooking {
  id: string;
  marksPercentage: number | null;
  meetingLink: string | null;
  studentName: string | null;
  studentAge: number | null;
  schoolCollege: string | null;
  phoneNo: string | null;
  emailId: string | null;
  address: string | null;
  educationBackground: string | null;
  currentStream: string | null;
  careerAspiration: string | null;
  areasOfInterest: string | null;
  subjectPreferences: string | null;
  hobbies: string | null;
  fatherName: string | null;
  fatherAge: number | null;
  fatherOcuupation: string | null;
  fatherEducation: string | null;
  motherName: string | null;
  motherAge: number | null;
  motherOcuupation: string | null;
  motherEducation: string | null;
  AnnualfamilyIncome: number | null;
  familyType: string | null;
  subjectAssessments: SubjectAssessment[] | null;
  createdAt: string;
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

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const bookingFields: { label: string; key: keyof StudentBooking }[] = [
  { label: 'Student name', key: 'studentName' },
  { label: 'Age', key: 'studentAge' },
  { label: 'School / college', key: 'schoolCollege' },
  { label: 'Email address', key: 'emailId' },
  { label: 'Phone number', key: 'phoneNo' },
  { label: 'Address', key: 'address' },
  { label: 'Education background', key: 'educationBackground' },
  { label: 'Current stream', key: 'currentStream' },
  { label: 'Career aspiration', key: 'careerAspiration' },
  { label: 'Areas of interest', key: 'areasOfInterest' },
  { label: 'Subject preferences', key: 'subjectPreferences' },
  { label: 'Hobbies', key: 'hobbies' },
  { label: 'Family type', key: 'familyType' },
  { label: 'Father / guardian name', key: 'fatherName' },
  { label: 'Father / guardian age', key: 'fatherAge' },
  { label: 'Father / guardian occupation', key: 'fatherOcuupation' },
  { label: 'Father / guardian education', key: 'fatherEducation' },
  { label: 'Mother / guardian name', key: 'motherName' },
  { label: 'Mother / guardian age', key: 'motherAge' },
  { label: 'Mother / guardian occupation', key: 'motherOcuupation' },
  { label: 'Mother / guardian education', key: 'motherEducation' },
  { label: 'Annual family income', key: 'AnnualfamilyIncome' },
];

export default function StudentProfilePage() {
  const { user, token } = useAuth();
  const [bookings, setBookings] = useState<StudentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!token || user?.role !== 'STUDENT') return;
    let active = true;

    getMyBookings(token)
      .then(({ data }) => {
        if (active) setBookings(data);
      })
      .catch(() => {
        if (active) setError('Could not load your profile and booking details. Please try again.');
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

        <header className="mb-8 rounded-3xl bg-[#0b3943] p-8 text-white shadow-lg">
          <p className="text-sm font-bold uppercase tracking-widest text-teal-200">Student profile</p>
          <h1 className="mt-2 text-3xl font-black">{user.name}</h1>
          <p className="mt-1 text-teal-100">{user.email}</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20" role="status" aria-label="Loading profile">
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
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 font-bold text-white hover:bg-red-800"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <CalendarDays className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">No booking details yet</h2>
            <p className="mt-2 text-slate-600">Information from your counseling bookings will appear here.</p>
            <Link to="/counseling" className="mt-5 inline-block rounded-xl bg-teal-700 px-5 py-3 font-bold text-white hover:bg-teal-800">
              Book a session
            </Link>
          </section>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const fields = bookingFields
                .map(({ label, key }) => ({ label, value: booking[key] }))
                .filter(({ value }) => value !== null && value !== undefined && value !== '');
              const performancePercentage =
                booking.marksPercentage ?? (booking.id === bookings[0].id ? user?.marksPercentage : null);

              return (
                <article key={booking.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-6 sm:p-8">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wider text-teal-700">Counseling session</p>
                      <h2 className="mt-1 text-xl font-black text-slate-900">{booking.slot.counselor.name}</h2>
                      <p className="text-sm text-slate-600">{booking.slot.counselor.specialization}</p>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>{formatDate(booking.slot.date)}</p>
                      <p>{booking.slot.startTime} – {booking.slot.endTime}</p>
                    </div>
                  </header>

                  <div className="grid gap-6 p-6 sm:p-8">
                    <section>
                      <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                        <GraduationCap className="h-5 w-5 text-teal-700" />
                        Student performance
                      </h3>
                      <div className="mt-4 rounded-2xl bg-teal-50 p-5">
                        <p className="text-sm font-semibold text-teal-800">Marks percentage provided</p>
                        <p className="mt-1 text-3xl font-black text-teal-950">
                          {performancePercentage == null ? 'Not provided' : `${performancePercentage}%`}
                        </p>
                        {Array.isArray(booking.subjectAssessments) && booking.subjectAssessments.length > 0 && (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {booking.subjectAssessments.map((assessment, index) => (
                              <div key={`${assessment.subject}-${index}`} className="rounded-xl bg-white p-4">
                                <p className="font-bold text-slate-900">{assessment.subject}</p>
                                <p className="mt-1 text-sm text-slate-700">{assessment.overall}</p>
                                {assessment.comments && <p className="mt-1 text-sm text-slate-600">{assessment.comments}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-bold text-slate-900">Information provided during booking</h3>
                      {fields.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-600">No additional booking information was provided.</p>
                      ) : (
                        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                          {fields.map(({ label, value }) => (
                            <div key={label} className="rounded-xl bg-slate-50 p-4">
                              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
                              <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-900">
                                {label === 'Annual family income' ? `₹${Number(value).toLocaleString('en-IN')}` : String(value)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </section>

                    <section className="rounded-2xl border border-slate-200 p-5">
                      <h3 className="flex items-center gap-2 font-bold text-slate-900">
                        <Video className="h-5 w-5 text-teal-700" />
                        Counselor meeting link
                      </h3>
                      {booking.meetingLink ? (
                        <a
                          href={booking.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex rounded-xl bg-teal-700 px-4 py-2.5 font-bold text-white hover:bg-teal-800"
                        >
                          Join meeting
                        </a>
                      ) : (
                        <p className="mt-2 text-sm text-slate-600">
                          The counselor has not shared a meeting link for this session yet.
                        </p>
                      )}
                    </section>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
