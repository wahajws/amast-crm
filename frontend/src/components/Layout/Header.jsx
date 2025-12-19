import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiBell, FiSearch, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-secondary-200/50 sticky top-0 z-40 shadow-sm">
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-xl min-w-0">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-11 pr-4 py-2.5 border border-secondary-200 rounded-xl bg-white/50 backdrop-blur-sm 
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 
                         transition-all duration-200 shadow-sm hover:shadow"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className="relative p-2.5 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 group">
            <FiBell className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 p-1.5 pr-3 rounded-xl hover:bg-primary-50 transition-all duration-200 group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/30 group-hover:shadow-lg group-hover:scale-105 transition-all">
                {user?.firstName?.[0] || user?.email?.[0] || 'U'}
              </div>
              <span className="hidden md:block text-sm font-semibold text-secondary-700">
                {user?.firstName || user?.email}
              </span>
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-large border border-secondary-200/50 py-2 z-20 animate-slide-down">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-secondary-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent hover:text-primary-600 flex items-center space-x-3 transition-all duration-200"
                  >
                    <FiUser className="w-4 h-4" />
                    <span className="font-medium">Profile</span>
                  </button>
                  <div className="border-t border-secondary-100 my-1"></div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-transparent flex items-center space-x-3 transition-all duration-200 font-medium"
                  >
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

