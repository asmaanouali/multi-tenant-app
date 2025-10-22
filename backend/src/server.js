// ============================================
// backend/src/server.js (FIXED)
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/authRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const userRoutes = require('./routes/userRoutes');


// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://gleaming-pika-356641.netlify.app'  // Add your Netlify URL here
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', authRoutes);           // Authentication routes
app.use('/api/catalogs', catalogRoutes);    // Global catalogs & catalog events
app.use('/api/tenants', tenantRoutes);      // Tenants, subscriptions & organization events
app.use('/api/calendar', calendarRoutes);   // ✅ FIXED: Added calendar routes
app.use('/api/users', userRoutes);


// ============================================
// ERROR HANDLING
// ============================================

// 404 handler (must be after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('📅 Multi-Tenant Calendar System');
  console.log('='.repeat(50));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 API available at http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('📝 Available APIs:');
  console.log(`   - Auth:         http://localhost:${PORT}/api/auth`);
  console.log(`   - Catalogs:     http://localhost:${PORT}/api/catalogs`);
  console.log(`   - Tenants:      http://localhost:${PORT}/api/tenants`);
  console.log(`   - Calendar:     http://localhost:${PORT}/api/calendar`);
  console.log('='.repeat(50));
});

module.exports = app;