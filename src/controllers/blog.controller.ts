import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Blog from '../models/blog.model';
import Category from '../models/category.model';
import User from '../models/user.model';
import { AuthRequest } from '../middlewares/auth.middleware';

// Get all blogs (with filtering)
export const getAllBlogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      category, 
      status, 
      search,
      page = 1,
      limit = 10
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const whereClause: any = {};
    
    // Filter by category
    if (category) {
      whereClause.categoryId = category;
    }
    
    // Filter by status
    if (status) {
      whereClause.status = status;
    } else {
      // By default, show only published blogs for public API
      whereClause.status = 'published';
    }
    
    // Search in title or content
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const { rows: blogs, count } = await Blog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'username']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      order: [['publishedAt', 'DESC']],
      limit: Number(limit),
      offset: offset
    });
    
    res.json({
      success: true,
      data: {
        blogs,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get all blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get blog by ID
export const getBlogById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'username']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!blog) {
      res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
      return;
    }
    
    // If the blog is not published, only allow the author or admin to view it
    if (blog.status !== 'published') {
      const authReq = req as AuthRequest;
      
      if (!authReq.user || (authReq.user.id !== blog.userId && authReq.user.role !== 'admin')) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to view this blog'
        });
        return;
      }
    }
    
    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Get blog by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Di blog.controller.ts
export const getBlogStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Hitung total semua blog
    const totalCount = await Blog.count();
    
    // Hitung blog yang dipublikasikan
    const publishedCount = await Blog.count({
      where: { status: 'published' }
    });
    
    // Hitung blog dalam status draft
    const draftCount = await Blog.count({
      where: { status: 'draft' }
    });
    
    res.json({
      success: true,
      data: {
        total: totalCount,
        published: publishedCount,
        draft: draftCount
      }
    });
  } catch (error) {
    console.error('Get blog stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Create new blog - admin only
export const createBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, categoryId, image, status } = req.body;
    
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    // Admin check should already be handled by the adminMiddleware
    // But we can add an extra check for safety
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Only administrators can create blog posts'
      });
      return;
    }
    
    // Check if category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
      return;
    }
    
    const publishedAt = status === 'published' ? new Date() : undefined;
    
    const blog = await Blog.create({
      title,
      content,
      categoryId,
      image: image || null,
      status,
      publishedAt,
      userId: req.userId
    });
    
    const newBlog = await Blog.findByPk(blog.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'username']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      data: newBlog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update blog
// Update blog - admin only
export const updateBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, categoryId, image, status } = req.body;
    
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    // Admin check should already be handled by the adminMiddleware
    // But we can add an extra check for safety
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Only administrators can update blog posts'
      });
      return;
    }
    
    const blog = await Blog.findByPk(id);
    
    if (!blog) {
      res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
      return;
    }
    
    // Check if category exists if categoryId is provided
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
        return;
      }
    }
    
    // Set publishedAt if status is changing to published
    let publishedAt = blog.publishedAt;
    if (status === 'published' && blog.status !== 'published') {
      publishedAt = new Date();
    }
    
    await blog.update({
      title: title || blog.title,
      content: content || blog.content,
      categoryId: categoryId || blog.categoryId,
      image: image !== undefined ? image : blog.image,
      status: status || blog.status,
      publishedAt
    });
    
    const updatedBlog = await Blog.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'username']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });
    
    res.json({
      success: true,
      data: updatedBlog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete blog
// Delete blog - admin only
export const deleteBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    // Admin check should already be handled by the adminMiddleware
    // But we can add an extra check for safety
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Only administrators can delete blog posts'
      });
      return;
    }
    
    const blog = await Blog.findByPk(id);
    
    if (!blog) {
      res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
      return;
    }
    
    await blog.destroy();
    
    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get blogs by author
export const getBlogsByAuthor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { 
      status,
      page = 1,
      limit = 10
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const whereClause: any = {
      userId
    };
    
    // Filter by status
    if (status) {
      whereClause.status = status;
    }
    
    const { rows: blogs, count } = await Blog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: offset
    });
    
    res.json({
      success: true,
      data: {
        blogs,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get blogs by author error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};