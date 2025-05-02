import { Response } from 'express';
import Bookmark from '../models/bookmark.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import User from '../models/user.model';
import { Op } from 'sequelize';

// Get all bookmarks (admin only)
export const getAllBookmarks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure the requester is an admin
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }

    const { 
      search, 
      type,
      page = 1, 
      limit = 10 
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    // Build the where clause
    const whereClause: any = {};
    
    // Add type filter if provided
    if (type && ['blog', 'quran', 'prayer'].includes(type as string)) {
      whereClause.type = type;
    }
    
    // Build search query if provided
    if (search) {
      const users = await User.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { username: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } }
          ]
        },
        attributes: ['id']
      });
      
      const userIds = users.map(user => user.id);
      
      whereClause[Op.or] = [
        { userId: { [Op.in]: userIds } },
        { referenceId: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } }
      ];
    }

    // Find bookmarks with pagination
    const { rows: bookmarks, count } = await Bookmark.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'username', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: {
        bookmarks,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get all bookmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

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