// ============================================
// FILE 3: backend/src/controllers/subscriptionController.js
// ============================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all subscriptions for a tenant
 * GET /api/tenants/:tenantId/subscriptions
 */
const getTenantSubscriptions = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check permission
    if (req.userRole !== 'SUPER_ADMIN' && req.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot access other organizations',
      });
    }

    const subscriptions = await prisma.catalogSubscription.findMany({
      where: { tenantId },
      include: {
        catalog: {
          include: {
            _count: {
              select: {
                events: true,
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
      data: subscriptions,
      count: subscriptions.length,
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
    });
  }
};

/**
 * Subscribe to a catalog
 * POST /api/tenants/:tenantId/subscriptions
 * Organization Admin or Super Admin
 */
const subscribeToCatalog = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { catalogId } = req.body;

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
        message: 'Only organization admins can manage subscriptions',
      });
    }

    if (!catalogId) {
      return res.status(400).json({
        success: false,
        message: 'Catalog ID is required',
      });
    }

    // Check if catalog exists
    const catalog = await prisma.catalog.findUnique({
      where: { id: catalogId },
    });

    if (!catalog) {
      return res.status(404).json({
        success: false,
        message: 'Catalog not found',
      });
    }

    // Check if catalog is active
    if (!catalog.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot subscribe to an inactive catalog',
      });
    }

    // Check if subscription already exists
    const existingSubscription = await prisma.catalogSubscription.findUnique({
      where: {
        tenantId_catalogId: {
          tenantId,
          catalogId,
        },
      },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Already subscribed to this catalog',
      });
    }

    // Create subscription
    const subscription = await prisma.catalogSubscription.create({
      data: {
        tenantId,
        catalogId,
        isActive: true,
      },
      include: {
        catalog: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to catalog',
      data: subscription,
    });
  } catch (error) {
    console.error('Subscribe to catalog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe to catalog',
    });
  }
};

/**
 * Update subscription (activate/deactivate)
 * PUT /api/tenants/:tenantId/subscriptions/:subscriptionId
 * Organization Admin or Super Admin
 */
const updateSubscription = async (req, res) => {
  try {
    const { tenantId, subscriptionId } = req.params;
    const { isActive } = req.body;

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
        message: 'Only organization admins can manage subscriptions',
      });
    }

    // Check if subscription exists
    const existingSubscription = await prisma.catalogSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!existingSubscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    // Verify subscription belongs to the tenant
    if (existingSubscription.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'This subscription does not belong to your organization',
      });
    }

    // Update subscription
    const subscription = await prisma.catalogSubscription.update({
      where: { id: subscriptionId },
      data: {
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        catalog: true,
      },
    });

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: subscription,
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
    });
  }
};

/**
 * Unsubscribe from a catalog
 * DELETE /api/tenants/:tenantId/subscriptions/:subscriptionId
 * Organization Admin or Super Admin
 */
const unsubscribeFromCatalog = async (req, res) => {
  try {
    const { tenantId, subscriptionId } = req.params;

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
        message: 'Only organization admins can manage subscriptions',
      });
    }

    // Check if subscription exists
    const subscription = await prisma.catalogSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        catalog: {
          select: {
            name: true,
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

    // Verify subscription belongs to the tenant
    if (subscription.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'This subscription does not belong to your organization',
      });
    }

    // Delete subscription
    await prisma.catalogSubscription.delete({
      where: { id: subscriptionId },
    });

    res.json({
      success: true,
      message: `Successfully unsubscribed from ${subscription.catalog.name}`,
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe from catalog',
    });
  }
};

/**
 * Get available catalogs for subscription
 * GET /api/tenants/:tenantId/subscriptions/available
 */
const getAvailableCatalogs = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check permission
    if (req.userRole !== 'SUPER_ADMIN' && req.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot access other organizations',
      });
    }

    // Get existing subscriptions
    const existingSubscriptions = await prisma.catalogSubscription.findMany({
      where: { tenantId },
      select: { catalogId: true },
    });

    const subscribedCatalogIds = existingSubscriptions.map(sub => sub.catalogId);

    // Get available catalogs (active and not subscribed)
    const availableCatalogs = await prisma.catalog.findMany({
      where: {
        isActive: true,
        id: {
          notIn: subscribedCatalogIds,
        },
      },
      include: {
        _count: {
          select: {
            events: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: availableCatalogs,
      count: availableCatalogs.length,
    });
  } catch (error) {
    console.error('Get available catalogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available catalogs',
    });
  }
};

module.exports = {
  getTenantSubscriptions,
  subscribeToCatalog,
  updateSubscription,
  unsubscribeFromCatalog,
  getAvailableCatalogs,
};