import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-10">
        <div>
          <h3 className="text-3xl font-black text-slate-900 mb-4">
            Scholar<span className="text-indigo-600">Ex</span>
          </h3>
          <p className="text-slate-600 leading-8">
            ScholarEx helps students learn better with structured board courses,
            personalized guidance, and future-focused support.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 mb-4">Learn</h4>
          <div className="space-y-3 text-slate-600">
            <Link to="/courses/cbse" className="block hover:text-indigo-600">CBSE</Link>
            <Link to="/courses/state" className="block hover:text-indigo-600">Karnataka State Board</Link>
            <Link to="/skills" className="block hover:text-indigo-600">Skill Development</Link>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 mb-4">Explore</h4>
          <div className="space-y-3 text-slate-600">
            <Link to="/counseling" className="block hover:text-indigo-600">Counselling</Link>
            <Link to="/register" className="block hover:text-indigo-600">Register</Link>
            <Link to="/login" className="block hover:text-indigo-600">Counsellor Login</Link>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 mb-4">Company</h4>
          <div className="space-y-3 text-slate-600">
            <p>About ScholarEx</p>
            <p>Careers</p>
            <p>Contact: support@scholarex.com</p>
            <p>Bengaluru, Karnataka</p>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-gray-100 text-center text-slate-500">
        © 2026 ScholarEx Education. Built for curious minds.
      </div>
    </footer>
  );
}
