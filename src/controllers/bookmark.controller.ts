import { Response } from 'express';
import { Op } from 'sequelize';
import Bookmark from '../models/bookmark.model';
import Blog from '../models/blog.model';
import { AuthRequest } from '../middlewares/auth.middleware';

// Create new bookmark
export const createBookmark = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, referenceId, notes } = req.body;
    
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    // Validate bookmark type
    if (!['blog', 'quran', 'prayer'].includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Invalid bookmark type. Must be one of: blog, quran, prayer'
      });
      return;
    }
    
    // Check if reference exists based on type
    if (type === 'blog') {
      const blog = await Blog.findByPk(referenceId);
      if (!blog) {
        res.status(400).json({
          success: false,
          message: 'Blog post not found'
        });
        return;
      }
      
      // Check if blog is published
      if (blog.status !== 'published') {
        res.status(400).json({
          success: false,
          message: 'Cannot bookmark unpublished blog post'
        });
        return;
      }
    }
    // For 'quran' and 'prayer' types, validation would be added here
    // based on your API implementation for those features
    
    // Check if user already has this bookmark
    const existingBookmark = await Bookmark.findOne({
      where: {
        userId: req.userId,
        type,
        referenceId
      }
    });
    
    if (existingBookmark) {
      res.status(400).json({
        success: false,
        message: 'You have already bookmarked this item'
      });
      return;
    }
    
    // Check bookmark limit (5 per type)
    const bookmarkCount = await Bookmark.count({
      where: {
        userId: req.userId,
        type
      }
    });
    
    if (bookmarkCount >= 5) {
      res.status(400).json({
        success: false,
        message: `You've reached the maximum limit of 5 bookmarks for ${type}. Please remove some bookmarks before adding new ones.`
      });
      return;
    }
    
    // Create bookmark
    const bookmark = await Bookmark.create({
      userId: req.userId,
      type,
      referenceId,
      notes: notes || null
    });
    
    res.status(201).json({
      success: true,
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

// Get all user bookmarks
export const getAllBookmarks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    const { type, includeContent } = req.query;
    
    // Filter by bookmark type if provided
    const whereClause: any = {
      userId: req.userId
    };
    
    if (type && ['blog', 'quran', 'prayer'].includes(type as string)) {
      whereClause.type = type;
    }
    
    // Get all bookmarks
    const bookmarks = await Bookmark.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    
    // If includeContent=true, fetch related content for each bookmark
    if (includeContent === 'true') {
      const bookmarksWithContent = await Promise.all(
        bookmarks.map(async (bookmark) => {
          const bookmarkData = bookmark.toJSON();
          
          // For blog bookmarks, fetch the blog post details
          if (bookmark.type === 'blog') {
            try {
              const blogPost = await Blog.findByPk(bookmark.referenceId);
              if (blogPost) {
                // Use a different property name to avoid TypeScript error
                // @ts-ignore - we're adding a custom property to the JSON object
                bookmarkData.relatedContent = {
                  title: blogPost.title,
                  excerpt: blogPost.content.substring(0, 100) + '...',
                  publishedAt: blogPost.publishedAt
                };
              }
            } catch (err) {
              console.error('Error fetching blog for bookmark:', err);
            }
          }
          
          // For other types, handle accordingly
          // Here you would add integration with Quran API or Prayer Times API
          
          return bookmarkData;
        })
      );
      
      res.json({
        success: true,
        data: bookmarksWithContent
      });
    } else {
      res.json({
        success: true,
        data: bookmarks
      });
    }
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get bookmark by ID
export const getBookmarkById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    const bookmark = await Bookmark.findOne({
      where: {
        id,
        userId: req.userId
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
    console.error('Get bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update bookmark
export const updateBookmark = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    const bookmark = await Bookmark.findOne({
      where: {
        id,
        userId: req.userId
      }
    });
    
    if (!bookmark) {
      res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      });
      return;
    }
    
    // Only notes can be updated
    await bookmark.update({
      notes: notes || null
    });
    
    res.json({
      success: true,
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

// Delete bookmark
export const deleteBookmark = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    const bookmark = await Bookmark.findOne({
      where: {
        id,
        userId: req.userId
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

// Get bookmarks by type
export const getBookmarksByType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.params;
    
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    // Validate bookmark type
    if (!['blog', 'quran', 'prayer'].includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Invalid bookmark type. Must be one of: blog, quran, prayer'
      });
      return;
    }
    
    const bookmarks = await Bookmark.findAll({
      where: {
        userId: req.userId,
        type
      },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: bookmarks
    });
  } catch (error) {
    console.error('Get bookmarks by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};