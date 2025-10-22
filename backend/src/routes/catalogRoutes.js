// backend/src/routes/catalogRoutes.js - FIXED VERSION
const express = require('express');
const {
  getAllCatalogs,
  getCatalogById,
  createCatalog,
  updateCatalog,
  deleteCatalog,
  getCatalogStats,
} = require('../controllers/catalogController');
const {
  getCatalogEvents,
  getCatalogEventById,
  createCatalogEvent,
  updateCatalogEvent,
  deleteCatalogEvent,
  bulkCreateCatalogEvents,
} = require('../controllers/catalogEventController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ============================================
// CATALOG ROUTES
// ⚠️ IMPORTANT: Specific routes MUST come BEFORE dynamic parameter routes
// ============================================

// Get all catalogs (authenticated users can view)
router.get('/', authenticate, getAllCatalogs);

// Get catalog statistics (authenticated users)
// ✅ MUST be before /:id route
router.get('/stats', authenticate, getCatalogStats);

// Get event by ID (authenticated users)
// ✅ MUST be before /:id route to avoid conflict
router.get('/events/:id', authenticate, getCatalogEventById);

// Update event (Super Admin only)
// ✅ MUST be before /:id route to avoid conflict
router.put('/events/:id', authenticate, authorize('SUPER_ADMIN'), updateCatalogEvent);

// Delete event (Super Admin only)
// ✅ MUST be before /:id route to avoid conflict
router.delete('/events/:id', authenticate, authorize('SUPER_ADMIN'), deleteCatalogEvent);

// Get catalog by ID (authenticated users can view)
// ⚠️ This MUST come after specific routes like /stats and /events/:id
router.get('/:id', authenticate, getCatalogById);

// Create catalog (Super Admin only)
router.post('/', authenticate, authorize('SUPER_ADMIN'), createCatalog);

// Update catalog (Super Admin only)
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), updateCatalog);

// Delete catalog (Super Admin only)
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), deleteCatalog);

// ============================================
// CATALOG EVENT ROUTES (with catalogId)
// ============================================

// Get all events for a catalog (authenticated users)
router.get('/:catalogId/events', authenticate, getCatalogEvents);

// Create event (Super Admin only)
router.post('/:catalogId/events', authenticate, authorize('SUPER_ADMIN'), createCatalogEvent);

// Bulk create events (Super Admin only)
router.post('/:catalogId/events/bulk', authenticate, authorize('SUPER_ADMIN'), bulkCreateCatalogEvents);

module.exports = router;

/**
 * EXPLANATION OF ROUTE ORDERING:
 * 
 * Express matches routes in the order they are defined.
 * If you define /:id before /stats, Express will treat "stats" as an ID parameter.
 * 
 * WRONG ORDER (causes 404 errors):
 * /:id              -> This catches "stats" and "events" as IDs
 * /stats            -> Never reached
 * /events/:id       -> Never reached
 * 
 * CORRECT ORDER (works properly):
 * /stats            -> Matches /catalogs/stats
 * /events/:id       -> Matches /catalogs/events/123
 * /:id              -> Matches /catalogs/abc123
 * /:catalogId/events -> Matches /catalogs/abc123/events
 */