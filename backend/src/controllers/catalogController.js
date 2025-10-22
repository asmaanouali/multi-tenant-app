// ============================================
// FILE 1: backend/src/controllers/catalogController.js
// ============================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all catalogs
 * GET /api/catalogs
 */
const getAllCatalogs = async (req, res) => {
  try {
    const { type, country, region, isActive } = req.query;

    // Build filter
    const where = {};
    if (type) where.type = type;
    if (country) where.country = country;
    if (region) where.region = region;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const catalogs = await prisma.catalog.findMany({
      where,
      include: {
        _count: {
          select: {
            events: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: catalogs,
      count: catalogs.length,
    });
  } catch (error) {
    console.error('Get catalogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch catalogs',
    });
  }
};

/**
 * Get catalog by ID
 * GET /api/catalogs/:id
 */
const getCatalogById = async (req, res) => {
  try {
    const { id } = req.params;

    const catalog = await prisma.catalog.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: {
            startDate: 'asc',
          },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!catalog) {
      return res.status(404).json({
        success: false,
        message: 'Catalog not found',
      });
    }

    res.json({
      success: true,
      data: catalog,
    });
  } catch (error) {
    console.error('Get catalog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch catalog',
    });
  }
};

/**
 * Create new catalog
 * POST /api/catalogs
 * Super Admin only
 */
const createCatalog = async (req, res) => {
  try {
    const { name, description, type, country, region, isActive } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and type are required',
      });
    }

    // Validate type
    const validTypes = ['WORLD_SPECIAL_DAYS', 'NATIONAL_HOLIDAYS', 'REGIONAL_HOLIDAYS'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid catalog type',
      });
    }

    // Create catalog
    const catalog = await prisma.catalog.create({
      data: {
        name,
        description,
        type,
        country,
        region,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Catalog created successfully',
      data: catalog,
    });
  } catch (error) {
    console.error('Create catalog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create catalog',
    });
  }
};

/**
 * Update catalog
 * PUT /api/catalogs/:id
 * Super Admin only
 */
const updateCatalog = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, country, region, isActive } = req.body;

    // Check if catalog exists
    const existingCatalog = await prisma.catalog.findUnique({
      where: { id },
    });

    if (!existingCatalog) {
      return res.status(404).json({
        success: false,
        message: 'Catalog not found',
      });
    }

    // Update catalog
    const catalog = await prisma.catalog.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(country !== undefined && { country }),
        ...(region !== undefined && { region }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({
      success: true,
      message: 'Catalog updated successfully',
      data: catalog,
    });
  } catch (error) {
    console.error('Update catalog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update catalog',
    });
  }
};

/**
 * Delete catalog
 * DELETE /api/catalogs/:id
 * Super Admin only
 */
const deleteCatalog = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if catalog exists
    const catalog = await prisma.catalog.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!catalog) {
      return res.status(404).json({
        success: false,
        message: 'Catalog not found',
      });
    }

    // Delete catalog (cascade will delete events and subscriptions)
    await prisma.catalog.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Catalog deleted successfully',
      data: {
        deletedEventsCount: catalog._count.events,
      },
    });
  } catch (error) {
    console.error('Delete catalog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete catalog',
    });
  }
};

/**
 * Get catalog statistics
 * GET /api/catalogs/stats
 */
const getCatalogStats = async (req, res) => {
  try {
    const totalCatalogs = await prisma.catalog.count();
    const activeCatalogs = await prisma.catalog.count({
      where: { isActive: true },
    });

    const catalogsByType = await prisma.catalog.groupBy({
      by: ['type'],
      _count: true,
    });

    const totalEvents = await prisma.catalogEvent.count();
    const totalSubscriptions = await prisma.eventSubscription.count();

    res.json({
      success: true,
      data: {
        totalCatalogs,
        activeCatalogs,
        inactiveCatalogs: totalCatalogs - activeCatalogs,
        catalogsByType,
        totalEvents,
        totalSubscriptions,
      },
    });
  } catch (error) {
    console.error('Get catalog stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch catalog statistics',
    });
  }
};

module.exports = {
  getAllCatalogs,
  getCatalogById,
  createCatalog,
  updateCatalog,
  deleteCatalog,
  getCatalogStats,
};