import BoardCoursesPage, { BoardPageConfig } from '../components/BoardCoursesPage';

const config: BoardPageConfig = {
  board: 'ICSE',
  title: 'ICSE Board Courses',
  introduction: 'Comprehensive lessons for Classes 1–10 with expert instruction and guided learning paths.',
  theme: 'icse',
  headerGradient: 'from-rose-950 via-fuchsia-950 to-[#30223a]',
  featuredTitle: 'Featured ICSE Courses',
  featuredIntroduction: 'Explore {count} popular ICSE courses taught by expert instructors',
  emptyCourseMessage: 'Courses for ICSE board are coming soon. Stay tuned!',
  icon: '📖',
  classes: {
    selectedCard: 'border-rose-400/70 bg-rose-400/10 shadow-lg shadow-rose-950/20',
    idleCard: 'border-white/10 bg-[#102e38]/80 shadow-sm hover:border-rose-300/40',
    selectedTitle: 'text-rose-300',
    idleTitle: 'text-white',
    filterSelected: 'border-rose-400 bg-rose-500 text-[#271725]',
    filterIdle: 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10',
    label: 'bg-rose-300/15 text-rose-200',
    dot: 'bg-rose-300',
    courseGradient: 'from-rose-700 to-fuchsia-800',
    courseBadge: 'text-rose-200',
    courseTitleHover: 'group-hover:text-rose-200',
    enrollButton: 'bg-rose-600 hover:bg-rose-500',
    loginButton: 'bg-rose-300/15 text-rose-100 hover:bg-rose-300/25',
  },
  features: [
    {
      icon: '📚',
      title: 'All Classes Covered',
      description: 'Class-by-class learning from the primary years through the Class 10 board exam.',
      className: 'border-rose-300/20 bg-rose-300/5',
    },
    {
      icon: '👨‍🏫',
      title: 'Expert Teachers',
      description: 'Learn from experienced ICSE educators with proven track records.',
      className: 'border-fuchsia-300/20 bg-fuchsia-300/5',
    },
    {
      icon: '🎯',
      title: 'Structured Learning',
      description: 'Follow clear learning paths with practice, quizzes, and progress tracking.',
      className: 'border-pink-300/20 bg-pink-300/5',
    },
  ],
};

export default function ICSEPage() {
  return <BoardCoursesPage config={config} />;
}
