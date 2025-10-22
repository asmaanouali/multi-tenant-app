import axios from './axios';

export const authService = {
  // Login user
  login: async (email, password) => {
    const response = await axios.post('/auth/login', { email, password });
    return response.data;
  },

  // Register new user
  register: async (userData) => {
    const response = await axios.post('/auth/register', userData);
    return response.data;
  },

  // Get current user profile
  getMe: async () => {
    const response = await axios.get('/auth/me');
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await axios.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
  // Get all users (Super Admin only)
getAllUsers: async () => {
  const response = await axios.get('/users');
  return response.data;
},

// Update user (Super Admin only)
updateUser: async (userId, userData) => {
  const response = await axios.put(`/users/${userId}`, userData);
  return response.data;
},

// Delete user (Super Admin only)
deleteUser: async (userId) => {
  const response = await axios.delete(`/users/${userId}`);
  return response.data;
},
};