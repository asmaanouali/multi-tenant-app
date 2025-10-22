// ============================================
// FILE 5: backend/src/routes/authRoutes.js
// ============================================

const express = require('express');
const {
  login,
  register,
  getMe,
  changePassword,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, changePassword);

module.exports = router;