import { Request, Response, NextFunction } from 'express';

export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const { username, email, password, name } = req.body;
  
  if (!username || !email || !password || !name) {
    res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
    return; // Return without calling next()
  }
  
  // Validate username (alphanumeric, 3-20 chars)
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    res.status(400).json({
      success: false,
      message: 'Username must be 3-20 characters and contain only letters, numbers and underscores'
    });
    return;
  }
  
  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
    return;
  }
  
  // Validate password (min 8 chars)
  if (password.length < 8) {
    res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long'
    });
    return;
  }
  
  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
    return;
  }
  
  next();
};