import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageBackground from './PageBackground';
import { useAuth } from '../context/AuthContext';
import { BOARD_CLASS_DATA, Course, CourseBoard, CourseLanguage, CourseLevel, courses } from '../data/courseData';
import { enrollInCourse } from '../services/api';
import { ThemeName } from './pageThemes';

interface BoardFeature {
  icon: string;
  title: string;
  description: string;
  className: string;
}

interface BoardPageClasses {
  selectedCard: string;
  idleCard: string;
  selectedTitle: string;
  idleTitle: string;
  filterSelected: string;
  filterIdle: string;
  label: string;
  dot: string;
  courseGradient: string;
  courseBadge: string;
  courseTitleHover: string;
  enrollButton: string;
  loginButton: string;
}

export interface BoardPageConfig {
  board: CourseBoard;
  title: string;
  introduction: string;
  theme: ThemeName;
  headerGradient: string;
  featuredTitle: string;
  featuredIntroduction: string;
  emptyCourseMessage: string;
  icon: string;
  classes: BoardPageClasses;
  features: BoardFeature[];
}

const levels: Array<CourseLevel | 'All'> = [
  'All',
  'Primary',
  'Secondary',
  'Pre-Board',
  'Board Exam',
];

interface BoardCoursesPageProps {
  config: BoardPageConfig;
}

