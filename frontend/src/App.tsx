import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { getMyCounselorProfile } from './services/api';

// Pages
import HomePage from './pages/HomePage';
import CounselorListPage from './pages/CounselorListPage';
import BookingDetailsPage from './pages/BookingDetailsPage';
import BookingCompletePage from './pages/BookingCompletePage';
import MyBookingsPage from './pages/MyBookingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ComingSoonPage from './pages/ComingSoonPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminPanel from './pages/AdminPanel';
import CounselorReportPage from './pages/CounselorReportPage';
import CounselorDashboard from './pages/CounselorDashboard';
import StudentProfilePage from './pages/StudentProfilePage';
import StudentReportsPage from './pages/StudentReportsPage';
import StudentCareerAssessmentPage from './pages/StudentCareerAssessmentPage';
import StudentCareerReportPage from './pages/StudentCareerReportPage';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-center">Checking administrator session...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'ADMIN') {
    return <Navigate to={user.role === 'COUNSELOR' ? '/counselor-dashboard' : '/dashboard'} replace />;
  }
  return <>{children}</>;
}

function ProtectedCourseRoute({ children }: { children: React.ReactNode }) {
  const { user, token, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">Checking your session...</div>;
  if (!token || !user) return <Navigate to="/register" replace />;
  if (user.role !== 'STUDENT') {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/counselor-dashboard'} replace />;
  }
  return <>{children}</>;
}

function CounselorRoute({ children }: { children: React.ReactNode }) {
  const { user, token, loading, logout } = useAuth();
  const [accessState, setAccessState] = useState<'checking' | 'approved' | 'blocked' | 'error'>('checking');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!token || user?.role !== 'COUNSELOR') return;
    let active = true;
    setAccessState('checking');
    getMyCounselorProfile(token)
      .then(({ data }) => {
        if (active) setAccessState(data.approvalStatus === 'APPROVED' ? 'approved' : 'blocked');
      })
      .catch((error) => {
        if (active) setAccessState(error.response?.status === 403 ? 'blocked' : 'error');
      });
    return () => {
      active = false;
    };
  }, [token, user?.role, retryCount]);

  if (loading) return <div className="p-8 text-center">Checking counselor session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'COUNSELOR') {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
  }
  if (accessState === 'checking') return <div className="p-8 text-center">Checking counselor approval...</div>;
  if (accessState === 'blocked') {
    return (
      <main className="scholar-page flex min-h-[70vh] items-center justify-center px-5 py-12">
        <section className="scholar-panel-card max-w-lg rounded-3xl p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Application awaiting approval</h1>
          <p className="mt-3 text-slate-600">
            Counselor portal access is available after an administrator reviews and approves your application.
          </p>
          <button onClick={logout} className="mt-6 rounded-xl bg-teal-700 px-5 py-3 font-bold text-white hover:bg-teal-800">
            Sign out
          </button>
        </section>
      </main>
    );
  }
  if (accessState === 'error') {
    return (
      <main className="scholar-page flex min-h-[70vh] items-center justify-center px-5 py-12">
        <section className="scholar-panel-card max-w-lg rounded-3xl p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Could not verify counselor access</h1>
          <p className="mt-3 text-slate-600">Please check your connection and try again.</p>
          <button onClick={() => setRetryCount((current) => current + 1)} className="mt-6 rounded-xl bg-teal-700 px-5 py-3 font-bold text-white hover:bg-teal-800">
            Try again
          </button>
        </section>
      </main>
    );
  }
  return <>{children}</>;
}

function ReportAccessRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-center">Checking your session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'COUNSELOR') return <CounselorRoute>{children}</CounselorRoute>;
  if (user.role === 'STUDENT' || user.role === 'ADMIN') return <>{children}</>;
  return <Navigate to="/login" replace />;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-center">Checking your session...</div>;
  if (user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : user.role === 'COUNSELOR' ? '/counselor-dashboard' : '/'} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/student/login" element={<LoginPage />} />
        <Route path="/counselor/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/counseling" element={<ProtectedCourseRoute><StudentCareerAssessmentPage /></ProtectedCourseRoute>} />

        <Route path="/courses" element={<ProtectedCourseRoute><ComingSoonPage /></ProtectedCourseRoute>} />
        <Route path="/courses/:board" element={<ProtectedCourseRoute><ComingSoonPage /></ProtectedCourseRoute>} />
        <Route path="/course/:courseId" element={<ProtectedCourseRoute><ComingSoonPage /></ProtectedCourseRoute>} />
        <Route path="/courses/cbse" element={<ProtectedCourseRoute><ComingSoonPage /></ProtectedCourseRoute>} />
        <Route path="/courses/icse" element={<ProtectedCourseRoute><ComingSoonPage /></ProtectedCourseRoute>} />
        <Route path="/courses/state" element={<ProtectedCourseRoute><ComingSoonPage /></ProtectedCourseRoute>} />
        <Route path="/skills" element={<ProtectedCourseRoute><ComingSoonPage /></ProtectedCourseRoute>} />

        {/* Counseling Booking Flow */}
        <Route path="/counselors" element={<ProtectedCourseRoute><CounselorListPage /></ProtectedCourseRoute>} />
        <Route path="/slot-booking/:counselorId" element={<Navigate to="/counselors" replace />} />
        <Route path="/booking/:bookingId" element={<ProtectedCourseRoute><BookingDetailsPage /></ProtectedCourseRoute>} />
        <Route path="/booking/:bookingId/complete" element={<ProtectedCourseRoute><BookingCompletePage /></ProtectedCourseRoute>} />
        <Route path="/booking/:bookingId/report" element={<ReportAccessRoute><CounselorReportPage /></ReportAccessRoute>} />
        <Route path="/my-career-report" element={<ProtectedCourseRoute><StudentCareerReportPage /></ProtectedCourseRoute>} />
        <Route path="/counselor-dashboard" element={<CounselorRoute><CounselorDashboard /></CounselorRoute>} />

        <Route element={<ProtectedRoute />}>
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/profile" element={<StudentProfilePage />} />
          <Route path="/my-reports" element={<StudentReportsPage />} />
        </Route>
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
      </Routes>
    </Router>
  );
}
