import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../api/authService';
import { tenantService } from '../api/tenantService';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import Loading from '../components/common/Loading';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
const [showEditModal, setShowEditModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [tenantInfo, setTenantInfo] = useState(null);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(false);


  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const isUser = user?.role === 'USER';

  // Profile form
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // New user form (for super admin)
  const [newUserData, setNewUserData] = useState({
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  role: 'ADMIN', // Changer de 'USER' à 'ADMIN'
  tenantId: '', // Ajouter ce champ
});

  useEffect(() => {
    if (user?.tenant?.id) {
      fetchTenantInfo();
      if (isSuperAdmin) {
        fetchTenantUsers();
      }
    }
  }, [user]);
// Après le premier useEffect
useEffect(() => {
  if (isSuperAdmin && activeTab === 'users') {
    fetchAllTenants();
    fetchTenantUsers(); // ✅ AJOUTER CETTE LIGNE
  }
}, [isSuperAdmin, activeTab]);

  const fetchTenantInfo = async () => {
    try {
      const response = await tenantService.getTenantById(user.tenant.id);
      setTenantInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch tenant info:', error);
    }
  };

  const fetchTenantUsers = async () => {
  try {
    // Pour SUPER_ADMIN, charger tous les utilisateurs de toutes les organisations
    if (isSuperAdmin) {
      const response = await authService.getAllUsers(); // Vous devrez créer cette méthode
      setTenantUsers(response.data || []);
    } else {
      const response = await tenantService.getTenantById(user.tenant.id);
      setTenantUsers(response.data.users || []);
    }
  } catch (error) {
    console.error('Failed to fetch tenant users:', error);
  }
};

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };
  const handleUpdateUser = async (e) => {
  e.preventDefault();
  setLoading(true);
  setAlert(null);

  // Validate tenant for ADMIN role
  if (editingUser.role === 'ADMIN' && !editingUser.tenantId) {
    setAlert({ type: 'error', message: 'Please select an organization for Admin users' });
    setLoading(false);
    return;
  }

  try {
    await authService.updateUser(editingUser.id, {
      firstName: editingUser.firstName,
      lastName: editingUser.lastName,
      email: editingUser.email,
      role: editingUser.role,
      tenantId: editingUser.role === 'ADMIN' ? editingUser.tenantId : null,
    });

    setAlert({ type: 'success', message: 'User updated successfully!' });
    setShowEditModal(false);
    setEditingUser(null);
    fetchTenantUsers();
  } catch (error) {
    console.error('Failed to update user:', error);
    setAlert({
      type: 'error',
      message: error.response?.data?.message || 'Failed to update user',
    });
  } finally {
    setLoading(false);
  }
};
  const handleEditUser = (user) => {
  setEditingUser({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId || '',
  });
  setShowEditModal(true);
};
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNewUserChange = (e) => {
    setNewUserData({
      ...newUserData,
      [e.target.name]: e.target.value,
    });
  };

  const fetchAllTenants = async () => {
  setLoadingTenants(true);
  try {
    const response = await tenantService.getAllTenants();
    setTenants(response.data || []);
  } catch (error) {
    console.error('Failed to fetch tenants:', error);
    setAlert({
      type: 'error',
      message: 'Failed to load organizations',
    });
  } finally {
    setLoadingTenants(false);
  }
};
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      // For super admin, allow email update
      // For others, only update first and last name
      const updateData = isSuperAdmin
        ? { ...profileData }
        : { firstName: profileData.firstName, lastName: profileData.lastName };

      // Call API to update user profile
      await authService.updateProfile(updateData);
      updateUser({ ...user, ...updateData });
      setAlert({ type: 'success', message: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Failed to update profile:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setAlert({ type: 'error', message: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setAlert({ type: 'error', message: 'Password must be at least 6 characters' });
      setLoading(false);
      return;
    }

    try {
      await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      setAlert({ type: 'success', message: 'Password changed successfully!' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to change password',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    // Validate passwords match
    if (newUserData.password !== newUserData.confirmPassword) {
      setAlert({ type: 'error', message: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    // Validate password length
    if (newUserData.password.length < 6) {
      setAlert({ type: 'error', message: 'Password must be at least 6 characters' });
      setLoading(false);
      return;
    }

    try {
      // Register new user with tenant ID
      await authService.register({
  email: newUserData.email,
  password: newUserData.password,
  firstName: newUserData.firstName,
  lastName: newUserData.lastName,
  tenantId: newUserData.role === 'ADMIN' ? newUserData.tenantId : null, // ✅ NOUVEAU
  role: newUserData.role,
});
// Validate tenant selection for ADMIN role
if (newUserData.role === 'ADMIN' && !newUserData.tenantId) {
  setAlert({ type: 'error', message: 'Please select an organization for Admin users' });
  setLoading(false);
  return;
}
      setAlert({
        type: 'success',
        message: `${newUserData.role === 'SUPER_ADMIN' ? 'Super Admin' : newUserData.role === 'ADMIN' ? 'Admin' : 'User'} created successfully!`,
      });

      // Reset form
      setNewUserData({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        role: 'ADMIN',
        tenantId: '',
      });

      // Refresh user list
      fetchTenantUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to create user',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    setLoading(true);
    try {
      await authService.deleteUser(userId);
      setAlert({ type: 'success', message: 'User deleted successfully!' });
      fetchTenantUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete user',
      });
    } finally {
      setLoading(false);
    }
  };

  // Define tabs based on user role
  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'password', name: 'Password', icon: '🔒' },
    
  ];

  // Add user management tab only for super admin
  if (isSuperAdmin) {
    tabs.push({ id: 'users', name: 'User Management', icon: '👥' });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and organization settings</p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-md p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Profile Information
                </h2>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <Input
                    label="First Name"
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    required
                  />

                  <Input
                    label="Last Name"
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                    disabled={!isSuperAdmin}
                    helperText={
                      !isSuperAdmin
                        ? 'Only Super Admins can modify email addresses'
                        : ''
                    }
                  />

                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={loading}
                      disabled={loading}
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Change Password
                </h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />

                  <Input
                    label="New Password"
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />

                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={loading}
                      disabled={loading}
                    >
                      Change Password
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Organization Tab */}
            {activeTab === 'organization' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Organization Information
                </h2>
                {tenantInfo ? (
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Organization Name
                      </label>
                      <p className="text-lg font-semibold text-gray-800">
                        {tenantInfo.name}
                      </p>
                    </div>

                    <div className="border-b border-gray-200 pb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Organization ID
                      </label>
                      <p className="text-gray-600 font-mono">{tenantInfo.id}</p>
                    </div>

                    <div className="border-b border-gray-200 pb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Role
                      </label>
                      <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full font-medium">
                        {user?.role === 'SUPER_ADMIN'
                          ? 'Super Admin'
                          : user?.role === 'ADMIN'
                          ? 'Admin'
                          : 'User'}
                      </span>
                    </div>

                    <div className="border-b border-gray-200 pb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Member Since
                      </label>
                      <p className="text-gray-600">
                        {new Date(tenantInfo.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    {tenantInfo.subscriptionsCount !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Active Subscriptions
                        </label>
                        <p className="text-lg font-semibold text-gray-800">
                          {tenantInfo.subscriptionsCount} catalog(s)
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <Loading />
                )}
              </div>
            )}

            {/* User Management Tab (Super Admin Only) */}
            {activeTab === 'users' && isSuperAdmin && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  User Management
                </h2>

                {/* Add New User Form */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Add New User
                  </h3>
                  <form onSubmit={handleNewUserSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="First Name"
                        type="text"
                        name="firstName"
                        value={newUserData.firstName}
                        onChange={handleNewUserChange}
                        required
                      />

                      <Input
                        label="Last Name"
                        type="text"
                        name="lastName"
                        value={newUserData.lastName}
                        onChange={handleNewUserChange}
                        required
                      />
                    </div>

                    <Input
                      label="Email Address"
                      type="email"
                      name="email"
                      value={newUserData.email}
                      onChange={handleNewUserChange}
                      required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Password"
                        type="password"
                        name="password"
                        value={newUserData.password}
                        onChange={handleNewUserChange}
                        required
                      />

                      <Input
                        label="Confirm Password"
                        type="password"
                        name="confirmPassword"
                        value={newUserData.confirmPassword}
                        onChange={handleNewUserChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        User Role
                      </label>
                      <select
                        name="role"
                        value={newUserData.role}
                        onChange={handleNewUserChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        <option value="ADMIN">Organization Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                    </div>
                    {/* ⬇️ AJOUTER LE NOUVEAU SELECT ICI ⬇️ */}
{newUserData.role === 'ADMIN' && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Organization <span className="text-red-500">*</span>
    </label>
    {loadingTenants ? (
      <div className="text-gray-500">Loading organizations...</div>
    ) : (
      <select
        name="tenantId"
        value={newUserData.tenantId}
        onChange={handleNewUserChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        required
      >
        <option value="">-- Select an organization --</option>
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name} {tenant.country && `(${tenant.country})`}
          </option>
        ))}
      </select>
    )}
    <p className="text-xs text-gray-500 mt-1">
      Select the organization this admin will manage
    </p>
  </div>
)}

                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        loading={loading}
                        disabled={loading}
                      >
                        Add User
                      </Button>
                    </div>
                  </form>
                </div>
                <div>
  <h3 className="text-lg font-semibold text-gray-800 mb-4">
    Existing Users
  </h3>
  
  {loadingTenants ? (
    <Loading />
  ) : tenantUsers.length > 0 ? (
    <div className="space-y-3">
      {tenantUsers.map((tenantUser) => (
        <div
          key={tenantUser.id}
          className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold text-gray-800">
                {tenantUser.firstName} {tenantUser.lastName}
              </h4>
              <span
                className={`px-2 py-1 text-xs rounded-full font-medium ${
                  tenantUser.role === 'SUPER_ADMIN'
                    ? 'bg-purple-100 text-purple-700'
                    : tenantUser.role === 'ADMIN'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {tenantUser.role === 'SUPER_ADMIN'
                  ? 'Super Admin'
                  : tenantUser.role === 'ADMIN'
                  ? 'Admin'
                  : 'User'}
              </span>
            </div>
            <p className="text-sm text-gray-600">{tenantUser.email}</p>
            {tenantUser.tenant && (
              <p className="text-xs text-gray-500 mt-1">
                📋 Organization: {tenantUser.tenant.name}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => handleEditUser(tenantUser)}
              disabled={tenantUser.id === user.id}
            >
              ✏️ Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => handleDeleteUser(tenantUser.id)}
              disabled={tenantUser.id === user.id}
            >
              🗑️ Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-8 bg-gray-50 rounded-lg">
      <p className="text-gray-500">No users found</p>
    </div>
  )}
</div>

               
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Edit User Modal */}
{showEditModal && editingUser && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800">Edit User</h3>
          <button
            onClick={() => {
              setShowEditModal(false);
              setEditingUser(null);
            }}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              type="text"
              name="firstName"
              value={editingUser.firstName}
              onChange={(e) =>
                setEditingUser({ ...editingUser, firstName: e.target.value })
              }
              required
            />

            <Input
              label="Last Name"
              type="text"
              name="lastName"
              value={editingUser.lastName}
              onChange={(e) =>
                setEditingUser({ ...editingUser, lastName: e.target.value })
              }
              required
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            name="email"
            value={editingUser.email}
            onChange={(e) =>
              setEditingUser({ ...editingUser, email: e.target.value })
            }
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Role
            </label>
            <select
              name="role"
              value={editingUser.role}
              onChange={(e) =>
                setEditingUser({ ...editingUser, role: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="ADMIN">Organization Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>

          {editingUser.role === 'ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization <span className="text-red-500">*</span>
              </label>
              {loadingTenants ? (
                <div className="text-gray-500">Loading organizations...</div>
              ) : (
                <select
                  name="tenantId"
                  value={editingUser.tenantId}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, tenantId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Select an organization --</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} {tenant.country && `(${tenant.country})`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingUser(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default SettingsPage;