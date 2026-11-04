import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { enrollInCourse, getCourses } from '../services/api';
import {
  GraduationCap,
  Lightbulb,
}
from 'lucide-react';
import LearningPromoBanner from '../components/LearningPromoBanner';
import SubjectIcon from '../components/SubjectIcon';
import PageBackground from '../components/PageBackground';
import BrandMark from '../components/BrandMark';

interface Course {
  id: string;
  title: string;
  board: string;
  level: string;
  instructor: string;
  description: string;
}

// HeroSection Component
const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#0b3943]">
      <div aria-hidden="true" className="absolute -top-12 -right-12 h-96 w-96 rounded-full bg-white opacity-5 blur-3xl"></div>
      <div aria-hidden="true" className="absolute -bottom-12 -left-12 h-96 w-96 rounded-full bg-white opacity-5 blur-3xl"></div>
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-2 lg:px-8">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
            <span className="text-sm font-semibold text-white">Learning built around you</span>
          </div>

          <h1 className="text-5xl font-black leading-tight tracking-tight text-white lg:text-7xl">
            Learn your way.
            <br />
            Build your <span className="text-[#c8f36a]">future.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-white/90">
            Trusted CBSE and Karnataka State Board courses with expert instructors,
            guided skill tracks, and personalised counselling support.
          </p>

          <div className="mt-5 flex flex-wrap gap-2" aria-label="ScholarEx learning offerings">
            <Link
              to="/counseling"
              className="rounded-full border border-amber-100 bg-white px-3.5 py-2 text-sm font-semibold text-amber-700 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50"
            >
              Personalised counselling
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/courses"
              className="rounded-2xl bg-white px-8 py-4 font-bold text-teal-800 shadow-md transition-colors hover:bg-teal-50"
            >
              Explore courses →
            </Link>
            <Link
              to="/counseling"
              className="rounded-2xl border border-white/40 bg-white/10 px-8 py-4 font-semibold text-white shadow-sm transition-colors hover:bg-white/20"
            >
              Book counselling
            </Link>
          </div>

        </div>

        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-slate-100 shadow-xl lg:aspect-[5/4]">
            <img
              src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&h=960&fit=crop&auto=format"
              alt="Students working together on their studies"
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
          </div>
          <div className="home-floating-card absolute -left-3 bottom-5 rounded-2xl border border-white/60 bg-white/95 p-3 shadow-xl sm:-left-6 sm:bottom-8 sm:p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-xl">🎓</span>
              <div>
                <p className="text-sm font-bold text-slate-900">Personal guidance</p>
                <p className="text-xs text-slate-500">Support for every learner</p>
              </div>
            </div>
          </div>
          <div className="home-floating-card home-floating-card-delayed absolute -right-2 top-5 rounded-2xl border border-white/60 bg-white/95 p-3 shadow-xl sm:-right-5 sm:top-8 sm:p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-xl">📚</span>
              <div>
                <p className="text-sm font-bold text-slate-900">50+ courses</p>
                <p className="text-xs text-slate-500">Made for your goals</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ModuleCards Component
