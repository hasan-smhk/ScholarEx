export default function WhyScholarEx() {
  const features = [
    {
      title: 'Expert-led courses',
      desc: 'Learn from experienced educators who understand your board.',
    },
    {
      title: 'Learn at your pace',
      desc: 'Short lessons, clear milestones, and visible progress.',
    },
    {
      title: 'Practice that adapts',
      desc: 'Targeted quizzes help students focus where it matters most.',
    },
    {
      title: 'Guidance when needed',
      desc: 'Talk to counsellors for confident academic decisions.',
    },
  ];

  return (
    <section className="py-20 bg-[#fafbff]">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center">
        <div className="rounded-[32px] bg-indigo-600 p-12 text-white shadow-xl">
          <p className="uppercase tracking-[0.25em] text-sm font-bold text-indigo-200 mb-4">
            The ScholarEx difference
          </p>
          <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-6">
            Support that goes beyond the syllabus
          </h2>
          <p className="text-lg text-indigo-100 leading-8 mb-8">
            We combine expert teaching, smart technology, and human guidance to keep every learner moving forward.
          </p>
          <button className="bg-white text-indigo-600 font-semibold px-6 py-3 rounded-2xl">
            How ScholarEx works
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-8">
          {features.map((item) => (
            <div key={item.title}>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-600 leading-8">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
