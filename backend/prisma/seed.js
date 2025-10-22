// backend/prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.organizationEvent.deleteMany();
  await prisma.eventSubscription.deleteMany();
  await prisma.catalogEvent.deleteMany();
  await prisma.catalog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // ============================================
  // CREATE SUPER ADMIN USER
  // ============================================
  console.log('👤 Creating Super Admin user...');
  
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@calendar.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
    },
  });

  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  // ============================================
  // CREATE SAMPLE TENANTS (Organizations)
  // ============================================
  console.log('🏢 Creating sample organizations...');

  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'Tech Innovations Inc.',
      slug: 'tech-innovations',
      industry: 'Technology',
      country: 'USA',
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Global Healthcare Ltd.',
      slug: 'global-healthcare',
      industry: 'Healthcare',
      country: 'UK',
    },
  });

  const tenant3 = await prisma.tenant.create({
    data: {
      name: 'Algeria Trading Co.',
      slug: 'algeria-trading',
      industry: 'Finance',
      country: 'Algeria',
    },
  });

  console.log(`✅ Created tenant: ${tenant1.name}`);
  console.log(`✅ Created tenant: ${tenant2.name}`);
  console.log(`✅ Created tenant: ${tenant3.name}`);

  // ============================================
  // CREATE SAMPLE ORGANIZATION USERS
  // ============================================
  console.log('👥 Creating organization users...');

  // Tenant 1 users
  const adminUser1 = await prisma.user.create({
    data: {
      email: 'admin@techinnovations.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: 'ADMIN',
      tenantId: tenant1.id,
    },
  });

  const normalUser1 = await prisma.user.create({
    data: {
      email: 'user@techinnovations.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'USER',
      tenantId: tenant1.id,
    },
  });

  // Tenant 2 users
  const adminUser2 = await prisma.user.create({
    data: {
      email: 'admin@globalhealthcare.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'ADMIN',
      tenantId: tenant2.id,
    },
  });

  const normalUser2 = await prisma.user.create({
    data: {
      email: 'user@globalhealthcare.com',
      password: hashedPassword,
      firstName: 'Michael',
      lastName: 'Brown',
      role: 'USER',
      tenantId: tenant2.id,
    },
  });

  // Tenant 3 users
  const adminUser3 = await prisma.user.create({
    data: {
      email: 'admin@algeriatrading.com',
      password: hashedPassword,
      firstName: 'Karim',
      lastName: 'Benali',
      role: 'ADMIN',
      tenantId: tenant3.id,
    },
  });

  console.log(`✅ Created users for organizations`);

  // ============================================
  // CREATE THE 3 GLOBAL CATALOGS (ONLY 3!)
  // ============================================
  console.log('📚 Creating 3 global catalogs...');

  const worldCatalog = await prisma.catalog.create({
    data: {
      name: 'World Special Days',
      description: 'International days recognized globally',
      type: 'WORLD_SPECIAL_DAYS',
      isActive: true,
    },
  });

  const nationalCatalog = await prisma.catalog.create({
    data: {
      name: 'National Holidays',
      description: 'National holidays from various countries',
      type: 'NATIONAL_HOLIDAYS',
      isActive: true,
    },
  });

  const regionalCatalog = await prisma.catalog.create({
    data: {
      name: 'Regional Holidays',
      description: 'Regional holidays from various regions',
      type: 'REGIONAL_HOLIDAYS',
      isActive: true,
    },
  });

  console.log(`✅ Created 3 global catalogs`);

  // ============================================
  // CREATE CATALOG EVENTS (with country/region attributes)
  // ============================================
  console.log('📅 Creating catalog events...');

  // World Special Days Events (NO country/region)
  const worldEvents = await prisma.catalogEvent.createMany({
    data: [
      {
        catalogId: worldCatalog.id,
        title: 'New Year\'s Day',
        description: 'Celebration of the new year',
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-01T23:59:59Z'),
        isRecurring: true,
        recurrenceRule: 'FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1',
        industries: ['All'],
        tags: ['celebration', 'global'],
      },
      {
        catalogId: worldCatalog.id,
        title: 'International Women\'s Day',
        description: 'Celebrating women\'s achievements and contributions',
        startDate: new Date('2025-03-08T00:00:00Z'),
        endDate: new Date('2025-03-08T23:59:59Z'),
        isRecurring: true,
        recurrenceRule: 'FREQ=YEARLY;BYMONTH=3;BYMONTHDAY=8',
        industries: ['All'],
        tags: ['social', 'awareness'],
      },
      {
        catalogId: worldCatalog.id,
        title: 'Earth Day',
        description: 'Environmental protection awareness day',
        startDate: new Date('2025-04-22T00:00:00Z'),
        endDate: new Date('2025-04-22T23:59:59Z'),
        isRecurring: true,
        recurrenceRule: 'FREQ=YEARLY;BYMONTH=4;BYMONTHDAY=22',
        industries: ['All'],
        tags: ['environment', 'awareness'],
      },
      {
        catalogId: worldCatalog.id,
        title: 'World Health Day',
        description: 'Global health awareness day',
        startDate: new Date('2025-04-07T00:00:00Z'),
        endDate: new Date('2025-04-07T23:59:59Z'),
        isRecurring: true,
        recurrenceRule: 'FREQ=YEARLY;BYMONTH=4;BYMONTHDAY=7',
        industries: ['Healthcare', 'All'],
        tags: ['health', 'awareness'],
      },
    ],
  });

  // National Holidays Events (WITH country attribute)
  const nationalEvents = await prisma.catalogEvent.createMany({
    data: [
      // USA National Holidays
      {
        catalogId: nationalCatalog.id,
        title: 'Independence Day (USA)',
        description: 'USA Independence Day celebration',
        startDate: new Date('2025-07-04T00:00:00Z'),
        endDate: new Date('2025-07-04T23:59:59Z'),
        country: 'USA',
        isRecurring: true,
        recurrenceRule: 'FREQ=YEARLY;BYMONTH=7;BYMONTHDAY=4',
        industries: ['All'],
        tags: ['national', 'holiday', 'usa'],
      },
      {
        catalogId: nationalCatalog.id,
        title: 'Thanksgiving (USA)',
        description: 'Thanksgiving Day',
        startDate: new Date('2025-11-27T00:00:00Z'),
        endDate: new Date('2025-11-27T23:59:59Z'),
        country: 'USA',
        isRecurring: true,
        recurrenceRule: 'FREQ=YEARLY;BYMONTH=11;BYDAY=4TH',
        industries: ['All'],
        tags: ['national', 'holiday', 'usa'],
      },
      {
        catalogId: nationalCatalog.id,
        title: 'Memorial Day (USA)',
        description: 'Honoring military personnel who died in service',
        startDate: new Date('2025-05-26T00:00:00Z'),
        endDate: new Date('2025-05-26T23:59:59Z'),
        country: 'USA',
        isRecurring: true,
        industries: ['All'],
        tags: ['national', 'holiday', 'usa'],
      },
      
      // UK National Holidays
      {
        catalogId: nationalCatalog.id,
        title: 'Boxing Day (UK)',
        description: 'Day after Christmas',
        startDate: new Date('2025-12-26T00:00:00Z'),
        endDate: new Date('2025-12-26T23:59:59Z'),
        country: 'UK',
        isRecurring: true,
        recurrenceRule: 'FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=26',
        industries: ['All'],
        tags: ['national', 'holiday', 'uk'],
      },
      {
        catalogId: nationalCatalog.id,
        title: 'Spring Bank Holiday (UK)',
        description: 'Late May bank holiday',
        startDate: new Date('2025-05-26T00:00:00Z'),
        endDate: new Date('2025-05-26T23:59:59Z'),
        country: 'UK',
        isRecurring: true,
        industries: ['All'],
        tags: ['national', 'holiday', 'uk'],
      },
      
      // Algeria National Holidays
      {
        catalogId: nationalCatalog.id,
        title: 'Independence Day (Algeria)',
        description: 'Algeria Independence Day',
        startDate: new Date('2025-07-05T00:00:00Z'),
        endDate: new Date('2025-07-05T23:59:59Z'),
        country: 'Algeria',
        isRecurring: true,
        recurrenceRule: 'FREQ=YEARLY;BYMONTH=7;BYMONTHDAY=5',
        industries: ['All'],
        tags: ['national', 'holiday', 'algeria'],
      },
      {
        catalogId: nationalCatalog.id,
        title: 'Revolution Day (Algeria)',
        description: 'Anniversary of the Algerian Revolution',
        startDate: new Date('2025-11-01T00:00:00Z'),
        endDate: new Date('2025-11-01T23:59:59Z'),
        country: 'Algeria',
        isRecurring: true,
        recurrenceRule: 'FREQ=YEARLY;BYMONTH=11;BYMONTHDAY=1',
        industries: ['All'],
        tags: ['national', 'holiday', 'algeria'],
      },
      
      // Christmas (multiple countries)
      {
        catalogId: nationalCatalog.id,
        title: 'Christmas Day',
        description: 'Christmas celebration',
        startDate: new Date('2025-12-25T00:00:00Z'),
        endDate: new Date('2025-12-25T23:59:59Z'),
        country: 'USA',
        isRecurring: true,
        recurrenceRule: 'FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25',
        industries: ['All'],
        tags: ['national', 'holiday', 'usa'],
      },
      {
        catalogId: nationalCatalog.id,
        title: 'Christmas Day',
        description: 'Christmas celebration',
        startDate: new Date('2025-12-25T00:00:00Z'),
        endDate: new Date('2025-12-25T23:59:59Z'),
        country: 'UK',
        isRecurring: true,
        recurrenceRule: 'FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25',
        industries: ['All'],
        tags: ['national', 'holiday', 'uk'],
      },
    ],
  });

  // Regional Holidays Events (WITH country AND region attributes)
  const regionalEvents = await prisma.catalogEvent.createMany({
    data: [
      {
        catalogId: regionalCatalog.id,
        title: 'California Admission Day',
        description: 'Celebrates California\'s admission to the Union',
        startDate: new Date('2025-09-09T00:00:00Z'),
        endDate: new Date('2025-09-09T23:59:59Z'),
        country: 'USA',
        region: 'California',
        isRecurring: true,
        recurrenceRule: 'FREQ=YEARLY;BYMONTH=9;BYMONTHDAY=9',
        industries: ['All'],
        tags: ['regional', 'california'],
      },
      {
        catalogId: regionalCatalog.id,
        title: 'Texas Independence Day',
        description: 'Celebrates Texas independence from Mexico',
        startDate: new Date('2025-03-02T00:00:00Z'),
        endDate: new Date('2025-03-02T23:59:59Z'),
        country: 'USA',
        region: 'Texas',
        isRecurring: true,
        recurrenceRule: 'FREQ=YEARLY;BYMONTH=3;BYMONTHDAY=2',
        industries: ['All'],
        tags: ['regional', 'texas'],
      },
      {
        catalogId: regionalCatalog.id,
        title: 'Eid al-Fitr',
        description: 'End of Ramadan celebration',
        startDate: new Date('2025-03-30T00:00:00Z'),
        endDate: new Date('2025-03-30T23:59:59Z'),
        country: 'Algeria',
        region: 'MENA',
        isRecurring: false, // Islamic calendar varies
        industries: ['All'],
        tags: ['regional', 'religious', 'mena'],
      },
    ],
  });

  console.log(`✅ Created catalog events`);

  // ============================================
  // CREATE EVENT SUBSCRIPTIONS
  // ============================================
  console.log('🔗 Creating event subscriptions...');

  // Get all catalog events
  const allWorldEvents = await prisma.catalogEvent.findMany({
    where: { catalogId: worldCatalog.id },
  });

  const usaNationalEvents = await prisma.catalogEvent.findMany({
    where: { 
      catalogId: nationalCatalog.id,
      country: 'USA',
    },
  });

  const ukNationalEvents = await prisma.catalogEvent.findMany({
    where: { 
      catalogId: nationalCatalog.id,
      country: 'UK',
    },
  });

  const algeriaNationalEvents = await prisma.catalogEvent.findMany({
    where: { 
      catalogId: nationalCatalog.id,
      country: 'Algeria',
    },
  });

  const californiaRegionalEvents = await prisma.catalogEvent.findMany({
    where: { 
      catalogId: regionalCatalog.id,
      region: 'California',
    },
  });

  // Tech Innovations (USA) subscribes to:
  // - All World Special Days
  // - USA National Holidays
  // - California Regional Holidays
  for (const event of allWorldEvents) {
    await prisma.eventSubscription.create({
      data: {
        tenantId: tenant1.id,
        catalogEventId: event.id,
        isVisible: true,
      },
    });
  }

  for (const event of usaNationalEvents) {
    await prisma.eventSubscription.create({
      data: {
        tenantId: tenant1.id,
        catalogEventId: event.id,
        isVisible: true,
      },
    });
  }

  for (const event of californiaRegionalEvents) {
    await prisma.eventSubscription.create({
      data: {
        tenantId: tenant1.id,
        catalogEventId: event.id,
        isVisible: true,
      },
    });
  }

  // Global Healthcare (UK) subscribes to:
  // - All World Special Days (but hides Earth Day - not relevant)
  // - UK National Holidays
  for (const event of allWorldEvents) {
    await prisma.eventSubscription.create({
      data: {
        tenantId: tenant2.id,
        catalogEventId: event.id,
        isVisible: event.title !== 'Earth Day', // Hide Earth Day
      },
    });
  }

  for (const event of ukNationalEvents) {
    await prisma.eventSubscription.create({
      data: {
        tenantId: tenant2.id,
        catalogEventId: event.id,
        isVisible: true,
      },
    });
  }

  // Algeria Trading (Algeria) subscribes to:
  // - Selected World Special Days (only relevant ones)
  // - Algeria National Holidays
  const relevantWorldEventsForAlgeria = allWorldEvents.filter(e => 
    e.title === 'New Year\'s Day' || e.title === 'International Women\'s Day'
  );

  for (const event of relevantWorldEventsForAlgeria) {
    await prisma.eventSubscription.create({
      data: {
        tenantId: tenant3.id,
        catalogEventId: event.id,
        isVisible: true,
      },
    });
  }

  for (const event of algeriaNationalEvents) {
    await prisma.eventSubscription.create({
      data: {
        tenantId: tenant3.id,
        catalogEventId: event.id,
        isVisible: true,
      },
    });
  }

  console.log(`✅ Created event subscriptions`);

  // ============================================
  // CREATE SAMPLE ORGANIZATION EVENTS
  // ============================================
  console.log('📌 Creating organization-specific events...');

  await prisma.organizationEvent.createMany({
    data: [
      // Tech Innovations events
      {
        tenantId: tenant1.id,
        title: 'Company Annual Meeting',
        description: 'Annual shareholders meeting',
        startDate: new Date('2025-06-15T09:00:00Z'),
        endDate: new Date('2025-06-15T17:00:00Z'),
        source: 'ORGANIZATION',
        tags: ['company', 'meeting'],
      },
      {
        tenantId: tenant1.id,
        title: 'Team Building Day',
        description: 'Quarterly team building activity',
        startDate: new Date('2025-07-20T10:00:00Z'),
        endDate: new Date('2025-07-20T16:00:00Z'),
        source: 'ORGANIZATION',
        tags: ['team', 'activity'],
      },
      {
        tenantId: tenant1.id,
        title: 'Product Launch',
        description: 'New product launch event',
        startDate: new Date('2025-09-15T14:00:00Z'),
        endDate: new Date('2025-09-15T18:00:00Z'),
        source: 'ORGANIZATION',
        tags: ['product', 'launch'],
      },

      // Global Healthcare events
      {
        tenantId: tenant2.id,
        title: 'Medical Conference',
        description: 'Annual medical innovation conference',
        startDate: new Date('2025-08-10T08:00:00Z'),
        endDate: new Date('2025-08-12T18:00:00Z'),
        source: 'ORGANIZATION',
        tags: ['conference', 'healthcare'],
      },
      {
        tenantId: tenant2.id,
        title: 'Staff Training Day',
        description: 'Mandatory staff training',
        startDate: new Date('2025-05-15T09:00:00Z'),
        endDate: new Date('2025-05-15T17:00:00Z'),
        source: 'ORGANIZATION',
        tags: ['training', 'staff'],
      },

      // Algeria Trading events
      {
        tenantId: tenant3.id,
        title: 'Board Meeting',
        description: 'Quarterly board meeting',
        startDate: new Date('2025-04-20T10:00:00Z'),
        endDate: new Date('2025-04-20T15:00:00Z'),
        source: 'ORGANIZATION',
        tags: ['board', 'meeting'],
      },
    ],
  });

  console.log(`✅ Created organization events`);

  console.log('\n✨ Database seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - 1 Super Admin`);
  console.log(`   - 3 Organizations`);
  console.log(`   - 5 Organization Users (3 Admins, 2 Users)`);
  console.log(`   - 3 Global Catalogs (World/National/Regional)`);
  console.log(`   - Multiple Catalog Events with country/region attributes`);
  console.log(`   - Event Subscriptions (orgs subscribe to specific events)`);
  console.log(`   - 6 Organization-specific Events`);
  console.log('\n🔐 Login Credentials:');
  console.log('   Super Admin:     admin@calendar.com / Admin@123');
  console.log('   Tech Org Admin:  admin@techinnovations.com / Admin@123');
  console.log('   Tech Org User:   user@techinnovations.com / Admin@123');
  console.log('   Health Org Admin: admin@globalhealthcare.com / Admin@123');
  console.log('   Health Org User:  user@globalhealthcare.com / Admin@123');
  console.log('   Algeria Org Admin: admin@algeriatrading.com / Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });