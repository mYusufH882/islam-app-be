import { Request, Response, NextFunction } from 'express';

export const validateBookmarkCreation = (req: Request, res: Response, next: NextFunction): void => {
  const { type, referenceId } = req.body;
  
  if (!type || !referenceId) {
    res.status(400).json({
      success: false,
      message: 'Type and referenceId are required'
    });
    return;
  }
  
  // Validate bookmark type
  if (!['blog', 'quran', 'prayer'].includes(type)) {
    res.status(400).json({
      success: false,
      message: 'Invalid bookmark type. Type must be one of: blog, quran, prayer'
    });
    return;
  }
  
  next();
};

export const validateBookmarkUpdate = (req: Request, res: Response, next: NextFunction): void => {
  // For updates, we primarily validate that notes field exists
  // as it's the only field we allow to be updated after creation
  if (req.body.notes === undefined) {
    res.status(400).json({
      success: false,
      message: 'Notes field is required for updating a bookmark'
    });
    return;
  }
  
  next();
};