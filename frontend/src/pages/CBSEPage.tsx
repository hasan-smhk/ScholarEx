import BoardCoursesPage, { BoardPageConfig } from '../components/BoardCoursesPage';

const config: BoardPageConfig = {
  board: 'CBSE',
  title: 'CBSE Board Courses',
  introduction: 'Comprehensive lessons for Classes 1–10 with expert instruction and guided learning paths.',
  theme: 'cbse',
  headerGradient: 'from-sky-950 via-cyan-950 to-[#0b2731]',
  featuredTitle: 'Featured CBSE Courses',
  featuredIntroduction: 'Explore {count} popular CBSE courses taught by expert instructors',
  emptyCourseMessage: 'Courses for CBSE board are coming soon. Stay tuned!',
  icon: '📚',
  classes: {
    selectedCard: 'border-sky-400/70 bg-sky-400/10 shadow-lg shadow-sky-950/20',
    idleCard: 'border-white/10 bg-[#102e38]/80 shadow-sm hover:border-sky-300/40',
    selectedTitle: 'text-sky-300',
    idleTitle: 'text-white',
    filterSelected: 'border-sky-400 bg-sky-500 text-[#071b24]',
    filterIdle: 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10',
    label: 'bg-sky-300/15 text-sky-200',
    dot: 'bg-sky-300',
    courseGradient: 'from-sky-700 to-cyan-800',
    courseBadge: 'text-sky-200',
    courseTitleHover: 'group-hover:text-sky-200',
    enrollButton: 'bg-sky-600 hover:bg-sky-500',
    loginButton: 'bg-sky-300/15 text-sky-100 hover:bg-sky-300/25',
  },
  features: [
    {
      icon: '📚',
      title: 'All Classes Covered',
      description: 'Class-by-class learning from the primary years through the Class 10 board exam.',
      className: 'border-sky-300/20 bg-sky-300/5',
    },
    {
      icon: '👨‍🏫',
      title: 'Expert Teachers',
      description: 'Learn from experienced CBSE educators with proven track records.',
      className: 'border-cyan-300/20 bg-cyan-300/5',
    },
    {
      icon: '🎯',
      title: 'Structured Learning',
      description: 'Follow clear learning paths with practice, quizzes, and progress tracking.',
      className: 'border-blue-300/20 bg-blue-300/5',
    },
  ],
};

export default function CBSEPage() {
  return <BoardCoursesPage config={config} />;
}
