import { Router } from 'express';
import * as UserManagementController from '../controllers/user-management.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminRoleMiddleware } from '../middlewares/role.middleware';
import { validateUserCreation, validateUserUpdate } from '../middlewares/user-validator.middleware';

const router = Router();

// Apply middleware to individual routes instead of to all routes

// Get all users (excluding admins)
router.get('/users', 
  authMiddleware, 
  adminRoleMiddleware, 
  UserManagementController.getAllUsers
);

// Get user by ID
router.get('/users/:id', 
  authMiddleware, 
  adminRoleMiddleware, 
  UserManagementController.getUserById
);

// Create a new user
router.post('/users', 
  authMiddleware, 
  adminRoleMiddleware, 
  validateUserCreation, 
  UserManagementController.createUser
);

// Update a user
router.put('/users/:id', 
  authMiddleware, 
  adminRoleMiddleware, 
  validateUserUpdate, 
  UserManagementController.updateUser
);

// Delete a user
router.delete('/users/:id', 
  authMiddleware, 
  adminRoleMiddleware, 
  UserManagementController.deleteUser
);

// Update user status (activate/deactivate)
router.patch('/users/:id/status', 
  authMiddleware, 
  adminRoleMiddleware, 
  UserManagementController.updateUserStatus
);

export default router;