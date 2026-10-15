import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LearningPromoBanner({
  className = 'max-w-7xl mx-auto px-6 py-10',
}: {
  className?: string;
}) {
  return (
    <section className={className} aria-label="Featured learning">
      <div className="relative isolate overflow-hidden rounded-[28px] bg-[#082a34] shadow-lg">
        <div className="absolute inset-y-0 right-0 w-full sm:w-1/2">
          <img
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1000&h=700&fit=crop&auto=format"
            alt="Students celebrating their learning achievements"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#082a34] via-[#082a34]/85 to-[#082a34]/15" />
        </div>
        <div className="relative max-w-2xl px-7 py-10 text-white sm:px-10 sm:py-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-teal-100">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            Find your next learning goal
          </div>
          <h2 className="text-3xl font-black leading-tight sm:text-4xl">
            Make progress in a subject you love.
          </h2>
          <p className="mt-3 max-w-lg leading-7 text-slate-200">
            Explore board-aligned courses and guided learning paths designed to help you move forward.
          </p>
          <Link
            to="/courses"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-teal-800 transition-colors hover:bg-teal-50"
          >
            Explore courses
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
