// ============================================
// FILE 2: backend/src/controllers/catalogEventController.js (FIXED)
// ============================================

// ✅ FIXED: Changed from ES6 imports to CommonJS
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all events for a catalog
 * GET /api/catalogs/:catalogId/events
 */
const getCatalogEvents = async (req, res) => {
  try {
    const { catalogId } = req.params;
    const { startDate, endDate, tags } = req.query;

    // Build filter
    const where = { catalogId };

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({
          startDate: { gte: new Date(startDate) },
        });
      }
      if (endDate) {
        where.AND.push({
          endDate: { lte: new Date(endDate) },
        });
      }
    }

    if (tags) {
      const tagArray = tags.split(',');
      where.tags = { hasSome: tagArray };
    }

    const events = await prisma.catalogEvent.findMany({
      where,
      include: {
        catalog: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    console.error('Get catalog events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch catalog events',
    });
  }
};

/**
 * Get event by ID
 * GET /api/catalogs/events/:id
 */
const getCatalogEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.catalogEvent.findUnique({
      where: { id },
      include: {
        catalog: true,
      },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
    });
  }
};

/**
 * Create catalog event
 * POST /api/catalogs/:catalogId/events
 * Super Admin only
 */
const createCatalogEvent = async (req, res) => {
  try {
    const { catalogId } = req.params;
    const {
      title,
      description,
      startDate,
      endDate,
      isRecurring,
      recurrenceRule,
      tags,
      metadata,
    } = req.body;

    // Validate required fields
    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, start date, and end date are required',
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

    // Create event
    const event = await prisma.catalogEvent.create({
      data: {
        catalogId,
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isRecurring: isRecurring || false,
        recurrenceRule,
        tags: tags || [],
        metadata,
      },
      include: {
        catalog: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
    });
  }
};

/**
 * Update catalog event
 * PUT /api/catalogs/events/:id
 * Super Admin only
 */
const updateCatalogEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      startDate,
      endDate,
      isRecurring,
      recurrenceRule,
      tags,
      metadata,
    } = req.body;

    // Check if event exists
    const existingEvent = await prisma.catalogEvent.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Update event
    const event = await prisma.catalogEvent.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(recurrenceRule !== undefined && { recurrenceRule }),
        ...(tags && { tags }),
        ...(metadata !== undefined && { metadata }),
      },
      include: {
        catalog: true,
      },
    });

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event,
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
    });
  }
};

/**
 * Delete catalog event
 * DELETE /api/catalogs/events/:id
 * Super Admin only
 */
const deleteCatalogEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists
    const event = await prisma.catalogEvent.findUnique({
      where: { id },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Delete event
    await prisma.catalogEvent.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
    });
  }
};

/**
 * Bulk create catalog events
 * POST /api/catalogs/:catalogId/events/bulk
 * Super Admin only
 */
const bulkCreateCatalogEvents = async (req, res) => {
  try {
    const { catalogId } = req.params;
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Events array is required',
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

    // Prepare events data
    const eventsData = events.map((event) => ({
      catalogId,
      title: event.title,
      description: event.description,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      isRecurring: event.isRecurring || false,
      recurrenceRule: event.recurrenceRule,
      tags: event.tags || [],
      metadata: event.metadata,
    }));

    // Bulk create
    const result = await prisma.catalogEvent.createMany({
      data: eventsData,
      skipDuplicates: true,
    });

    res.status(201).json({
      success: true,
      message: `${result.count} events created successfully`,
      data: { count: result.count },
    });
  } catch (error) {
    console.error('Bulk create events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create events',
    });
  }
};

// ✅ FIXED: Changed from ES6 exports to CommonJS
module.exports = {
  getCatalogEvents,
  getCatalogEventById,
  createCatalogEvent,
  updateCatalogEvent,
  deleteCatalogEvent,
  bulkCreateCatalogEvents,
};