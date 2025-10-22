// ============================================
// FILE 6: backend/src/config/prisma.js
// ============================================

const { PrismaClient } = require('@prisma/client');

// Create a single Prisma Client instance
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;