import { Request, Response } from 'express';
import { Op } from 'sequelize';
import path from 'path';
import Blog from '../models/blog.model';
import Category from '../models/category.model';
import User from '../models/user.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import fileUtil from '../utils/file.util';
import { getRelativeImagePath } from '../middlewares/upload.middleware';

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
    
    // Filter by status - only add status to whereClause if it's provided
    if (status) {
      whereClause.status = status;
    }
    // Removed the else block to avoid setting a default status filter
    
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

// Membuat blog baru - hanya admin
export const createBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, categoryId, status } = req.body;
    
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Pengguna tidak terautentikasi'
      });
      return;
    }
    
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Hanya administrator yang dapat membuat postingan blog'
      });
      return;
    }
    
    // Jika tidak ada file, gunakan string kosong
    const imagePath = req.file ? (getRelativeImagePath(req.file) || '') : '';
    
    // Periksa apakah kategori ada
    const category = await Category.findByPk(categoryId);
    if (!category) {
      res.status(400).json({
        success: false,
        message: 'Kategori tidak valid'
      });
      return;
    }
    
    const publishedAt = status === 'published' ? new Date() : undefined;
    
    const blog = await Blog.create({
      title,
      content,
      categoryId,
      image: imagePath, // Gunakan imagePath yang selalu string
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
    console.error('Error membuat blog:', error);
    res.status(500).json({
      success: false,
      message: 'Error server'
    });
  }
};

// Memperbarui blog - hanya admin
export const updateBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, categoryId, status } = req.body;
    
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Pengguna tidak terautentikasi'
      });
      return;
    }
    
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Hanya administrator yang dapat memperbarui postingan blog'
      });
      return;
    }
    
    const blog = await Blog.findByPk(id);
    
    if (!blog) {
      res.status(404).json({
        success: false,
        message: 'Blog tidak ditemukan'
      });
      return;
    }
    
    // Dapatkan path gambar baru jika ada unggahan
    // Selalu gunakan string, bukan null
    let imagePath: string = blog.image || '';
    if (req.file) {
      // Hapus file gambar lama jika ada
      if (blog.image) {
        const oldImagePath = path.join(process.cwd(), 'public', blog.image);
        fileUtil.removeFile(oldImagePath);
      }
      
      // Set path gambar baru
      const newImagePath = getRelativeImagePath(req.file);
      imagePath = newImagePath || '';
    } else if (req.body.removeImage === 'true') {
      // Hapus gambar jika ada flag removeImage
      if (blog.image) {
        const oldImagePath = path.join(process.cwd(), 'public', blog.image);
        fileUtil.removeFile(oldImagePath);
      }
      imagePath = '';  // Gunakan string kosong
    }
    
    // Periksa apakah kategori ada jika categoryId disediakan
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        res.status(400).json({
          success: false,
          message: 'Kategori tidak valid'
        });
        return;
      }
    }
    
    // Atur publishedAt jika status berubah menjadi published
    let publishedAt = blog.publishedAt;
    if (status === 'published' && blog.status !== 'published') {
      publishedAt = new Date();
    }
    
    await blog.update({
      title: title || blog.title,
      content: content || blog.content,
      categoryId: categoryId || blog.categoryId,
      image: imagePath, // image hanya menerima string
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
    console.error('Error memperbarui blog:', error);
    res.status(500).json({
      success: false,
      message: 'Error server'
    });
  }
};

// Menghapus blog - hanya admin
export const deleteBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Pengguna tidak terautentikasi'
      });
      return;
    }
    
    // Pemeriksaan admin seharusnya sudah ditangani oleh adminMiddleware
    // Tapi kita bisa menambahkan pemeriksaan tambahan untuk keamanan
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Hanya administrator yang dapat menghapus postingan blog'
      });
      return;
    }
    
    const blog = await Blog.findByPk(id);
    
    if (!blog) {
      res.status(404).json({
        success: false,
        message: 'Blog tidak ditemukan'
      });
      return;
    }
    
    // Hapus file gambar jika ada
    if (blog.image) {
      const imagePath = path.join(process.cwd(), 'public', blog.image);
      fileUtil.removeFile(imagePath);
    }
    
    await blog.destroy();
    
    res.json({
      success: true,
      message: 'Blog berhasil dihapus'
    });
  } catch (error) {
    console.error('Error menghapus blog:', error);
    res.status(500).json({
      success: false,
      message: 'Error server'
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