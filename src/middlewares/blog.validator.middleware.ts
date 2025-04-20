// src/middlewares/blog.validator.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const validateCreateBlog = (req: Request, res: Response, next: NextFunction): void => {
  const { title, content, categoryId, status } = req.body;
  
  if (!title || !content || !categoryId) {
    res.status(400).json({
      success: false,
      message: 'Title, content and categoryId are required'
    });
    return;
  }
  
  // Validate title (not empty, max 200 chars)
  if (title.trim().length === 0 || title.length > 200) {
    res.status(400).json({
      success: false,
      message: 'Title must be between 1 and 200 characters'
    });
    return;
  }
  
  // Validate content (not empty)
  if (content.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'Content cannot be empty'
    });
    return;
  }
  
  // Validate status
  if (status && !['draft', 'published'].includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Status must be either "draft" or "published"'
    });
    return;
  }
  
  next();
};

export const validateUpdateBlog = (req: Request, res: Response, next: NextFunction): void => {
  const { title, content, status } = req.body;
  
  // If title is provided, validate it
  if (title !== undefined) {
    if (title.trim().length === 0 || title.length > 200) {
      res.status(400).json({
        success: false,
        message: 'Title must be between 1 and 200 characters'
      });
      return;
    }
  }
  
  // If content is provided, validate it
  if (content !== undefined) {
    if (content.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Content cannot be empty'
      });
      return;
    }
  }
  
  // If status is provided, validate it
  if (status !== undefined && !['draft', 'published'].includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Status must be either "draft" or "published"'
    });
    return;
  }
  
  next();
};

export const validateCategory = (req: Request, res: Response, next: NextFunction): void => {
  const { name } = req.body;
  
  if (!name) {
    res.status(400).json({
      success: false,
      message: 'Category name is required'
    });
    return;
  }
  
  // Validate name (not empty, max 50 chars)
  if (name.trim().length === 0 || name.length > 50) {
    res.status(400).json({
      success: false,
      message: 'Category name must be between 1 and 50 characters'
    });
    return;
  }
  
  next();
};