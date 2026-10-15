const courses = [
  {
    title: 'Foundations of Mathematics',
    board: 'CBSE',
    classLevel: 'Class 9',
    teacher: 'Dr. Meera Sharma',
    price: 'Free',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    title: 'English Mastery',
    board: 'CBSE',
    classLevel: 'Class 10',
    teacher: 'Ajay Reddy',
    price: '₹599',
    color: 'from-cyan-500 to-teal-500',
  },
  {
    title: 'Karnataka Science',
    board: 'STATE BOARD',
    classLevel: 'Class 11',
    teacher: 'Anita Rao',
    price: '₹899',
    color: 'from-orange-400 to-orange-500',
  },
];

export default function CoursePreview() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-10">
          <div>
            <p className="text-indigo-600 font-bold uppercase tracking-[0.2em] text-sm mb-2">
              Popular now
            </p>
            <h2 className="text-4xl font-black text-slate-900">Courses students love</h2>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div key={course.title} className="rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
              <div className={`h-44 bg-gradient-to-r ${course.color}`}></div>
              <div className="p-6">
                <div className="flex items-center gap-3 text-sm mb-4">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-bold">
                    {course.board}
                  </span>
                  <span className="text-slate-500">{course.classLevel}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{course.title}</h3>
                <p className="text-slate-500 mb-5">{course.teacher}</p>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-yellow-500 font-semibold">★ 4.8</span>
                  <span className="font-black text-2xl text-slate-900">{course.price}</span>
                </div>
                <button className="w-full border border-indigo-300 text-indigo-600 font-semibold py-3 rounded-2xl hover:bg-indigo-50">
                  View course
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
