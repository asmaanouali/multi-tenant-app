import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES } from '../../utils/constants';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const role = user?.role;
  const isSuperAdmin = role === USER_ROLES.SUPER_ADMIN;
  const isAdmin = role === USER_ROLES.ADMIN;
  const isUser = role === USER_ROLES.USER;
  const isAdminOrUser = isAdmin || isUser;

  const isActive = (path) => location.pathname === path;

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: '📊',
      visible: true,
    },
    {
      name: 'Organizations',
      path: '/organizations',
      icon: '🏢',
      visible: isSuperAdmin, // ✅ Only Super Admin
    },
    {
      name: 'Calendar',
      path: '/calendar',
      icon: '📅',
      visible: isAdminOrUser, // ✅ Admin & User only
    },
    {
      name: 'Catalogs',
      path: '/catalogs',
      icon: '📚',
      visible: !isUser, // ✅ Everyone except User
    },
    
    {
      name: 'Settings',
      path: '/settings',
      icon: '⚙️',
      visible: true, // ✅ All roles
    },
  ];

  const filteredNavItems = navItems.filter((item) => item.visible);

  return (
    <aside className="w-64 bg-white shadow-lg h-screen sticky top-0">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Navigation</h2>
        <nav className="space-y-2">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg transition ${
                isActive(item.path)
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-2xl mr-3">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Organization Info */}
      {user?.tenant && (
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm">
            <p className="text-gray-600 font-medium">Organization</p>
            <p className="text-gray-800 font-semibold">{user.tenant.name}</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
