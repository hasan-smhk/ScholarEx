import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Search, Menu, X, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InAppNotificationCenter from './InAppNotificationCenter';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = useLocation().pathname;
  if (
    (pathname === '/counselor-dashboard' && user?.role === 'COUNSELOR') ||
    (pathname === '/admin' && user?.role === 'ADMIN')
  ) {
    return null;
  }
  const usesDarkTheme = [
    '/',
    '/login',
    '/admin/login',
    '/register',
    '/courses/cbse',
    '/courses/icse',
    '/courses/state',
    '/skills',
  ].includes(pathname);
  const navLinkColor = usesDarkTheme
    ? 'text-slate-300 hover:text-teal-300'
    : 'text-gray-500 hover:text-indigo-600';

  return (
    <nav className={`sticky top-0 z-50 border-b backdrop-blur-md ${
      usesDarkTheme
        ? 'border-white/10 bg-[#071b24]/95 text-white'
        : 'border-gray-100 bg-white/80'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className={`${usesDarkTheme ? 'bg-teal-500' : 'bg-indigo-600'} rounded-xl p-2`}>
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <span className={`text-2xl font-black tracking-tight ${usesDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              Scholar<span className={usesDarkTheme ? 'text-teal-300' : 'text-indigo-600'}>Ex</span>
            </span>
          </Link>

          {/* */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/counseling" 
              className={`${navLinkColor} font-medium transition-colors`}
            >
              Counseling
            </Link>
            <Link 
              to="/courses/cbse" 
              className={`${navLinkColor} font-medium transition-colors`}
            >
              CBSE
            </Link>
            <Link 
              to="/courses/icse" 
              className={`${navLinkColor} font-medium transition-colors`}
            >
              ICSE
            </Link>
            <Link 
              to="/courses/state" 
              className={`${navLinkColor} font-medium transition-colors`}
            >
              State Board
            </Link>
            <Link 
              to="/skills" 
              className={`${navLinkColor} font-medium transition-colors`}
            >
              Skill Development
            </Link>
          </div>
          

          {/* Right Side: Search, Notifications, User Menu */}
          <div className="flex items-center gap-4">
            
            {/* Search Button */}
            <button className={`hidden p-2 transition-colors sm:block ${
              usesDarkTheme ? 'text-slate-400 hover:text-teal-300' : 'text-gray-400 hover:text-indigo-600'
            }`}>
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications (only show if logged in) */}
            {user && (
              <InAppNotificationCenter />
            )}

            {/* User Menu */}
            {user ? (
              <div className="flex items-center gap-3">
                {/* User Avatar */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold shadow-sm ${
                    usesDarkTheme
                      ? 'border-teal-400/40 bg-teal-400/15 text-teal-200'
                      : 'border-indigo-200 bg-indigo-100 text-indigo-600'
                  }`}>
                    {user.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden lg:block">
                    <p className={`text-sm font-semibold ${usesDarkTheme ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                    <p className={`text-xs ${usesDarkTheme ? 'text-slate-400' : 'text-gray-500'}`}>{user.email}</p>
                  </div>
                </div>

                {/* Dropdown Menu */}
                <div className="relative group">
                  <button className={`p-2 transition-colors ${
                    usesDarkTheme ? 'text-slate-300 hover:text-teal-300' : 'text-gray-600 hover:text-indigo-600'
                  }`}>
                    <Menu className="w-5 h-5" />
                  </button>
                  
                  {/* Dropdown Items */}
                  <div className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${
                    usesDarkTheme ? 'border-white/10 bg-[#102e38]' : 'border-gray-100 bg-white'
                  }`}>
                    {user.role === 'STUDENT' && (
                      <Link
                        to="/dashboard"
                        className={`block border-b px-4 py-3 text-sm font-medium ${
                          usesDarkTheme
                            ? 'border-white/10 text-slate-200 hover:bg-white/5 hover:text-teal-300'
                            : 'border-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                      >
                        📊 Dashboard
                      </Link>
                    )}
                    <Link
                      to="/my-reports"
                      className={`block border-b px-4 py-3 text-sm font-medium ${
                        usesDarkTheme
                          ? 'border-white/10 text-slate-200 hover:bg-white/5 hover:text-teal-300'
                          : 'border-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                    >
                      📄 My Reports
                    </Link>
                    <Link
                      to="/profile"
                      className={`block border-b px-4 py-3 text-sm font-medium ${
                        usesDarkTheme
                          ? 'border-white/10 text-slate-200 hover:bg-white/5 hover:text-teal-300'
                          : 'border-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                    >
                      ⚙️ Profile
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-3 text-sm text-amber-600 hover:bg-amber-50 font-bold border-b border-gray-100"
                      >
                        🔧 Admin Panel
                      </Link>
                    )}
                    {user.role === 'COUNSELOR' && (
                      <Link
                        to="/counselor-dashboard"
                        className="block px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 font-bold border-b border-gray-100"
                      >
                        👨‍💼 My Sessions
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-medium"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link 
                to="/login" 
                className={`rounded-xl px-6 py-2.5 font-bold text-white transition-all ${
                  usesDarkTheme
                    ? 'bg-teal-500 hover:bg-teal-400'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 md:hidden ${
                usesDarkTheme ? 'text-slate-300 hover:text-teal-300' : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`space-y-2 border-t pb-4 md:hidden ${
            usesDarkTheme ? 'border-white/10' : 'border-gray-100'
          }`}>
            <Link
              to="/counseling"
              className={`block rounded-lg px-2 py-2 font-medium ${
                usesDarkTheme ? 'text-slate-200 hover:bg-white/5 hover:text-teal-300' : 'text-gray-700 hover:bg-indigo-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              📞 Counselling
            </Link>
            <Link
              to="/courses/cbse"
              className={`block rounded-lg px-2 py-2 font-medium ${
                usesDarkTheme ? 'text-slate-200 hover:bg-white/5 hover:text-teal-300' : 'text-gray-700 hover:bg-indigo-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              📚 CBSE
            </Link>
            <Link
              to="/courses/icse"
              className={`block rounded-lg px-2 py-2 font-medium ${
                usesDarkTheme ? 'text-slate-200 hover:bg-white/5 hover:text-teal-300' : 'text-gray-700 hover:bg-indigo-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              📚 ICSE
            </Link>
            <Link
              to="/courses/state"
              className={`block rounded-lg px-2 py-2 font-medium ${
                usesDarkTheme ? 'text-slate-200 hover:bg-white/5 hover:text-teal-300' : 'text-gray-700 hover:bg-indigo-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              📚 State Board
            </Link>
            <Link
              to="/skills"
              className={`block rounded-lg px-2 py-2 font-medium ${
                usesDarkTheme ? 'text-slate-200 hover:bg-white/5 hover:text-teal-300' : 'text-gray-700 hover:bg-indigo-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              🎯 Skill Development
            </Link>

            {user && (
              <>
                <hr className="my-2" />
                {user.role === 'STUDENT' && (
                  <Link
                    to="/dashboard"
                    className={`block rounded-lg px-4 py-2 font-medium ${
                      usesDarkTheme ? 'text-slate-200 hover:bg-white/5 hover:text-teal-300' : 'text-gray-700 hover:bg-indigo-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    📊 Dashboard
                  </Link>
                )}
                <Link
                  to="/my-reports"
                  className={`block rounded-lg px-4 py-2 font-medium ${
                    usesDarkTheme ? 'text-slate-200 hover:bg-white/5 hover:text-teal-300' : 'text-gray-700 hover:bg-indigo-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  📄 My Reports
                </Link>
                <Link
                  to="/profile"
                  className={`block rounded-lg px-4 py-2 font-medium ${
                    usesDarkTheme ? 'text-slate-200 hover:bg-white/5 hover:text-teal-300' : 'text-gray-700 hover:bg-indigo-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ⚙️ Profile
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="block px-4 py-2 text-amber-600 hover:bg-amber-50 rounded-lg font-bold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    🔧 Admin Panel
                  </Link>
                )}
                {user.role === 'COUNSELOR' && (
                  <Link
                    to="/counselor-dashboard"
                    className="block px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-bold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    👨‍💼 My Sessions
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium"
                >
                  🚪 Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