export default function BoardCoursesPage({ config }: BoardCoursesPageProps) {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const boardClasses = BOARD_CLASS_DATA[config.board];
  const boardCourses: Course[] = courses.filter((course) => course.board === config.board);
  const [levelFilter, setLevelFilter] = useState<CourseLevel | 'All'>('All');
  const [language, setLanguage] = useState<CourseLanguage>('English');
  const [expandedClass, setExpandedClass] = useState<string | null>(boardClasses[0]?.name ?? null);
  const [enrollLoading, setEnrollLoading] = useState<number | null>(null);
  const filteredClasses = boardClasses.filter(
    (courseClass) => levelFilter === 'All' || courseClass.level === levelFilter,
  );

  const selectLevel = (level: CourseLevel | 'All') => {
    setLevelFilter(level);
    const firstClass = boardClasses.find(
      (courseClass) => level === 'All' || courseClass.level === level,
    );
    setExpandedClass(firstClass?.name ?? null);
  };

  const handleEnroll = async (courseId: number) => {
    if (!user || !token) {
      alert('Please login first');
      navigate('/login');
      return;
    }

    setEnrollLoading(courseId);
    try {
      await enrollInCourse(String(courseId), token);
      alert('✅ Enrolled successfully!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      alert(`❌ Error: ${message}`);
    } finally {
      setEnrollLoading(null);
    }
  };

  return (
    <PageBackground theme={config.theme}>
      <header className={`relative isolate overflow-hidden bg-gradient-to-br ${config.headerGradient} py-16 text-white sm:py-20`}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full border border-white/10 sm:h-96 sm:w-96" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-2 top-0 h-56 w-56 rounded-full border border-white/10 sm:h-72 sm:w-72" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
          <div className="motion-safe:animate-[login-enter_.6s_ease-out_both] motion-reduce:animate-none">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-white/70">
              {config.board} learning path
            </p>
            <h1 className="mb-4 text-4xl font-black sm:text-5xl lg:text-6xl">{config.title}</h1>
            <p className="max-w-3xl text-lg text-white/80 sm:text-xl">{config.introduction}</p>
          </div>
          <div className="hidden h-40 w-40 items-center justify-center rounded-[2rem] border border-white/15 bg-white/5 text-7xl shadow-2xl backdrop-blur-sm motion-safe:animate-pulse motion-reduce:animate-none lg:flex">
            <span aria-hidden="true">{config.icon}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <section className="mb-20 motion-safe:animate-[login-enter_.65s_ease-out_.08s_both] motion-reduce:animate-none" aria-labelledby="browse-classes-heading">
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="browse-classes-heading" className="mb-3 text-3xl font-black text-white sm:text-4xl">
                Browse by Class
              </h2>
              <p className="text-lg text-slate-300">
                Classes 1 to 10 — choose a level or open a class to see its subjects and description.
              </p>
            </div>

            {config.board === 'State Board' && (
              <div className="flex shrink-0 items-center gap-2" aria-label="Choose course language">
                {(['English', 'Kannada'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={language === option}
                    onClick={() => setLanguage(option)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                      language === option
                        ? config.classes.filterSelected
                        : 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6 flex flex-wrap gap-2" aria-label="Filter classes by level">
            {levels.map((level) => {
              const selected = levelFilter === level;
              return (
                <button
                  key={level}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectLevel(level)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                    selected ? config.classes.filterSelected : config.classes.filterIdle
                  }`}
                >
                  {level === 'All' ? 'All levels' : level}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredClasses.map((courseClass, index) => {
              const isExpanded = expandedClass === courseClass.name;
              const detailsId = `${config.board.toLowerCase().replace(/\s+/g, '-')}-class-${index + 1}-details`;
              const displayedName =
                language === 'Kannada' && courseClass.kannadaName
                  ? courseClass.kannadaName
                  : courseClass.name;

              return (
                <article
                  key={courseClass.name}
                  style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
                  className={`group rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl motion-safe:animate-[login-enter_.45s_ease-out_both] motion-reduce:animate-none ${
                    isExpanded ? config.classes.selectedCard : config.classes.idleCard
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={detailsId}
                    onClick={() => setExpandedClass(isExpanded ? null : courseClass.name)}
                    className="w-full rounded-2xl p-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 sm:p-6"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <span className={`block text-xl font-bold ${isExpanded ? config.classes.selectedTitle : config.classes.idleTitle}`}>
                          {displayedName}
                        </span>
                        <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${config.classes.label}`}>
                          {courseClass.level}
                        </span>
                      </span>
                      <span className={`pt-1 text-xl transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${config.classes.selectedTitle}`} aria-hidden="true">
                        {isExpanded ? '−' : '+'}
                      </span>
                    </span>
                    <span className="mt-3 block text-sm text-slate-400">
                      {courseClass.subjects[language].length} subjects
                    </span>
                  </button>

                  {isExpanded && (
                    <div id={detailsId} className="px-5 pb-5 motion-safe:animate-[login-enter_.2s_ease-out_both] motion-reduce:animate-none sm:px-6 sm:pb-6">
                      <p className="mb-4 text-sm leading-relaxed text-slate-300">
                        {courseClass.description[language]}
                      </p>
                      <p className={`mb-2 text-xs font-bold uppercase tracking-widest ${config.classes.selectedTitle}`}>
                        {language === 'Kannada' ? 'ವಿಷಯಗಳು' : 'Available subjects'}
                      </p>
                      <ul className="space-y-2">
                        {courseClass.subjects[language].map((subject) => (
                          <li key={subject} className="flex items-center text-sm text-slate-200">
                            <span className={`mr-2 h-1.5 w-1.5 shrink-0 rounded-full ${config.classes.dot}`} />
                            {subject}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="motion-safe:animate-[login-enter_.65s_ease-out_.12s_both] motion-reduce:animate-none" aria-labelledby="featured-courses-heading">
          <div className="mb-8">
            <h2 id="featured-courses-heading" className="mb-3 text-3xl font-black text-white sm:text-4xl">
              {config.featuredTitle}
            </h2>
            <p className="text-lg text-slate-300">
              {boardCourses.length > 0
                ? config.featuredIntroduction.replace('{count}', String(boardCourses.length))
                : config.emptyCourseMessage}
            </p>
          </div>

          {boardCourses.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center sm:p-12">
              <div className="mb-4 text-5xl" aria-hidden="true">{config.icon}</div>
              <h3 className="mb-2 text-2xl font-bold text-white">No courses yet</h3>
              <p className="text-slate-300">{config.emptyCourseMessage}</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {boardCourses.map((course) => (
                <article
                  key={course.id}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-[#102e38]/90 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl motion-safe:animate-[login-enter_.45s_ease-out_both] motion-reduce:animate-none"
                  style={{ animationDelay: `${Math.min(boardCourses.indexOf(course) * 70, 280)}ms` }}
                >
                  <div className={`relative flex h-40 items-center justify-center bg-gradient-to-br ${config.classes.courseGradient}`}>
                    <div className="text-6xl opacity-20" aria-hidden="true">{config.icon}</div>
                    <span className={`absolute left-4 top-4 rounded-full border border-white/10 bg-[#071b24]/80 px-3 py-1 text-xs font-bold ${config.classes.courseBadge}`}>
                      {course.level}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className={`mb-3 min-h-12 text-xl font-bold text-white transition-colors ${config.classes.courseTitleHover}`}>
                      {course.title}
                    </h3>
                    <p className="mb-4 flex items-center text-sm text-slate-300">
                      <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs" aria-hidden="true">👤</span>
                      {course.instructor}
                    </p>
                    <p className="mb-5 line-clamp-2 text-sm text-slate-300">{course.description}</p>
                    <div className="mb-5 flex items-center justify-between">
                      <span className="text-sm font-semibold text-amber-500">★ 4.8</span>
                      <span className="text-2xl font-black text-white">{course.price || 'Free'}</span>
                    </div>
                    {user && token ? (
                      <button
                        type="button"
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrollLoading === course.id}
                        className={`w-full rounded-xl py-3 font-bold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none ${config.classes.enrollButton}`}
                      >
                        {enrollLoading === course.id ? 'Enrolling...' : 'Enroll Now'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className={`w-full rounded-xl py-3 font-bold transition-all duration-200 hover:-translate-y-0.5 motion-reduce:transform-none ${config.classes.loginButton}`}
                      >
                        Login to Enroll
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-20" aria-label={`${config.board} learning features`}>
          <div className="grid gap-6 md:grid-cols-3">
            {config.features.map((feature) => (
              <article key={feature.title} className={`rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl motion-safe:animate-[login-enter_.45s_ease-out_both] motion-reduce:animate-none ${feature.className}`}>
                <div className="mb-4 text-4xl" aria-hidden="true">{feature.icon}</div>
                <h3 className="mb-2 text-xl font-bold text-white">{feature.title}</h3>
                <p className="text-slate-300">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </PageBackground>
  );
}
