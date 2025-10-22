import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES } from '../../utils/constants';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user?.role;
  const isSuperAdmin = role === USER_ROLES.SUPER_ADMIN;
  const isAdmin = role === USER_ROLES.ADMIN;
  const isUser = role === USER_ROLES.USER;
  const isAdminOrUser = isAdmin || isUser;

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">📅</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-800">
                CalendarSync
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition"
            >
              Dashboard
            </Link>

            {/* Organizations — Super Admin only */}
            {isSuperAdmin && (
              <Link
                to="/organizations"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition"
              >
                Organizations
              </Link>
            )}

            {/* Calendar — Admin & User only */}
            {isAdminOrUser && (
              <Link
                to="/calendar"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition"
              >
                Calendar
              </Link>
            )}

            {/* Catalogs — Everyone except User */}
            {!isUser && (
              <Link
                to="/catalogs"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition"
              >
                Catalogs
              </Link>
            )}

            

            {/* Settings — All roles */}
            <Link
              to="/settings"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition"
            >
              Settings
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              <span className="font-medium">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
