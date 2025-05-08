import { Request, Response, NextFunction } from 'express';

export const validateUserCreation = (req: Request, res: Response, next: NextFunction): void => {
  const { username, email, password, name, status } = req.body;

  console.log('User creation validation. Request body:', {
    username, 
    email, 
    passwordLength: password ? password.length : 0,
    name,
    status
  });
  
  if (!username || !email || !password || !name) {
    const missingFields = [];
    if (!username) missingFields.push('username');
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');
    if (!name) missingFields.push('name');

    res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`
    });
    return;
  }
  
  // Validasi username (alphanumeric, 3-20 chars)
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    res.status(400).json({
      success: false,
      message: 'Username must be 3-20 characters and contain only letters, numbers and underscores'
    });
    return;
  }
  
  // Validasi email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
    return;
  }
  
  // Validasi password (min 8 chars)
  if (password.length < 8) {
    res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long'
    });
    return;
  }
  
  // Validasi status jika diberikan
  if (status && !['active', 'inactive'].includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Status must be either active or inactive'
    });
    return;
  }
  
  next();
};

export const validateUserUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { username, email, password, status } = req.body;
  
  // Validasi username if provided
  if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    res.status(400).json({
      success: false,
      message: 'Username must be 3-20 characters and contain only letters, numbers and underscores'
    });
    return;
  }
  
  // Validasi email if provided
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
    return;
  }
  
  // Validasi password if provided
  if (password && password.length < 8) {
    res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long'
    });
    return;
  }
  
  // Validasi status if provided
  if (status && !['active', 'inactive'].includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Status must be either active or inactive'
    });
    return;
  }
  
  next();
};