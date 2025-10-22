// ============================================
// FIXED: backend/src/controllers/calendarController.js
// ============================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get unified calendar view (Catalog events + Organization events + Individual Event Subscriptions)
 * GET /api/calendar
 */
const getUnifiedCalendar = async (req, res) => {
  try {
    const { startDate, endDate, tags, search, source, country, region, type } = req.query;
    const userId = req.userId;
    const tenantId = req.tenantId;
    const userRole = req.userRole;

    console.log('📅 getUnifiedCalendar called:', { userId, tenantId, userRole, source, startDate, endDate });

    // Users must belong to an organization
    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You must belong to an organization to view the calendar',
      });
    }

    // Build tags filter
    const tagsFilter = tags ? tags.split(',').map(tag => tag.trim()) : null;

    // ========================================
    // 1. Get subscribed catalogs (catalog-level subscriptions)
    // ========================================
    const catalogSubscriptions = await prisma.catalogSubscription.findMany({
      where: { tenantId, isActive: true },
      select: {
        catalogId: true,
        catalog: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    console.log('📚 Subscribed catalogs:', catalogSubscriptions.length);

    const subscribedCatalogIds = catalogSubscriptions.map(sub => sub.catalogId);

    // ========================================
    // 2. Get individually subscribed events (event-level subscriptions)
    // ========================================
    const eventSubscriptions = await prisma.eventSubscription.findMany({
      where: { 
        tenantId,
        isVisible: true
      },
      select: {
        catalogEventId: true,
        catalogEvent: {
          select: {
            id: true,
            catalogId: true,
            title: true,
          },
        },
      },
    });

    console.log('📌 Individual event subscriptions:', eventSubscriptions.length);

    const subscribedEventIds = eventSubscriptions.map(sub => sub.catalogEventId);

    // ========================================
    // 3. Build catalog events filter
    // ========================================
    let catalogEventsWhere = {};
    
    // CRITICAL: Check if we have ANY subscriptions at all
    const hasAnySubscriptions = subscribedCatalogIds.length > 0 || subscribedEventIds.length > 0;
    
    if (hasAnySubscriptions) {
      catalogEventsWhere.OR = [];
      
      // Add catalog-level subscriptions
      if (subscribedCatalogIds.length > 0) {
        catalogEventsWhere.OR.push({ catalogId: { in: subscribedCatalogIds } });
        console.log('✅ Adding catalog IDs:', subscribedCatalogIds);
      }
      
      // Add individual event subscriptions
      if (subscribedEventIds.length > 0) {
        catalogEventsWhere.OR.push({ id: { in: subscribedEventIds } });
        console.log('✅ Adding event IDs:', subscribedEventIds);
      }
    } else {
      // No subscriptions at all - return empty results for catalog events
      console.log('⚠️ No subscriptions found, skipping catalog events');
      catalogEventsWhere = { id: 'no-subscriptions' };
    }

    // Apply date filters
    if (startDate && endDate) {
      if (!catalogEventsWhere.AND) catalogEventsWhere.AND = [];
      catalogEventsWhere.AND.push(
        { startDate: { gte: new Date(startDate) } },
        { startDate: { lte: new Date(endDate) } }
      );
    } else if (startDate) {
      if (!catalogEventsWhere.AND) catalogEventsWhere.AND = [];
      catalogEventsWhere.AND.push({ startDate: { gte: new Date(startDate) } });
    } else if (endDate) {
      if (!catalogEventsWhere.AND) catalogEventsWhere.AND = [];
      catalogEventsWhere.AND.push({ startDate: { lte: new Date(endDate) } });
    }

    // Apply tags filter (backend)
    if (tagsFilter && tagsFilter.length > 0) {
      if (!catalogEventsWhere.AND) catalogEventsWhere.AND = [];
      catalogEventsWhere.AND.push({ tags: { hasSome: tagsFilter } });
    }

    // Apply search filter (backend)
    if (search) {
      if (!catalogEventsWhere.AND) catalogEventsWhere.AND = [];
      catalogEventsWhere.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      });
    }

    // Apply country filter (backend)
    if (country && country !== 'all') {
      if (!catalogEventsWhere.AND) catalogEventsWhere.AND = [];
      catalogEventsWhere.AND.push({ country });
    }

    // Apply region filter (backend)
    if (region && region !== 'all') {
      if (!catalogEventsWhere.AND) catalogEventsWhere.AND = [];
      catalogEventsWhere.AND.push({ region });
    }

    // Filter by catalog type if provided
    if (type && hasAnySubscriptions) {
      const filteredCatalogIds = catalogSubscriptions
        .filter(sub => sub.catalog.type === type)
        .map(sub => sub.catalogId);
      
      console.log('🔍 Filtering by type:', type, 'Catalog IDs:', filteredCatalogIds);
      
      // Rebuild OR condition to respect type filtering
      catalogEventsWhere.OR = [];
      
      if (filteredCatalogIds.length > 0) {
        catalogEventsWhere.OR.push({ catalogId: { in: filteredCatalogIds } });
      }
      
      // For individually subscribed events, check if they match the type
      if (subscribedEventIds.length > 0) {
        const eventsInFilteredCatalogs = await prisma.catalogEvent.findMany({
          where: {
            id: { in: subscribedEventIds },
            catalogId: { in: filteredCatalogIds.length > 0 ? filteredCatalogIds : subscribedCatalogIds }
          },
          select: { id: true }
        });
        const filteredEventIds = eventsInFilteredCatalogs.map(e => e.id);
        
        if (filteredEventIds.length > 0) {
          catalogEventsWhere.OR.push({ id: { in: filteredEventIds } });
        }
      }
      
      // If no matching catalogs/events after type filter, return none
      if (catalogEventsWhere.OR.length === 0) {
        catalogEventsWhere = { id: 'no-match-for-type' };
      }
    }

    // ========================================
    // 4. Get catalog events (from both sources)
    // ========================================
    let catalogEvents = [];
    if (hasAnySubscriptions && (!source || source === 'all' || source === 'catalog')) {
      console.log('🔎 Querying catalog events with filter:', JSON.stringify(catalogEventsWhere, null, 2));
      
      catalogEvents = await prisma.catalogEvent.findMany({
        where: catalogEventsWhere,
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
      
      console.log('📋 Catalog events found:', catalogEvents.length);
    }

    // ========================================
    // 5. Build organization events filter
    // ========================================
    const orgEventsWhere = {
      tenantId,
    };

    // Apply date filters
    if (startDate && endDate) {
      orgEventsWhere.AND = [
        { startDate: { gte: new Date(startDate) } },
        { startDate: { lte: new Date(endDate) } }
      ];
    } else if (startDate) {
      if (!orgEventsWhere.AND) orgEventsWhere.AND = [];
      orgEventsWhere.AND.push({ startDate: { gte: new Date(startDate) } });
    } else if (endDate) {
      if (!orgEventsWhere.AND) orgEventsWhere.AND = [];
      orgEventsWhere.AND.push({ startDate: { lte: new Date(endDate) } });
    }

    // Apply tags filter (backend)
    if (tagsFilter && tagsFilter.length > 0) {
      if (!orgEventsWhere.AND) orgEventsWhere.AND = [];
      orgEventsWhere.AND.push({ tags: { hasSome: tagsFilter } });
    }

    // Apply search filter (backend)
    if (search) {
      if (!orgEventsWhere.AND) orgEventsWhere.AND = [];
      orgEventsWhere.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      });
    }

    // ========================================
    // 6. Get organization events
    // ========================================
    let organizationEvents = [];
    if (!source || source === 'all' || source === 'organization') {
      console.log('🔎 Querying organization events with filter:', JSON.stringify(orgEventsWhere, null, 2));
      
      organizationEvents = await prisma.organizationEvent.findMany({
        where: orgEventsWhere,
        include: {
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
      
      console.log('🏢 Organization events found:', organizationEvents.length);
    }

    // ========================================
    // 7. Format and combine events
    // ========================================
    const formattedCatalogEvents = catalogEvents.map(event => {
      const isIndividuallySubscribed = subscribedEventIds.includes(event.id);
      const isFromSubscribedCatalog = subscribedCatalogIds.includes(event.catalogId);

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        isRecurring: event.isRecurring,
        recurrenceRule: event.recurrenceRule,
        tags: event.tags,
        metadata: event.metadata,
        source: 'catalog',
        sourceDetails: {
          catalogId: event.catalog.id,
          catalogName: event.catalog.name,
          catalogType: event.catalog.type,
          country: event.country,
          region: event.region,
          industries: event.industries,
          subscriptionType: isIndividuallySubscribed && !isFromSubscribedCatalog 
            ? 'individual' 
            : 'catalog'
        },
        createdAt: event.createdAt,
      };
    });

    const formattedOrgEvents = organizationEvents.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      isRecurring: event.isRecurring,
      recurrenceRule: event.recurrenceRule,
      tags: event.tags,
      metadata: event.metadata,
      source: 'organization',
      sourceDetails: {
        createdBy: event.createdBy,
      },
      createdAt: event.createdAt,
    }));

    // ========================================
    // 8. Combine and sort by date
    // ========================================
    const allEvents = [...formattedCatalogEvents, ...formattedOrgEvents].sort(
      (a, b) => new Date(a.startDate) - new Date(b.startDate)
    );

    console.log('✅ Total events returned:', allEvents.length);
    console.log('📊 Breakdown - Catalog:', formattedCatalogEvents.length, 'Organization:', formattedOrgEvents.length);

    // ========================================
    // 9. Return response
    // ========================================
    res.json({
      success: true,
      data: {
        events: allEvents,
        summary: {
          total: allEvents.length,
          catalogEvents: formattedCatalogEvents.length,
          organizationEvents: formattedOrgEvents.length,
          subscribedCatalogs: catalogSubscriptions.length,
          individualEventSubscriptions: eventSubscriptions.length,
        },
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          tags: tagsFilter,
          search: search || null,
          source: source || 'all',
          country: country || null,
          region: region || null,
          type: type || null,
        },
      },
    });
  } catch (error) {
    console.error('❌ Get unified calendar error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar events',
      error: error.message,
    });
  }
};

