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
import CoursesPage from './pages/CoursesPage';
import CBSEPage from './pages/CBSEPage';
import ICSEPage from './pages/ICSEPage';
import StateBoardPage from './pages/StateBoardPage';
import CourseDetailPage from './pages/CourseDetailPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminPanel from './pages/AdminPanel';
import CounselorReportPage from './pages/CounselorReportPage';
import CounselorDashboard from './pages/CounselorDashboard';
import SkillDevelopmentPage from './pages/SkillDevelopmentPage';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-center">Checking administrator session...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function ProtectedCourseRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/register" replace />;
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
  if (user.role !== 'COUNSELOR') return <Navigate to="/dashboard" replace />;
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
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/counseling" element={<ProtectedCourseRoute><CounselorListPage /></ProtectedCourseRoute>} />

        <Route path="/courses" element={<ProtectedCourseRoute><CoursesPage /></ProtectedCourseRoute>} />
        <Route path="/courses/:board" element={<ProtectedCourseRoute><CoursesPage /></ProtectedCourseRoute>} />
        <Route path="/course/:courseId" element={<ProtectedCourseRoute><CourseDetailPage /></ProtectedCourseRoute>} />
        <Route path="/courses/cbse" element={<ProtectedCourseRoute><CBSEPage /></ProtectedCourseRoute>} />
        <Route path="/courses/icse" element={<ProtectedCourseRoute><ICSEPage /></ProtectedCourseRoute>} />
        <Route path="/courses/state" element={<ProtectedCourseRoute><StateBoardPage /></ProtectedCourseRoute>} />
        <Route path="/skills" element={<ProtectedCourseRoute><SkillDevelopmentPage /></ProtectedCourseRoute>} />

        {/* Counseling Booking Flow */}
        <Route path="/counselors" element={<ProtectedCourseRoute><CounselorListPage /></ProtectedCourseRoute>} />
        <Route path="/slot-booking/:counselorId" element={<Navigate to="/counselors" replace />} />
        <Route path="/booking/:bookingId" element={<ProtectedCourseRoute><BookingDetailsPage /></ProtectedCourseRoute>} />
        <Route path="/booking/:bookingId/complete" element={<ProtectedCourseRoute><BookingCompletePage /></ProtectedCourseRoute>} />
        <Route path="/booking/:bookingId/report" element={<ProtectedCourseRoute><CounselorReportPage /></ProtectedCourseRoute>} />
        <Route path="/counselor-dashboard" element={<CounselorRoute><CounselorDashboard /></CounselorRoute>} />

        <Route element={<ProtectedRoute />}>
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/dashboard" element={<StudentDashboard />} />
        </Route>
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
      </Routes>
    </Router>
  );
}
