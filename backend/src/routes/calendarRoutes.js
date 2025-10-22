// ============================================
// FILE: backend/src/routes/calendarRoutes.js
// ============================================

const express = require('express');
const {
  getUnifiedCalendar,
  getCalendarStats,
  getEventsByMonth,
} = require('../controllers/calendarController');
const { authenticate, requireTenant } = require('../middleware/auth');

const router = express.Router();

/**
 * All calendar routes require authentication and tenant membership
 */

// Get unified calendar view (catalog + organization events)
router.get('/', authenticate, requireTenant, getUnifiedCalendar);

// Get calendar statistics
router.get('/stats', authenticate, requireTenant, getCalendarStats);

// Get events for a specific month
router.get('/month/:year/:month', authenticate, requireTenant, getEventsByMonth);

module.exports = router;