const AchievementBanner: React.FC = () => {
  const stats = [
    { icon: '🎓', value: '100+', label: 'Sessions Completed' },
    { icon: '👨‍🎓', value: '1000+', label: 'Active Student Learners' },
    { icon: '📚', value: '50+', label: 'Courses Coming soon' },
    { icon: '⭐', value: '4.9', label: 'Average Rating' },
  ];

  return (
    <section className="bg-gradient-to-r from-[#0f766e] via-[#0e7490] to-[#115e59] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-white/80 uppercase tracking-widest text-xs sm:text-sm font-bold mb-6">
          Trusted by Students Across the World.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center group">
              <div className="mb-2 text-3xl sm:text-4xl">{stat.icon}</div>
              <div className="mb-1 text-3xl font-black text-white transition-transform group-hover:scale-110 sm:text-4xl">
                {stat.value}
              </div>
              <div className="text-white/80 text-sm font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ModuleCards Component
const ModuleCards: React.FC = () => {
  const modules = [
    {
      title: 'Counseling Session',
      desc: 'Create a free career report, then book paid one-to-one counseling.',
      link: '/counseling',
      cta: 'Get Free Report',
      icon: GraduationCap,
      color: 'border-violet-400/20 bg-violet-400/10',
    },
    {
      title: 'Skill Development',
      desc: 'Coming soon. This section is reserved for future learning tracks.',
      link: '/skills',
      cta: 'Coming Soon',
      icon: Lightbulb,
      color: 'border-emerald-400/20 bg-emerald-400/10',
    },
  ];

  return (
    <section className="bg-[#0b2731] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-teal-300">
          Main Modules
        </p>
        <h2 className="mb-10 text-4xl font-black text-white">
          Everything students need in one place
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {modules.map((module) => (
            <div
              key={module.title}
              className={`group rounded-3xl border ${module.color} p-6 shadow-sm transition-all duration-300 hover:shadow-lg`}
            >
              <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${module.color} text-teal-200`}>
                <module.icon aria-hidden="true" className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-white transition-colors group-hover:text-teal-200">
                {module.title}
              </h3>
              <p className="mb-6 leading-7 text-slate-300">{module.desc}</p>
              <Link
                to={module.link}
                className="inline-block font-semibold text-teal-300 hover:text-teal-200"
              >
                {module.cta} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// WhyScholarEx Component
const WhyScholarEx: React.FC = () => {
  const features = [
    {
      title: 'Expert-led courses',
      desc: 'Learn from experienced educators who understand your board.',
      icon: '👨‍🏫',
    },
    {
      title: 'Learn at your pace',
      desc: 'Short lessons, clear milestones, and visible progress.',
      icon: '📊',
    },
    {
      title: 'Practice that adapts',
      desc: 'Targeted quizzes help students focus where it matters most.',
      icon: '🎯',
    },
    {
      title: 'Guidance when needed',
      desc: 'Talk to counsellors for confident academic decisions.',
      icon: '💬',
    },
  ];

  return (
    <section className="bg-[#102e38] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left panel */}
          <div className="rounded-[32px] bg-gradient-to-br from-teal-700 to-cyan-800 p-8 text-white shadow-xl sm:p-12">
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-teal-100">
              The ScholarEx difference
            </p>
            <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-6">
              Support that goes beyond the syllabus
            </h2>
            <p className="mb-8 text-lg leading-8 text-teal-50">
              We combine expert teaching, smart technology, and human guidance to keep every learner moving forward.
            </p>
            <Link 
              to="/about"
              className="inline-block rounded-2xl bg-white px-8 py-4 font-bold text-teal-800 transition-colors hover:bg-teal-50"
            >
              How ScholarEx works
            </Link>
          </div>

          {/* Right features grid */}
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-10">
            {features.map((item) => (
              <div key={item.title}>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="mb-3 text-xl font-bold text-white">{item.title}</h3>
                <p className="leading-7 text-slate-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// FeaturedCourses Component (using your existing courses)
const FeaturedCourses: React.FC<{ courses: Course[]; onEnroll: (id: string) => void; enrollLoading: string | null; user: any; token: string | null }> = ({
  courses, onEnroll, enrollLoading, user, token
}) => {
  const featuredCourses = courses.slice(0, 4);

  const getBoardStyle = (board: string) => {
    switch (board.toUpperCase()) {
      case 'CBSE': return 'bg-teal-950/80 text-teal-100';
      case 'ICSE': return 'bg-cyan-950/80 text-cyan-100';
      case 'STATE': case 'STATE BOARD': return 'bg-amber-950/80 text-amber-100';
      default: return 'bg-slate-900/80 text-slate-100';
    }
  };

  const getPriceDisplay = (course: Course) => {
    // For free sessions or courses
    if (course.level?.toLowerCase().includes('free')) return 'Free';
    // For paid courses
    return course.id.charAt(0) === 'p' ? '₹599' : 'Free';
  };

  return (
    <section className="bg-[#0b2731] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-teal-300">
              Popular now
            </p>
            <h2 className="text-4xl font-black text-white">Courses students love</h2>
          </div>
          <Link to="/courses" className="font-semibold text-teal-300 hover:underline">
            View all courses →
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-300">No courses found. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {featuredCourses.map((course) => (
              <div key={course.id} className="group overflow-hidden rounded-3xl border border-white/10 bg-[#12333d] shadow-sm transition-all hover:shadow-lg">
                {/* Card header with gradient */}
                <div className="relative flex h-44 items-center justify-center bg-gradient-to-r from-teal-600 to-cyan-700">
                  <SubjectIcon title={course.title} className="h-16 w-16 text-white/80" />
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold ${getBoardStyle(course.board)}`}>
                    {course.board}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 text-sm mb-4">
                    <span className="text-slate-300">{course.level}</span>
                  </div>
                  
                  <h3 className="mb-3 line-clamp-2 text-xl font-bold text-white transition-colors group-hover:text-teal-200">
                    {course.title}
                  </h3>
                  
                  <p className="mb-4 text-sm text-slate-300">{course.instructor}</p>
                  
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-yellow-500 font-semibold text-sm">★ 4.8</span>
                    <span className="text-2xl font-black text-white">{getPriceDisplay(course)}</span>
                  </div>

                  {user && token ? (
                    <button
                      onClick={() => onEnroll(course.id)}
                      disabled={enrollLoading === course.id}
                      className="w-full rounded-2xl bg-teal-600 py-3 font-semibold text-white transition-colors hover:bg-teal-500 disabled:opacity-50"
                    >
                      {enrollLoading === course.id ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  ) : (
                    <Link
                      to="/register"
                      className="block w-full rounded-2xl bg-teal-400/15 py-3 text-center font-semibold text-teal-200 transition-colors hover:bg-teal-400/25"
                    >
                      Login to Enroll
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// Footer Component
const Footer: React.FC = () => {
  const [contactNotice, setContactNotice] = useState('');

  const handleContactSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get('fullName') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const message = String(formData.get('message') || '').trim();
    const subject = `ScholarEx contact from ${fullName}`;
    const body = `Name: ${fullName}\nEmail: ${email}\n\n${message}`;

    window.location.href = `mailto:Info@jzdtechnologies.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setContactNotice('Your email app should open with your message addressed to ScholarEx.');
  };

  return (
    <footer className="bg-[#061a22] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-10">
        <div>
          <h3 className="mb-4 flex items-center gap-2.5 text-3xl font-black text-white">
            <BrandMark className="h-10 w-12 rounded-lg bg-white object-contain p-0.5 shadow-sm" />
            Scholar<span className="text-teal-300">Ex</span>
          </h3>
          <p className="leading-8 text-slate-300">
            ScholarEx helps students learn better with structured board courses,
            personalized guidance, and future-focused support.
          </p>
        </div>

        <div>
          <h4 className="mb-4 font-bold text-white">Learn</h4>
          <div className="space-y-3 text-slate-300">
            <Link to="/courses/cbse" className="block hover:text-teal-300">CBSE</Link>
            <Link to="/courses/state" className="block hover:text-teal-300">Karnataka State Board</Link>
            <Link to="/skills" className="block hover:text-teal-300">Skill Development</Link>
          </div>
        </div>

        <div>
          <h4 className="mb-4 font-bold text-white">Explore</h4>
          <div className="space-y-3 text-slate-300">
            <Link to="/counseling" className="block hover:text-teal-300">Counselling</Link>
            <Link to="/register" className="block hover:text-teal-300">Register</Link>
            <Link to="/admin/login" className="block hover:text-teal-300">Admin Login</Link>
          </div>
        </div>

        <div>
          <h4 className="mb-4 font-bold text-white">Company</h4>
          <div className="space-y-3 text-slate-300">
            <p>About JZDScholarEx</p>
            <a href="#contact-form" className="block hover:text-teal-300">Contact Us</a>
            <p>Contact: Info@jzdtechnologies.com</p>
            <p>Bengaluru, Karnataka</p>
          </div>
        </div>
      </div>

      <section id="contact-form" className="scroll-mt-24 mx-auto mt-12 max-w-7xl px-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-teal-300">Contact us</p>
            <h2 className="mt-2 text-2xl font-black text-white">How can we help?</h2>
            <p className="mt-2 text-slate-300">
              Send us a message and your email app will prepare it for Info@jzdtechnologies.com.
            </p>
          </div>
          <form onSubmit={handleContactSubmit} className="mt-6 grid max-w-2xl gap-5">
            <div>
              <label htmlFor="contact-full-name" className="mb-2 block text-sm font-semibold text-white">Full name</label>
              <input
                id="contact-full-name"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                className="w-full rounded-xl border border-white/20 bg-[#0b2731] px-4 py-3 text-white placeholder:text-slate-400 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300/30"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="mb-2 block text-sm font-semibold text-white">Email address</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-white/20 bg-[#0b2731] px-4 py-3 text-white placeholder:text-slate-400 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300/30"
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="mb-2 block text-sm font-semibold text-white">Message</label>
              <textarea
                id="contact-message"
                name="message"
                rows={5}
                required
                className="w-full resize-y rounded-xl border border-white/20 bg-[#0b2731] px-4 py-3 text-white placeholder:text-slate-400 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300/30"
              />
            </div>
            <button
              type="submit"
              className="w-fit rounded-xl bg-teal-500 px-6 py-3 font-bold text-white transition-colors hover:bg-teal-400"
            >
              Prepare message
            </button>
            {contactNotice && <p role="status" className="text-sm text-teal-200">{contactNotice}</p>}
          </form>
        </div>
      </section>

      <div className="mt-12 border-t border-white/10 pt-6 text-center text-slate-400">
        Empowering curious minds. ScholarEx Education is a product of JZD Technologies. © 2026 All rights reserved.

      </div>
    </footer>
  );
};

// Main HomePage Component
export default function HomePage() {
  const { user, token, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollLoading, setEnrollLoading] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (user?.role === 'COUNSELOR' || user?.role === 'ADMIN') {
      setCourses([]);
      return;
    }

    async function loadData() {
      try {
        const response = await getCourses();
        setCourses(response.data);
      } catch (err: any) {
        console.error('Fetch error:', err);
      }
    }
    loadData();
  }, [authLoading, user?.role]);

  const handleEnroll = async (courseId: string) => {
    if (!user || !token) {
      alert('Please login to enroll');
      return;
    }
    setEnrollLoading(courseId);
    try {
      await enrollInCourse(courseId, token);
      alert('✅ Enrolled successfully!');
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setEnrollLoading(null);
    }
  };

  if (authLoading) {
    return (
      <PageBackground theme="home">
        <main className="flex min-h-[70vh] items-center justify-center px-6 py-16 text-white">
          <p role="status" className="font-semibold">Loading your JZDScholarEx home...</p>
        </main>
      </PageBackground>
    );
  }

  if (user?.role === 'COUNSELOR' || user?.role === 'ADMIN') {
    const dashboardPath = user.role === 'ADMIN' ? '/admin' : '/counselor-dashboard';
    const roleLabel = user.role === 'ADMIN' ? 'administrator' : 'counselor';

    return (
      <PageBackground theme="home">
        <main className="flex min-h-[70vh] items-center justify-center px-6 py-16">
          <section className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0d2933]/95 p-8 text-center text-white shadow-2xl sm:p-12">
            <BrandMark className="mx-auto mb-6 h-14 w-16 rounded-xl bg-white object-contain p-1 shadow-lg" />
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-300">JZDScholarEx home</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">Welcome, {user.name}</h1>
            <p className="mt-4 leading-7 text-slate-300">
              You are signed in as a {roleLabel}. Your role-specific workspace and options are available from your dashboard.
            </p>
            <Link
              to={dashboardPath}
              className="mt-8 inline-flex rounded-xl bg-teal-500 px-6 py-3 font-bold text-white transition-colors hover:bg-teal-400"
            >
              Return to your dashboard
            </Link>
          </section>
        </main>
      </PageBackground>
    );
  }

  return (
    <PageBackground theme="home">
      {!authLoading && !user && !token && <AchievementBanner />}

      {/* Hero Section */}
      <HeroSection />
      
      {/* Module Cards - 4 Main Modules */}
      <ModuleCards />

      {/* Featured learning promotion */}
      <LearningPromoBanner />
      
      {/* Why ScholarEx - Features */}
      <WhyScholarEx />
      
      {/* Featured Courses */}
      {courses.length > 0 && (
        <div className="hidden">
          <FeaturedCourses
            courses={courses}
            onEnroll={handleEnroll}
            enrollLoading={enrollLoading}
            user={user}
            token={token}
          />
        </div>
      )}
      
      {/* Footer */}
      <Footer />
    </PageBackground>
  );
}
