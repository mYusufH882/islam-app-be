import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/**
 * Middleware to check if the authenticated user has the 'user' role
 */
export const userRoleMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // First check if user is authenticated (this should be handled by authMiddleware already)
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }
  
  // Then check if user has the 'user' role
  if (req.user.role !== 'user') {
    res.status(403).json({
      success: false,
      message: 'This feature is only available to regular users'
    });
    return;
  }
  
  // If all checks pass, proceed to the next middleware/controller
  next();
};

/**
 * Middleware to check if the authenticated user has the 'admin' role
 */
export const adminRoleMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }
  
  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
    return;
  }
  
  next();
};