import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import User from '../models/user.model';

export interface AuthRequest extends Request {
  user?: User;
  userId?: number;
}

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
      res.status(401).json({ message: 'Unauthorized: User not found' });
      return;
    }
    
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admin access required' });
    return;
  }
};