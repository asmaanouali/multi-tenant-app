// ============================================
// FILE 2: backend/src/middleware/auth.js
// ============================================

const { verifyToken } = require('../utils/jwt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Authenticate user from JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;
    req.tenantId = user.tenant?.id;


    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Authorize based on roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
      });
    }

    next();
  };
};

/**
 * Ensure user belongs to a tenant (organization)
 */
const requireTenant = (req, res, next) => {
  if (!req.tenantId) {
    return res.status(403).json({
      success: false,
      message: 'You must be part of an organization to access this resource',
    });
  }
  next();
};

/**
 * Validate tenant access (ensure user can only access their tenant's data)
 */
const validateTenantAccess = (req, res, next) => {
  const requestedTenantId = req.params.tenantId || req.body.tenantId;
  
  // Super admins can access any tenant
  if (req.userRole === 'SUPER_ADMIN') {
    return next();
  }

  // Other users can only access their own tenant
  if (requestedTenantId && requestedTenantId !== req.tenantId) {
    return res.status(403).json({
      success: false,
      message: 'You cannot access data from another organization',
    });
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  requireTenant,
  validateTenantAccess,
};