import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  User, 
  Clock, 
  Users, 
  CheckCircle2, 
  PlayCircle, 
  Star,
  Award,
  Download,
  Loader2
} from 'lucide-react';
import { getCourseById, enrollInCourse } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Course {
  id: string;
  title: string;
  board: string;
  level: string;
  instructor: string;
  description?: string | null;
  price: number;
  duration?: string;
  lessonsCount?: number;
  studentsEnrolled?: number;
  rating?: number;
  instructorBio?: string;
  learningOutcomes?: string[];
}

const BOARD_STYLES: Record<string, { bg: string; text: string; accent: string }> = {
  CBSE: { bg: 'bg-indigo-50', text: 'text-indigo-600', accent: 'bg-indigo-500' },
  ICSE: { bg: 'bg-emerald-50', text: 'text-emerald-600', accent: 'bg-emerald-500' },
  STATE: { bg: 'bg-amber-50', text: 'text-amber-600', accent: 'bg-amber-500' },
};

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    
    setLoading(true);
    getCourseById(courseId)
      .then(({ data }) => {
        setCourse(data);
        // Check if user is already enrolled (would normally come from API)
        setEnrolled(false);
      })
      .catch(() => setError('Could not load this course. Please try again.'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleEnroll = async () => {
    if (!user || !token) {
      navigate('/login', { state: { from: { pathname: `/course/${courseId}` } } });
      return;
    }

    try {
      setEnrolling(true);
      await enrollInCourse(courseId!, token);
      setEnrolled(true);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Enrollment failed. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="scholar-page min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading course...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="scholar-page min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-red-50 border border-red-200 rounded-[32px] p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <Link 
              to="/courses"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const boardStyle = BOARD_STYLES[course.board] || BOARD_STYLES.CBSE;
  
  // Default learning outcomes if not provided
  const outcomes = course.learningOutcomes || [
    'Master core concepts with expert guidance',
    'Practice with board-exam style questions',
    'Track your progress with regular assessments',
    'Get your doubts clarified anytime',
  ];

  return (
    <div className="scholar-page min-h-screen">
      {/* Breadcrumb & Back */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to courses
        </button>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="scholar-panel-card bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden">
          <div className="grid lg:grid-cols-3">
            {/* Left: Course Info */}
            <div className="lg:col-span-2 p-8 lg:p-12">
              {/* Board & Level Badge */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className={`px-4 py-2 rounded-xl font-bold text-sm ${boardStyle.bg} ${boardStyle.text}`}>
                  {course.board}
                </span>
                <span className="px-4 py-2 rounded-xl font-bold text-sm bg-gray-100 text-gray-600">
                  {course.level}
                </span>
                {course.rating && (
                  <span className="flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm bg-amber-50 text-amber-600">
                    <Star className="w-4 h-4 fill-current" />
                    {course.rating}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4 leading-tight">
                {course.title}
              </h1>

              {/* Description */}
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                {course.description || 'Comprehensive course designed by expert instructors to help you excel in your board exams.'}
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-6 text-gray-500 mb-8">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <span className="font-medium">{course.instructor}</span>
                </div>
                {course.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">{course.duration}</span>
                  </div>
                )}
                {course.lessonsCount && (
                  <div className="flex items-center gap-2">
                    <PlayCircle className="w-5 h-5" />
                    <span className="font-medium">{course.lessonsCount} lessons</span>
                  </div>
                )}
                {course.studentsEnrolled && (
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">{course.studentsEnrolled.toLocaleString()} students</span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center gap-4 mb-8">
                <span className="text-4xl font-black text-gray-900">
                  {course.price === 0 ? 'Free' : `₹${course.price}`}
                </span>
                {course.price > 0 && (
                  <span className="text-lg text-gray-400 line-through">₹{Math.round(course.price * 1.4)}</span>
                )}
              </div>
            </div>

            {/* Right: CTA Card */}
            <div className={`${boardStyle.bg} p-8 lg:p-12 flex flex-col justify-center`}>
              <div className="bg-white rounded-[24px] p-8 shadow-lg">
                {user?.role === 'COUNSELOR' ? (
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Student learning course</h3>
                    <p className="text-gray-500 mb-6">Counsellors can browse course information. Course enrolment is reserved for student accounts; counsellor certification is managed separately.</p>
                    <Link
                      to="/counselor-dashboard"
                      className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center font-bold py-4 rounded-2xl transition-colors"
                    >
                      View certification programme
                    </Link>
                  </div>
                ) : enrolled ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">You're enrolled!</h3>
                    <p className="text-gray-500 mb-6">Start learning right away.</p>
                    <Link
                      to={`/learn/${course.id}`}
                      className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white text-center font-bold py-4 rounded-2xl transition-colors"
                    >
                      Continue Learning
                    </Link>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Start learning today</h3>
                    <p className="text-gray-500 text-sm mb-6">
                      Get lifetime access to all course materials and updates.
                    </p>
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className={`w-full ${boardStyle.accent} hover:opacity-90 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 mb-4`}
                    >
                      {enrolling ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Enrolling...
                        </>
                      ) : (
                        <>
                          {course.price === 0 ? 'Enroll for Free' : 'Enroll Now'}
                          <ArrowLeft className="w-5 h-5 rotate-180" />
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-gray-400">
                      14-day money-back guarantee • Instant access
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* What You'll Learn */}
            <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Award className="w-6 h-6 text-indigo-600" />
                What you'll learn
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {outcomes.map((outcome, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 font-medium">{outcome}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum Preview */}
            <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-indigo-600" />
                Course Curriculum
              </h2>
              <div className="space-y-3">
                {[
                  { title: 'Introduction to the Course', duration: '15 min', free: true },
                  { title: 'Module 1: Core Concepts', duration: '2 hrs', free: false },
                  { title: 'Module 2: Advanced Topics', duration: '3 hrs', free: false },
                  { title: 'Module 3: Practice & Revision', duration: '2.5 hrs', free: false },
                  { title: 'Final Assessment', duration: '1 hr', free: false },
                ].map((module, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center font-bold text-gray-500 group-hover:text-indigo-600 transition-colors">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                          {module.title}
                        </h4>
                        <p className="text-sm text-gray-500">{module.duration}</p>
                      </div>
                    </div>
                    {module.free && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                        Preview
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* Instructor Card */}
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Your Instructor</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
                  {course.instructor.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{course.instructor}</p>
                  <p className="text-sm text-gray-500">{course.board} Expert</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {course.instructorBio || `Expert ${course.board} instructor with years of experience helping students achieve top results in board exams.`}
              </p>
            </div>

            {/* Certificate Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[24px] p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Download className="w-6 h-6" />
                <h3 className="font-bold">Certificate of Completion</h3>
              </div>
              <p className="text-indigo-100 text-sm mb-4">
                Complete this course to earn a verified certificate that you can share with employers and universities.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Include on LinkedIn
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
