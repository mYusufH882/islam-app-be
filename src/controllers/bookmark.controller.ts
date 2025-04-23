import { Response } from 'express';
import Bookmark from '../models/bookmark.model';
import { AuthRequest } from '../middlewares/auth.middleware';

// Create a new bookmark
export const createBookmark = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only authenticated users can create bookmarks
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required to bookmark content'
      });
      return;
    }

    const { type, referenceId, notes } = req.body;

    // Validate bookmark type
    if (!['blog', 'quran', 'prayer'].includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Invalid bookmark type. Type must be one of: blog, quran, prayer'
      });
      return;
    }

    // Check if bookmark already exists
    const existingBookmark = await Bookmark.findOne({
      where: { 
        userId: req.userId,
        type,
        referenceId
      }
    });

    if (existingBookmark) {
      // Update the existing bookmark if it exists
      await existingBookmark.update({ notes });
      
      res.json({
        success: true,
        message: 'Bookmark updated successfully',
        data: existingBookmark
      });
      return;
    }

    // Create new bookmark
    const bookmark = await Bookmark.create({
      userId: req.userId,
      type,
      referenceId,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Bookmark created successfully',
      data: bookmark
    });
  } catch (error) {
    console.error('Create bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all bookmarks for the authenticated user
export const getUserBookmarks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only authenticated users can retrieve their bookmarks
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required to access bookmarks'
      });
      return;
    }

    const { type } = req.query;
    
    const whereClause: any = { userId: req.userId };
    
    // Filter by type if provided
    if (type && ['blog', 'quran', 'prayer'].includes(type as string)) {
      whereClause.type = type;
    }

    const bookmarks = await Bookmark.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: bookmarks
    });
  } catch (error) {
    console.error('Get user bookmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get a specific bookmark by ID
export const getBookmarkById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only authenticated users can access bookmarks
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required to access bookmarks'
      });
      return;
    }

    const { id } = req.params;

    const bookmark = await Bookmark.findOne({
      where: { 
        id,
        userId: req.userId  // Ensure users can only access their own bookmarks
      }
    });

    if (!bookmark) {
      res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      });
      return;
    }

    res.json({
      success: true,
      data: bookmark
    });
  } catch (error) {
    console.error('Get bookmark by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update a bookmark
export const updateBookmark = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only authenticated users can update bookmarks
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required to update bookmarks'
      });
      return;
    }

    const { id } = req.params;
    const { notes } = req.body;

    const bookmark = await Bookmark.findOne({
      where: { 
        id,
        userId: req.userId  // Ensure users can only update their own bookmarks
      }
    });

    if (!bookmark) {
      res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      });
      return;
    }

    await bookmark.update({ notes });

    res.json({
      success: true,
      message: 'Bookmark updated successfully',
      data: bookmark
    });
  } catch (error) {
    console.error('Update bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete a bookmark
export const deleteBookmark = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only authenticated users can delete bookmarks
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required to delete bookmarks'
      });
      return;
    }

    const { id } = req.params;

    const bookmark = await Bookmark.findOne({
      where: { 
        id,
        userId: req.userId  // Ensure users can only delete their own bookmarks
      }
    });

    if (!bookmark) {
      res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      });
      return;
    }

    await bookmark.destroy();

    res.json({
      success: true,
      message: 'Bookmark deleted successfully'
    });
  } catch (error) {
    console.error('Delete bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};