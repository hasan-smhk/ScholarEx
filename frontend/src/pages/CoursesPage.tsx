import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courses, Course } from '../data/courseData';
import { useAuth } from '../context/AuthContext';

export default function CoursesPage() {
  const { board } = useParams<{ board?: string }>(); // Captures /courses/cbse or /courses/state
  const { token } = useAuth();
  
  const [filter, setFilter] = useState(board || 'All');
  const [searchQuery, setSearchQuery] = useState('');

  // Update filter if the URL changes (e.g., clicking a link in the navbar)
  useEffect(() => {
    if (board) {
      setFilter(board.toLowerCase() === 'state' ? 'State Board' : board.toUpperCase());
    } else {
      setFilter('All');
    }
  }, [board]);

  const filteredCourses = courses.filter((course) => {
    const matchesBoard = filter === 'All' || course.board === filter;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBoard && matchesSearch;
  });

  return (
    <div className="scholar-page min-h-screen">
      {/* Header */}
      <div className="scholar-dashboard-hero text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-black mb-2">Explore Courses</h1>
          <p className="text-indigo-100">Quality education for all Boards.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Search</h3>
            <input 
              type="text" 
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Board</h3>
            <div className="flex flex-col gap-2">
              {['All', 'CBSE', 'ICSE', 'State Board'].map((b) => (
                <button
                  key={b}
                  onClick={() => setFilter(b)}
                  className={`text-left px-4 py-3 rounded-xl font-semibold transition-all ${
                    filter === b 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-white text-slate-600 hover:bg-indigo-50 border border-gray-100'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Course Grid */}
        <main className="lg:col-span-3">
          <div className="mb-6 flex justify-between items-center">
            <p className="text-slate-500 font-medium">
              Showing {filteredCourses.length} courses
            </p>
          </div>

          {filteredCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                  <div className={`h-4 border-t-8 ${course.board === 'CBSE' ? 'border-indigo-500' : 'border-orange-500'}`}></div>
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                        course.board === 'CBSE' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {course.board}
                      </span>
                      <span className="text-slate-400 text-sm font-medium">{course.level}</span>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      {course.title}
                    </h3>
                    
                    <p className="text-slate-500 text-sm mb-6 line-clamp-2">
                      {course.description || "Expert-led comprehensive curriculum designed for board success."}
                    </p>

                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        {course.instructor.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-tighter">Instructor</p>
                        <p className="text-sm font-bold text-slate-800">{course.instructor}</p>
                      </div>
                    </div>

                    <Link 
                      to={`/course/${course.id}`}
                      className="block text-center bg-slate-900 hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl transition-all"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[32px] p-20 text-center border-2 border-dashed border-gray-200">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-slate-900">No courses found</h3>
              <p className="text-slate-500 mt-2">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
