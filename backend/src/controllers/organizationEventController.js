// ============================================
// FILE 4: backend/src/controllers/organizationEventController.js
// ============================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all organization events for a tenant
 * GET /api/tenants/:tenantId/events
 */
const getOrganizationEvents = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { startDate, endDate, tags, search } = req.query;

    // Check permission
    if (req.userRole !== 'SUPER_ADMIN' && req.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot access other organizations events',
      });
    }

    // Build filter
    const where = { tenantId };

    // Date range filter
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

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      where.tags = { hasSome: tagArray };
    }

    // Search filter (title or description)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const events = await prisma.organizationEvent.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
    console.error('Get organization events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization events',
    });
  }
};

/**
 * Get organization event by ID
 * GET /api/tenants/:tenantId/events/:id
 */
const getOrganizationEventById = async (req, res) => {
  try {
    const { tenantId, id } = req.params;

    // Check permission
    if (req.userRole !== 'SUPER_ADMIN' && req.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot access other organizations events',
      });
    }

    const event = await prisma.organizationEvent.findUnique({
      where: { id },
      include: {
        tenant: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Verify event belongs to the tenant
    if (event.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'This event does not belong to your organization',
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Get organization event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization event',
    });
  }
};

/**
 * Create organization event
 * POST /api/tenants/:tenantId/events
 * Admin or User (with permission)
 */
const createOrganizationEvent = async (req, res) => {
  try {
    const { tenantId } = req.params;
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

    // Check permission
    if (req.userRole !== 'SUPER_ADMIN' && req.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot create events for other organizations',
      });
    }

    // Validate required fields
    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, start date, and end date are required',
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date',
      });
    }

    // Create event
    const event = await prisma.organizationEvent.create({
      data: {
        tenantId,
        title,
        description,
        startDate: start,
        endDate: end,
        isRecurring: isRecurring || false,
        recurrenceRule,
        tags: tags || [],
        metadata,
        createdById: req.userId,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Organization event created successfully',
      data: event,
    });
  } catch (error) {
    console.error('Create organization event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create organization event',
    });
  }
};

/**
 * Update organization event
 * PUT /api/tenants/:tenantId/events/:id
 * Admin or event creator
 */
const updateOrganizationEvent = async (req, res) => {
  try {
    const { tenantId, id } = req.params;
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

    // Check permission
    if (req.userRole !== 'SUPER_ADMIN' && req.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot update events for other organizations',
      });
    }

    // Check if event exists
    const existingEvent = await prisma.organizationEvent.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Verify event belongs to tenant
    if (existingEvent.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'This event does not belong to your organization',
      });
    }

    // Check if user can update (must be admin or creator)
    if (
      req.userRole !== 'SUPER_ADMIN' &&
      req.userRole !== 'ADMIN' &&
      existingEvent.createdById !== req.userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only update events you created or be an admin',
      });
    }

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before end date',
        });
      }
    }

    // Update event
    const event = await prisma.organizationEvent.update({
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
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Organization event updated successfully',
      data: event,
    });
  } catch (error) {
    console.error('Update organization event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization event',
    });
  }
};

/**
 * Delete organization event
 * DELETE /api/tenants/:tenantId/events/:id
 * Admin or event creator
 */
const deleteOrganizationEvent = async (req, res) => {
  try {
    const { tenantId, id } = req.params;

    // Check permission
    if (req.userRole !== 'SUPER_ADMIN' && req.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete events for other organizations',
      });
    }

    // Check if event exists
    const event = await prisma.organizationEvent.findUnique({
      where: { id },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Verify event belongs to tenant
    if (event.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'This event does not belong to your organization',
      });
    }

    // Check if user can delete (must be admin or creator)
    if (
      req.userRole !== 'SUPER_ADMIN' &&
      req.userRole !== 'ADMIN' &&
      event.createdById !== req.userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete events you created or be an admin',
      });
    }

    // Delete event
    await prisma.organizationEvent.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Organization event deleted successfully',
    });
  } catch (error) {
    console.error('Delete organization event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete organization event',
    });
  }
};

/**
 * Bulk create organization events
 * POST /api/tenants/:tenantId/events/bulk
 * Admin only
 */
const bulkCreateOrganizationEvents = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { events } = req.body;

    // Check permission
    if (req.userRole !== 'SUPER_ADMIN' && req.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot create events for other organizations',
      });
    }

    // Only admins can bulk create
    if (req.userRole !== 'SUPER_ADMIN' && req.userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can bulk create events',
      });
    }

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Events array is required',
      });
    }

    // Validate all events
    for (const event of events) {
      if (!event.title || !event.startDate || !event.endDate) {
        return res.status(400).json({
          success: false,
          message: 'Each event must have title, startDate, and endDate',
        });
      }
    }

    // Prepare events data
    const eventsData = events.map((event) => ({
      tenantId,
      title: event.title,
      description: event.description,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      isRecurring: event.isRecurring || false,
      recurrenceRule: event.recurrenceRule,
      tags: event.tags || [],
      metadata: event.metadata,
      createdById: req.userId,
    }));

    // Bulk create
    const result = await prisma.organizationEvent.createMany({
      data: eventsData,
      skipDuplicates: true,
    });

    res.status(201).json({
      success: true,
      message: `${result.count} organization events created successfully`,
      data: { count: result.count },
    });
  } catch (error) {
    console.error('Bulk create organization events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create organization events',
    });
  }
};

module.exports = {
  getOrganizationEvents,
  getOrganizationEventById,
  createOrganizationEvent,
  updateOrganizationEvent,
  deleteOrganizationEvent,
  bulkCreateOrganizationEvents,
};