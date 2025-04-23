import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import User from '../models/user.model';

export interface AuthRequest extends Request {
  user?: User;
  userId?: number;
}

/**
 * Middleware to authenticate users
 * This only verifies the token and attaches user data to the request
 * Role checks are handled by separate middleware
 */
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized: No token provided' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || typeof decoded !== 'object') {
      res.status(401).json({ message: 'Unauthorized: Invalid token' });
      return;
    }
    
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      console.log('Unauthorized: User not found');
      
      return;
    }
    
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};