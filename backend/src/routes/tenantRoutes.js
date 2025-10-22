// ============================================
// backend/src/routes/tenantRoutes.js - UPDATED
// ============================================

const express = require('express');
const {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantStats,
  subscribeToEvent,
  unsubscribeFromEvent,
  getEventSubscriptionStatus,
  getTenantEventSubscriptions,
} = require('../controllers/tenantController');
const {
  getTenantSubscriptions,
  subscribeToCatalog,
  updateSubscription,
  unsubscribeFromCatalog,
  getAvailableCatalogs,
} = require('../controllers/subscriptionController');
const {
  getOrganizationEvents,
  getOrganizationEventById,
  createOrganizationEvent,
  updateOrganizationEvent,
  deleteOrganizationEvent,
  bulkCreateOrganizationEvents,
} = require('../controllers/organizationEventController');
const { authenticate, authorize, validateTenantAccess } = require('../middleware/auth');

const router = express.Router();

// ============================================
// TENANT ROUTES
// ============================================

router.get('/', authenticate, getAllTenants);
router.get('/:id', authenticate, validateTenantAccess, getTenantById);
router.get('/:id/stats', authenticate, validateTenantAccess, getTenantStats);
router.post('/', authenticate, authorize('SUPER_ADMIN'), createTenant);
router.put('/:id', authenticate, validateTenantAccess, updateTenant);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), deleteTenant);

// ============================================
// CATALOG SUBSCRIPTION ROUTES
// ============================================

router.get('/:tenantId/subscriptions', authenticate, validateTenantAccess, getTenantSubscriptions);
router.get('/:tenantId/subscriptions/available', authenticate, validateTenantAccess, getAvailableCatalogs);
router.post('/:tenantId/subscriptions', authenticate, validateTenantAccess, authorize('ADMIN', 'SUPER_ADMIN'), subscribeToCatalog);
router.put('/:tenantId/subscriptions/:subscriptionId', authenticate, validateTenantAccess, authorize('ADMIN', 'SUPER_ADMIN'), updateSubscription);
router.delete('/:tenantId/subscriptions/:subscriptionId', authenticate, validateTenantAccess, authorize('ADMIN', 'SUPER_ADMIN'), unsubscribeFromCatalog);

// ============================================
// EVENT SUBSCRIPTION ROUTES (Individual events)
// ============================================

// Get all event subscriptions for a tenant
router.get(
  '/:tenantId/event-subscriptions',
  authenticate,
  validateTenantAccess,
  getTenantEventSubscriptions
);

// Check subscription status for a specific event
router.get(
  '/:tenantId/catalogs/:catalogId/events/:eventId/subscription-status',
  authenticate,
  validateTenantAccess,
  getEventSubscriptionStatus
);

// Subscribe to a specific event (Admin only)
router.post(
  '/:tenantId/catalogs/:catalogId/events/:eventId/subscribe',
  authenticate,
  validateTenantAccess,
  authorize('ADMIN', 'SUPER_ADMIN'),
  subscribeToEvent
);

// Unsubscribe from a specific event (Admin only)
router.delete(
  '/:tenantId/catalogs/:catalogId/events/:eventId/unsubscribe',
  authenticate,
  validateTenantAccess,
  authorize('ADMIN', 'SUPER_ADMIN'),
  unsubscribeFromEvent
);

// ============================================
// ORGANIZATION EVENT ROUTES
// ============================================

router.get('/:tenantId/events', authenticate, validateTenantAccess, getOrganizationEvents);
router.get('/:tenantId/events/:id', authenticate, validateTenantAccess, getOrganizationEventById);
router.post('/:tenantId/events', authenticate, validateTenantAccess, createOrganizationEvent);
router.put('/:tenantId/events/:id', authenticate, validateTenantAccess, updateOrganizationEvent);
router.delete('/:tenantId/events/:id', authenticate, validateTenantAccess, deleteOrganizationEvent);
router.post('/:tenantId/events/bulk', authenticate, validateTenantAccess, authorize('ADMIN', 'SUPER_ADMIN'), bulkCreateOrganizationEvents);

module.exports = router;