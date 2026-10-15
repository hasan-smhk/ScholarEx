import BoardCoursesPage, { BoardPageConfig } from '../components/BoardCoursesPage';

const config: BoardPageConfig = {
  board: 'State Board',
  title: 'Karnataka State Board',
  introduction: 'Karnataka State Board courses with Kannada and English support, local syllabus alignment, and exam preparation.',
  theme: 'stateboard',
  headerGradient: 'from-amber-950 via-orange-950 to-[#15332e]',
  featuredTitle: 'Featured Karnataka Courses',
  featuredIntroduction: '{count} courses designed for Karnataka State Board students',
  emptyCourseMessage: 'Karnataka State Board courses are being added. Check back soon!',
  icon: '🏫',
  classes: {
    selectedCard: 'border-amber-400/70 bg-amber-400/10 shadow-lg shadow-amber-950/20',
    idleCard: 'border-white/10 bg-[#102e38]/80 shadow-sm hover:border-amber-300/40',
    selectedTitle: 'text-amber-300',
    idleTitle: 'text-white',
    filterSelected: 'border-amber-400 bg-amber-400 text-[#271d0b]',
    filterIdle: 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10',
    label: 'bg-amber-300/15 text-amber-200',
    dot: 'bg-amber-300',
    courseGradient: 'from-amber-700 to-orange-800',
    courseBadge: 'text-amber-200',
    courseTitleHover: 'group-hover:text-amber-200',
    enrollButton: 'bg-amber-600 hover:bg-amber-500',
    loginButton: 'bg-amber-300/15 text-amber-100 hover:bg-amber-300/25',
  },
  features: [
    {
      icon: '📚',
      title: 'Kannada Medium',
      description: 'Switch between Kannada and English for localized subject names and course descriptions.',
      className: 'border-orange-300/20 bg-orange-300/5',
    },
    {
      icon: '🎯',
      title: 'SSLC Ready',
      description: 'Focused revision and guided practice prepare students for Karnataka SSLC examinations.',
      className: 'border-amber-300/20 bg-amber-300/5',
    },
    {
      icon: '🏆',
      title: 'Local Context',
      description: 'Content is adapted to Karnataka State Board requirements and local educational standards.',
      className: 'border-yellow-300/20 bg-yellow-300/5',
    },
  ],
};

export default function StateBoardPage() {
  return <BoardCoursesPage config={config} />;
}
