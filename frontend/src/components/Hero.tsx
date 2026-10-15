import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="absolute top-10 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Your journey starts here
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Learn your way.
              <br />
              <span className="text-indigo-600">Build your future.</span>
            </h1>

            <p className="text-lg text-gray-600 max-w-xl mb-8">
              Trusted CBSE and Karnataka State Board courses with expert instructors,
              guided skill tracks, and personalized counselling support.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <Link
                to="/courses"
                className="inline-flex items-center bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Explore courses
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/counseling"
                className="inline-flex items-center bg-white text-indigo-600 border border-indigo-200 font-semibold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                Book counselling
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {['AS', 'RK', 'NM', 'VK'].map((initials) => (
                  <div
                    key={initials}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <p className="font-bold text-gray-900">2,500+ students</p>
                <p className="text-sm text-gray-500">already learning with ScholarEx</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 aspect-[4/3]">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
                alt="Students learning together"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/10 to-transparent"></div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎓</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Live Classes</p>
                  <p className="text-sm text-gray-500">Interactive learning</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default Hero;
