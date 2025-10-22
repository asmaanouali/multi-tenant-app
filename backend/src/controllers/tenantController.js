// ============================================
// backend/src/controllers/tenantController.js - COMPLETE
// ============================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all tenants
 * GET /api/tenants
 */
const getAllTenants = async (req, res) => {
  try {
    const { userRole, tenantId } = req;

    let tenants;

    if (userRole === 'SUPER_ADMIN') {
      // Super admin can see all tenants
      tenants = await prisma.tenant.findMany({
        include: {
          _count: {
            select: {
              users: true,
              catalogSubscriptions: true,
              organizationEvents: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    } else {
      // Regular users can only see their own tenant
      tenants = await prisma.tenant.findMany({
        where: { id: tenantId },
        include: {
          _count: {
            select: {
              users: true,
              catalogSubscriptions: true,
              organizationEvents: true,
            },
          },
        },
      });
    }

    res.json({
      success: true,
      data: tenants,
      count: tenants.length,
    });
  } catch (error) {
    console.error('getAllTenants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenants',
      error: error.message,
    });
  }
};

/**
 * Get tenant by ID
 * GET /api/tenants/:id
 */
const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            catalogSubscriptions: true,
            eventSubscriptions: true,
            organizationEvents: true,
          },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    res.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error('getTenantById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant',
      error: error.message,
    });
  }
};

/**
 * Get tenant statistics
 * GET /api/tenants/:id/stats
 */
const getTenantStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Get statistics
    const [
      totalUsers,
      catalogSubscriptions,
      eventSubscriptions,
      organizationEvents,
      activeUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { tenantId: id } }),
      prisma.catalogSubscription.count({ where: { tenantId: id, isActive: true } }),
      prisma.eventSubscription.count({ where: { tenantId: id, isVisible: true } }),
      prisma.organizationEvent.count({ where: { tenantId: id } }),
      prisma.user.count({ where: { tenantId: id, isActive: true } }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        catalogSubscriptions,
        eventSubscriptions,
        organizationEvents,
        tenantInfo: {
          id: tenant.id,
          name: tenant.name,
          isActive: tenant.isActive,
        },
      },
    });
  } catch (error) {
    console.error('getTenantStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant statistics',
      error: error.message,
    });
  }
};

/**
 * Create a new tenant
 * POST /api/tenants
 * Super Admin only
 */
const createTenant = async (req, res) => {
  try {
    const { name, metadata } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Tenant name is required',
      });
    }

    // Check if tenant with same name exists
    const existingTenant = await prisma.tenant.findFirst({
      where: { name },
    });

    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: 'A tenant with this name already exists',
      });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        metadata: metadata || {},
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: tenant,
    });
  } catch (error) {
    console.error('createTenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tenant',
      error: error.message,
    });
  }
};

/**
 * Update tenant
 * PUT /api/tenants/:id
 */
const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive, metadata } = req.body;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(metadata && { metadata }),
      },
    });

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: updatedTenant,
    });
  } catch (error) {
    console.error('updateTenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant',
      error: error.message,
    });
  }
};

/**
 * Delete tenant
 * DELETE /api/tenants/:id
 * Super Admin only
 */
const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    // Check if tenant has users
    if (tenant._count.users > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete tenant with existing users. Please remove all users first.',
      });
    }

    await prisma.tenant.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Tenant deleted successfully',
    });
  } catch (error) {
    console.error('deleteTenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tenant',
      error: error.message,
    });
  }
};

/**
 * Subscribe an organization to a specific event inside a catalog
 * POST /api/tenants/:tenantId/catalogs/:catalogId/events/:eventId/subscribe
 * Organization Admin or Super Admin
 */
