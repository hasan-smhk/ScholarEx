import React from 'react';
import PageBackground from '../components/PageBackground';

const SkillsPage: React.FC = () => {
  const upcomingSkills = [
    { icon: '💻', title: 'Web Development', desc: 'HTML, CSS, JavaScript and React basics', badge: 'Coming Soon', color: 'from-green-500 to-emerald-600' },
    { icon: '🤖', title: 'AI & Machine Learning', desc: 'Intro to Python, data science and ML', badge: 'Coming Soon', color: 'from-blue-500 to-cyan-600' },
    { icon: '🎨', title: 'Graphic Design', desc: 'Canva, Figma and creative design principles', badge: 'Coming Soon', color: 'from-pink-500 to-rose-600' },
    { icon: '📱', title: 'App Development', desc: 'Mobile app development for beginners', badge: 'Coming Soon', color: 'from-purple-500 to-violet-600' },
    { icon: '📊', title: 'Data Analytics', desc: 'Excel, Power BI and data visualization', badge: 'Coming Soon', color: 'from-yellow-500 to-orange-500' },
    { icon: '🗣️', title: 'Public Speaking', desc: 'Communication, confidence and presentation', badge: 'Coming Soon', color: 'from-teal-500 to-green-600' },
  ];

  return (
    <PageBackground theme="skills" texture="grid">
      <header className="relative isolate overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#092a35] via-[#0b3943] to-[#123d3a] py-16 sm:py-24">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-36 h-[28rem] w-[28rem] rounded-full border border-teal-200/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-20 h-80 w-80 rounded-full border border-teal-200/10" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-16 h-40 w-40 rounded-full bg-teal-400/10 blur-3xl motion-safe:animate-pulse motion-reduce:animate-none" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
          <div className="max-w-3xl motion-safe:animate-[login-enter_.6s_ease-out_both] motion-reduce:animate-none">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-300/10 px-4 py-2 text-sm font-bold text-teal-100">
              <span aria-hidden="true">✦</span>
              Skills for what comes next
            </span>
            <h1 className="text-5xl font-black leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              Build future-ready
              <span className="block bg-gradient-to-r from-teal-200 via-cyan-200 to-lime-200 bg-clip-text text-transparent">skills.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Go beyond academics with practical learning paths designed to help you explore tomorrow’s careers and opportunities.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-lime-200/20 bg-lime-200/10 px-5 py-3 font-semibold text-lime-100">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-300 opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-lime-300" />
              </span>
              Launching soon — explore the tracks
            </div>
          </div>
          <div className="hidden h-56 w-56 rotate-3 items-center justify-center rounded-[2.5rem] border border-teal-200/15 bg-white/5 text-8xl shadow-2xl backdrop-blur-sm transition-transform duration-500 hover:rotate-0 lg:flex">
            <span aria-hidden="true">🚀</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-teal-300">Explore your next move</p>
            <h2 className="text-3xl font-black text-white sm:text-4xl">Upcoming skill tracks</h2>
          </div>
          <p className="max-w-lg text-slate-300">A first look at creative, technical, and communication skills coming to ScholarEx.</p>
        </div>

        <div className="mb-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingSkills.map((skill) => (
            <div
              key={skill.title}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-[#102e38]/80 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl motion-safe:animate-[login-enter_.45s_ease-out_both] motion-reduce:animate-none"
              style={{ animationDelay: `${upcomingSkills.indexOf(skill) * 70}ms` }}
            >
              <div className={`h-1.5 bg-gradient-to-r ${skill.color} transition-all duration-300 group-hover:h-2`} />
              <div className="p-6 sm:p-8">
                <div className="mb-6 flex items-start justify-between">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${skill.color} text-4xl shadow-lg transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105`}>
                    <span aria-hidden="true">{skill.icon}</span>
                  </div>
                  <span className="rounded-full border border-teal-200/15 bg-teal-300/10 px-3 py-1 text-xs font-bold text-teal-200">
                    {skill.badge}
                  </span>
                </div>
                <h3 className="mb-2 text-xl font-black text-white transition-colors group-hover:text-teal-200">
                  {skill.title}
                </h3>
                <p className="text-sm leading-6 text-slate-300">{skill.desc}</p>
                <div className={`mt-6 h-px w-12 bg-gradient-to-r ${skill.color} transition-all duration-300 group-hover:w-full`} />
              </div>
            </div>
          ))}
        </div>

        <section className="relative isolate overflow-hidden rounded-3xl border border-teal-200/15 bg-gradient-to-br from-[#0d454a] via-[#0b3943] to-[#102e38] p-7 text-center shadow-xl sm:p-12" aria-labelledby="skills-notify-heading">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="relative">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-teal-200">Be part of what’s next</p>
            <h3 id="skills-notify-heading" className="mb-3 text-3xl font-black text-white">Stay in the loop</h3>
            <p className="mb-7 text-teal-50/80">Get notified when new skill tracks launch.</p>
          <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Enter your email"
              aria-label="Email address for skill track updates"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#071b24]/70 px-4 py-3 font-medium text-white placeholder:text-slate-400 outline-none transition focus:border-teal-200/60 focus:ring-4 focus:ring-teal-200/10"
            />
            <button type="button" className="rounded-xl bg-teal-300 px-6 py-3 font-black text-[#06232b] transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-200 motion-reduce:transform-none">
              Notify Me
            </button>
          </div>
          </div>
        </section>
      </main>
    </PageBackground>
  );
};

export default SkillsPage;