/**
 * Get calendar statistics
 * GET /api/calendar/stats
 */
const getCalendarStats = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You must belong to an organization',
      });
    }

    // Get catalog subscriptions
    const catalogSubscriptions = await prisma.catalogSubscription.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        catalog: {
          select: {
            type: true,
            _count: {
              select: {
                events: true,
              },
            },
          },
        },
      },
    });

    // Get individual event subscriptions
    const eventSubscriptions = await prisma.eventSubscription.findMany({
      where: {
        tenantId,
        isVisible: true,
      },
      include: {
        catalogEvent: {
          select: {
            catalogId: true,
          },
        },
      },
    });

    // Get organization events count
    const orgEventsCount = await prisma.organizationEvent.count({
      where: { tenantId },
    });

    // Get unique catalog IDs from both subscription types
    const subscribedCatalogIds = catalogSubscriptions.map(sub => sub.catalogId);
    const subscribedEventIds = eventSubscriptions.map(sub => sub.catalogEventId);

    // Calculate total catalog events (avoiding duplicates)
    let totalCatalogEvents = 0;
    if (subscribedCatalogIds.length > 0 || subscribedEventIds.length > 0) {
      totalCatalogEvents = await prisma.catalogEvent.count({
        where: {
          OR: [
            { catalogId: { in: subscribedCatalogIds } },
            { id: { in: subscribedEventIds } }
          ]
        }
      });
    }

    // Group subscriptions by catalog type
    const subscriptionsByType = catalogSubscriptions.reduce((acc, sub) => {
      const type = sub.catalog.type;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          events: 0,
        };
      }
      acc[type].count += 1;
      acc[type].events += sub.catalog._count.events;
      return acc;
    }, {});

    // Get upcoming events (next 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingOrgEvents = await prisma.organizationEvent.count({
      where: {
        tenantId,
        startDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
    });

    let upcomingCatalogEvents = 0;
    if (subscribedCatalogIds.length > 0 || subscribedEventIds.length > 0) {
      upcomingCatalogEvents = await prisma.catalogEvent.count({
        where: {
          OR: [
            { catalogId: { in: subscribedCatalogIds } },
            { id: { in: subscribedEventIds } }
          ],
          startDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
      });
    }

    res.json({
      success: true,
      data: {
        totalEvents: totalCatalogEvents + orgEventsCount,
        catalogEvents: totalCatalogEvents,
        organizationEvents: orgEventsCount,
        activeSubscriptions: catalogSubscriptions.length,
        individualEventSubscriptions: eventSubscriptions.length,
        subscriptionsByType,
        upcoming: {
          total: upcomingCatalogEvents + upcomingOrgEvents,
          catalogEvents: upcomingCatalogEvents,
          organizationEvents: upcomingOrgEvents,
        },
      },
    });
  } catch (error) {
    console.error('Get calendar stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar statistics',
    });
  }
};

/**
 * Get events by month
 * GET /api/calendar/month/:year/:month
 */
const getEventsByMonth = async (req, res) => {
  try {
    const { year, month } = req.params;
    const tenantId = req.tenantId;

    console.log('📅 getEventsByMonth called:', { year, month, tenantId });

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You must belong to an organization',
      });
    }

    // Validate year and month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year or month',
      });
    }

    // Calculate date range for the month
    const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));

    console.log('📅 Strict date range:', { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    });

    // Override query parameters with strict date range
    req.query = {
      ...req.query,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    // Reuse the unified calendar function
    return getUnifiedCalendar(req, res);
  } catch (error) {
    console.error('❌ Get events by month error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly events',
      error: error.message,
    });
  }
};

module.exports = {
  getUnifiedCalendar,
  getCalendarStats,
  getEventsByMonth,
};