const subscribeToEvent = async (req, res) => {
  try {
    const { tenantId, catalogId, eventId } = req.params;

    console.log('🔔 subscribeToEvent called:', { tenantId, catalogId, eventId });

    // Check permission
    if (req.userRole !== 'SUPER_ADMIN' && req.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot manage subscriptions for other organizations',
      });
    }

    // Check if user is admin of the tenant
    if (req.userRole !== 'SUPER_ADMIN' && req.userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only organization admins can subscribe to events',
      });
    }

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({ 
      where: { id: tenantId } 
    });
    
    if (!tenant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }

    // Check if event exists
    const event = await prisma.catalogEvent.findUnique({ 
      where: { id: eventId },
      include: {
        catalog: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
    
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    // Verify event belongs to the catalog
    if (event.catalogId !== catalogId) {
      return res.status(400).json({
        success: false,
        message: 'Event does not belong to this catalog',
      });
    }

    // Check if already subscribed
    const existingSubscription = await prisma.eventSubscription.findUnique({
      where: { 
        tenantId_catalogEventId: {
          tenantId,
          catalogEventId: eventId,
        }
      },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Already subscribed to this event',
      });
    }

    // Create subscription
    const subscription = await prisma.eventSubscription.create({
      data: {
        tenantId,
        catalogEventId: eventId,
        isVisible: true,
      },
      include: {
        catalogEvent: {
          include: {
            catalog: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    console.log('✅ Event subscription created:', subscription.id);

    res.status(201).json({ 
      success: true, 
      message: 'Subscribed to event successfully',
      data: {
        subscription,
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          catalog: event.catalog,
        },
      },
    });
  } catch (error) {
    console.error('subscribeToEvent error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to subscribe to event',
      error: error.message,
    });
  }
};

/**
 * Unsubscribe an organization from a specific event
 * DELETE /api/tenants/:tenantId/catalogs/:catalogId/events/:eventId/unsubscribe
 * Organization Admin or Super Admin
 */
const unsubscribeFromEvent = async (req, res) => {
  try {
    const { tenantId, catalogId, eventId } = req.params;

    console.log('🔕 unsubscribeFromEvent called:', { tenantId, catalogId, eventId });

    // Check permission
    if (req.userRole !== 'SUPER_ADMIN' && req.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot manage subscriptions for other organizations',
      });
    }

    // Check if user is admin of the tenant
    if (req.userRole !== 'SUPER_ADMIN' && req.userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only organization admins can unsubscribe from events',
      });
    }

    // Check if subscription exists
    const subscription = await prisma.eventSubscription.findUnique({
      where: { 
        tenantId_catalogEventId: {
          tenantId,
          catalogEventId: eventId,
        }
      },
      include: {
        catalogEvent: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    // Delete subscription
    await prisma.eventSubscription.delete({
      where: { 
        tenantId_catalogEventId: {
          tenantId,
          catalogEventId: eventId,
        }
      },
    });

    console.log('✅ Event subscription deleted');

    res.json({ 
      success: true, 
      message: `Unsubscribed from "${subscription.catalogEvent.title}" successfully` 
    });
  } catch (error) {
    console.error('unsubscribeFromEvent error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to unsubscribe from event',
      error: error.message,
    });
  }
};

/**
 * Check if tenant is subscribed to a specific event
 * GET /api/tenants/:tenantId/catalogs/:catalogId/events/:eventId/subscription-status
 */
const getEventSubscriptionStatus = async (req, res) => {
  try {
    const { tenantId, catalogId, eventId } = req.params;

    // Check permission
    if (req.userRole !== 'SUPER_ADMIN' && req.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot access other organizations',
      });
    }

    const subscription = await prisma.eventSubscription.findUnique({
      where: { 
        tenantId_catalogEventId: {
          tenantId,
          catalogEventId: eventId,
        }
      },
    });

    res.json({
      success: true,
      data: {
        isSubscribed: !!subscription,
        subscription: subscription || null,
      },
    });
  } catch (error) {
    console.error('getEventSubscriptionStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check subscription status',
    });
  }
};

/**
 * Get all event subscriptions for a tenant
 * GET /api/tenants/:tenantId/event-subscriptions
 */
const getTenantEventSubscriptions = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check permission
    if (req.userRole !== 'SUPER_ADMIN' && req.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot access other organizations',
      });
    }

    const eventSubscriptions = await prisma.eventSubscription.findMany({
      where: { 
        tenantId,
        isVisible: true,
      },
      include: {
        catalogEvent: {
          include: {
            catalog: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        subscribedAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: eventSubscriptions,
      count: eventSubscriptions.length,
    });
  } catch (error) {
    console.error('getTenantEventSubscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event subscriptions',
    });
  }
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
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
};