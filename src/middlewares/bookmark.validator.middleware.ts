import { Request, Response, NextFunction } from 'express';

export const validateCreateBookmark = (req: Request, res: Response, next: NextFunction): void => {
  const { type, referenceId } = req.body;
  
  if (!type || !referenceId) {
    res.status(400).json({
      success: false,
      message: 'Type and referenceId are required'
    });
    return;
  }
  
  // Validate type
  if (!['blog', 'quran', 'prayer'].includes(type)) {
    res.status(400).json({
      success: false,
      message: 'Invalid bookmark type. Must be one of: blog, quran, prayer'
    });
    return;
  }
  
  // Validate referenceId format based on type
  if (type === 'blog') {
    // For blog, referenceId should be a number
    if (isNaN(Number(referenceId))) {
      res.status(400).json({
        success: false,
        message: 'Blog referenceId must be a valid blog ID (number)'
      });
      return;
    }
  } else if (type === 'quran') {
    // For quran, referenceId should be in format "surah:ayah" e.g. "1:5"
    const quranRegex = /^\d+:\d+$/;
    if (!quranRegex.test(referenceId)) {
      res.status(400).json({
        success: false,
        message: 'Quran referenceId must be in format "surah:ayah" (e.g. "1:5")'
      });
      return;
    }
  } else if (type === 'prayer') {
    // For prayer, referenceId could be a prayer name or ID
    // This is dependent on your prayer times implementation
    if (!referenceId || referenceId.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Prayer referenceId cannot be empty'
      });
      return;
    }
  }
  
  next();
};

export const validateUpdateBookmark = (req: Request, res: Response, next: NextFunction): void => {
  const { notes } = req.body;
  
  // For update, only notes can be changed
  // We allow empty notes (to clear notes), but we check if notes field is provided
  if (notes === undefined) {
    res.status(400).json({
      success: false,
      message: 'Notes field is required'
    });
    return;
  }
  
  next();
};