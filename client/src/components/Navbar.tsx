import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 0;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowProfileMenu(false);
  };

  const isActive = (path: string) => location.pathname === path;

  // Don't show navbar on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-netflix-black' : 'bg-transparent'
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-16 py-4">
        {/* Logo */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="text-netflix-red font-bold text-2xl md:text-3xl">
            WEBFLIX
          </Link>

          {/* Navigation Links */}
          {user && (
            <div className="hidden md:flex space-x-6">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors duration-200 hover:text-gray-300 ${
                  isActive('/') ? 'text-white' : 'text-gray-400'
                }`}
              >
                Home
              </Link>
              <Link
                to="/movies"
                className={`text-sm font-medium transition-colors duration-200 hover:text-gray-300 ${
                  isActive('/movies') ? 'text-white' : 'text-gray-400'
                }`}
              >
                Movies
              </Link>
              <Link
                to="/my-list"
                className={`text-sm font-medium transition-colors duration-200 hover:text-gray-300 ${
                  isActive('/my-list') ? 'text-white' : 'text-gray-400'
                }`}
              >
                My List
              </Link>
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Search Icon (placeholder) */}
              <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-netflix-red rounded flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-white transition-transform ${
                      showProfileMenu ? 'rotate-180' : ''
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-netflix-black border border-gray-700 rounded-lg shadow-lg py-2">
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                    
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Profile Settings
                    </Link>
                    
                    {user.isAdmin && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    
                    <hr className="my-2 border-gray-700" />
                    
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-white hover:text-gray-300 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-netflix-red text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {user && (
        <div className="md:hidden bg-netflix-black border-t border-gray-800">
          <div className="flex justify-around py-2">
            <Link
              to="/"
              className={`flex flex-col items-center py-2 px-4 ${
                isActive('/') ? 'text-white' : 'text-gray-400'
              }`}
            >
              <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L2 12.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-4.586l.293.293a1 1 0 001.414-1.414l-9-9z" />
              </svg>
              <span className="text-xs">Home</span>
            </Link>
            
            <Link
              to="/movies"
              className={`flex flex-col items-center py-2 px-4 ${
                isActive('/movies') ? 'text-white' : 'text-gray-400'
              }`}
            >
              <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4zm2 0h1V9h-1v2zm1-4V5h-1v2h1zm-4-2H7v2h6V5z" clipRule="evenodd" />
              </svg>
              <span className="text-xs">Movies</span>
            </Link>
            
            <Link
              to="/my-list"
              className={`flex flex-col items-center py-2 px-4 ${
                isActive('/my-list') ? 'text-white' : 'text-gray-400'
              }`}
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs">My List</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;