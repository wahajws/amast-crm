import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../UI/Logo';
import {
  FiHome,
  FiBriefcase,
  FiUsers,
  FiFileText,
  FiBell,
  FiTrendingUp,
  FiFile,
  FiMail,
  FiSend,
  FiSettings,
  FiUser,
  FiShield,
  FiUserCheck,
  FiTarget,
  FiUpload,
} from 'react-icons/fi';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  // Check if user has admin role
  const isAdmin = user?.role?.name === 'ADMIN' || user?.role?.name === 'SUPER_ADMIN';

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: FiHome,
      show: true,
    },
    {
      name: 'Accounts',
      path: '/accounts',
      icon: FiBriefcase,
      show: true,
    },
    {
      name: 'Contacts',
      path: '/contacts',
      icon: FiUsers,
      show: true,
    },
    {
      name: 'Notes',
      path: '/notes',
      icon: FiFileText,
      show: true,
    },
    {
      name: 'Reminders',
      path: '/reminders',
      icon: FiBell,
      show: true,
    },
    {
      name: 'Opportunities',
      path: '/opportunities',
      icon: FiTrendingUp,
      show: true,
    },
    {
      name: 'Proposals',
      path: '/proposals',
      icon: FiFile,
      show: true,
    },
    {
      name: 'Emails',
      path: '/emails',
      icon: FiMail,
      show: true,
    },
    {
      name: 'Gmail Integration',
      path: '/gmail',
      icon: FiSettings,
      show: true,
    },
    {
      name: 'Lead Generation',
      path: '/lead-generation',
      icon: FiTarget,
      show: true,
    },
    {
      name: 'Bulk Import',
      path: '/bulk-import',
      icon: FiUpload,
      show: true,
    },
    {
      name: 'Email Campaigns',
      path: '/email-campaigns',
      icon: FiSend,
      show: true,
    },
    {
      name: 'Email Dashboard',
      path: '/email-dashboard',
      icon: FiTrendingUp,
      show: true,
    },
    {
      name: 'Users',
      path: '/users',
      icon: FiUserCheck,
      show: isAdmin,
    },
    {
      name: 'Roles',
      path: '/roles',
      icon: FiShield,
      show: isAdmin,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-white via-white to-slate-50/50 border-r border-secondary-200/50 z-50 overflow-y-auto">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-secondary-200/50">
          <Logo />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl
                    transition-all duration-200 group
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                        : 'text-secondary-700 hover:bg-primary-50 hover:text-primary-600'
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-white' : 'text-secondary-500 group-hover:text-primary-600'
                    } transition-colors`}
                  />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              );
            })}
        </nav>

        {/* User Profile Link */}
        <div className="p-4 border-t border-secondary-200/50">
          <NavLink
            to="/profile"
            className={`
              flex items-center space-x-3 px-4 py-3 rounded-xl
              transition-all duration-200 group
              ${
                location.pathname === '/profile'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                  : 'text-secondary-700 hover:bg-primary-50 hover:text-primary-600'
              }
            `}
          >
            <FiUser
              className={`w-5 h-5 ${
                location.pathname === '/profile'
                  ? 'text-white'
                  : 'text-secondary-500 group-hover:text-primary-600'
              } transition-colors`}
            />
            <span className="font-medium">Profile</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
