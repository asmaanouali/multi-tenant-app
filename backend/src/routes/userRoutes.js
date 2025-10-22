// backend/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

/**
 * Get all users (Super Admin only)
 * GET /api/users
 */
router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            country: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({
      success: true,
      data: usersWithoutPasswords,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
});

/**
 * Update user (Super Admin only)
 * PUT /api/users/:id
 */
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, tenantId } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        role,
        tenantId: role === 'ADMIN' ? tenantId : null,
      },
      include: {
        tenant: true,
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
    });
  }
});

/**
 * Delete user (Super Admin only)
 * DELETE /api/users/:id
 */
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
});

module.exports = router;