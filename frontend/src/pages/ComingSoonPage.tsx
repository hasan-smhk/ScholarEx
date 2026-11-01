import React from 'react';
import PageBackground from '../components/PageBackground';

const ComingSoonPage: React.FC = () => (
  <PageBackground theme="skills" texture="grid">
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <section className="w-full max-w-2xl rounded-3xl border border-teal-200/15 bg-[#0d2933]/95 p-8 text-center text-white shadow-2xl sm:p-12">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-teal-300">
          ScholarEx learning modules
        </p>
        <h1 className="text-4xl font-black sm:text-5xl">Coming Soon</h1>
        <p className="mt-4 leading-7 text-slate-300">
          We’re preparing new learning experiences. Please check back soon.
        </p>
      </section>
    </main>
  </PageBackground>
);

export default ComingSoonPage;
