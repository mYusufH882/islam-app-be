import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Comment from '../models/comment.model';
import Blog from '../models/blog.model';
import User from '../models/user.model';
import userTrustService from '../services/userTrust.service';
import commentFilterUtil from '../utils/commentFilter.util';
import { Op, WhereOptions } from 'sequelize'; // Tambahkan WhereOptions

// Mendapatkan komentar untuk blog tertentu
export const getBlogComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { blogId } = req.params;
    
    // Validasi blogId
    const blog = await Blog.findByPk(blogId);
    if (!blog) {
      res.status(404).json({
        success: false,
        message: 'Blog tidak ditemukan'
      });
      return;
    }
    
    // Ambil hanya komentar tingkat atas (parentId is null) yang disetujui
    // Gunakan where clause terpisah dengan casting yang tepat
    const whereClause = {
      blogId,
      status: 'approved',
    } as WhereOptions<any>;
    
    // Tambahkan kondisi parentId secara terpisah
    (whereClause as any).parentId = null;
    
    const comments = await Comment.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'username']
        },
        {
          model: Comment,
          as: 'replies',
          where: {
            status: 'approved'
          },
          required: false,
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'name', 'username']
            }
          ]
        }
      ],
      order: [
        ['createdAt', 'DESC'],
        [{ model: Comment, as: 'replies' }, 'createdAt', 'ASC']
      ]
    });
    
    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Error getting blog comments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Membuat komentar baru
export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content, blogId, parentId } = req.body;
    
    // Validasi apakah pengguna login
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Login diperlukan untuk berkomentar'
      });
      return;
    }
    
    // Validasi blogId
    const blog = await Blog.findByPk(blogId);
    if (!blog) {
      res.status(404).json({
        success: false,
        message: 'Blog tidak ditemukan'
      });
      return;
    }
    
    // Jika ada parentId, pastikan komentar induk ada
    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      if (!parentComment) {
        res.status(404).json({
          success: false,
          message: 'Komentar induk tidak ditemukan'
        });
        return;
      }
      
      // Pastikan parentId merupakan komentar tingkat atas (tidak bisa reply ke reply)
      if (parentComment.parentId) {
        res.status(400).json({
          success: false,
          message: 'Tidak bisa membalas balasan, hanya bisa membalas komentar utama'
        });
        return;
      }
    }
    
    // Cek konten untuk kata terlarang atau spam
    const containsForbiddenWords = commentFilterUtil.containsForbiddenWords(content);
    const isLikelySpam = commentFilterUtil.isLikelySpam(content);
    
    // Cek level kepercayaan pengguna
    const isTrusted = await userTrustService.isUserTrusted(req.userId);
    
    // Tentukan status komentar berdasarkan kepercayaan pengguna dan konten
    let status: 'pending' | 'approved' | 'spam' = isTrusted ? 'approved' : 'pending';
    
    // Jika ada konten yang dilarang atau terindikasi spam, selalu butuh moderasi
    if (containsForbiddenWords || isLikelySpam) {
      status = isLikelySpam ? 'spam' : 'pending';
    }
    
    // Buat komentar
    const comment = await Comment.create({
      content,
      blogId,
      userId: req.userId,
      parentId: parentId || null,
      status,
      isRead: false
    });
    
    // Ambil komentar dengan informasi pengguna untuk respons
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'username']
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: isTrusted && status === 'approved' 
        ? 'Komentar berhasil ditambahkan' 
        : 'Komentar berhasil dikirim dan sedang menunggu moderasi',
      data: commentWithUser
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Membalas komentar
export const replyToComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    
    // Validasi apakah pengguna login
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Login diperlukan untuk berkomentar'
      });
      return;
    }
    
    // Cari komentar induk
    const parentComment = await Comment.findByPk(commentId);
    if (!parentComment) {
      res.status(404).json({
        success: false,
        message: 'Komentar induk tidak ditemukan'
      });
      return;
    }
    
    // Pastikan parentComment merupakan komentar tingkat atas (tidak bisa reply ke reply)
    if (parentComment.parentId) {
      res.status(400).json({
        success: false,
        message: 'Tidak bisa membalas balasan, hanya bisa membalas komentar utama'
      });
      return;
    }
    
    // Cek konten untuk kata terlarang atau spam
    const containsForbiddenWords = commentFilterUtil.containsForbiddenWords(content);
    const isLikelySpam = commentFilterUtil.isLikelySpam(content);
    
    // Cek level kepercayaan pengguna
    const isTrusted = await userTrustService.isUserTrusted(req.userId);
    
    // Tentukan status komentar berdasarkan kepercayaan pengguna dan konten
    let status: 'pending' | 'approved' | 'spam' = isTrusted ? 'approved' : 'pending';
    
    // Jika ada konten yang dilarang atau terindikasi spam, selalu butuh moderasi
    if (containsForbiddenWords || isLikelySpam) {
      status = isLikelySpam ? 'spam' : 'pending';
    }
    
    // Buat balasan
    const reply = await Comment.create({
      content,
      blogId: parentComment.blogId,
      userId: req.userId,
      parentId: parentComment.id,
      status,
      isRead: false
    });
    
    // Ambil balasan dengan informasi pengguna untuk respons
    const replyWithUser = await Comment.findByPk(reply.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'username']
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: isTrusted && status === 'approved' 
        ? 'Balasan berhasil ditambahkan' 
        : 'Balasan berhasil dikirim dan sedang menunggu moderasi',
      data: replyWithUser
    });
  } catch (error) {
    console.error('Error replying to comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Memperbarui komentar (pengguna hanya bisa update komentar sendiri)
export const updateComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    
    // Validasi apakah pengguna login
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Login diperlukan untuk mengubah komentar'
      });
      return;
    }
    
    // Cari komentar
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      res.status(404).json({
        success: false,
        message: 'Komentar tidak ditemukan'
      });
      return;
    }
    
    // Pastikan pengguna hanya bisa mengubah komentar sendiri
    if (comment.userId !== req.userId) {
      res.status(403).json({
        success: false,
        message: 'Anda hanya dapat mengubah komentar Anda sendiri'
      });
      return;
    }
    
    // Cek konten untuk kata terlarang atau spam
    const containsForbiddenWords = commentFilterUtil.containsForbiddenWords(content);
    const isLikelySpam = commentFilterUtil.isLikelySpam(content);
    
    // Cek level kepercayaan pengguna
    const isTrusted = await userTrustService.isUserTrusted(req.userId);
    
    // Tentukan status komentar berdasarkan kepercayaan pengguna dan konten
    let status: 'pending' | 'approved' | 'spam';
    
    // Jika ada konten yang dilarang atau terindikasi spam, selalu butuh moderasi
    if (containsForbiddenWords || isLikelySpam) {
      status = isLikelySpam ? 'spam' : 'pending';
    } else {
      // Jika user terpercaya, tetap approved, jika tidak, kembali ke pending
      status = isTrusted ? 'approved' : 'pending';
    }
    
    // Update komentar
    await comment.update({
      content,
      status,
      isRead: false
    });
    
    // Ambil komentar yang diperbarui dengan informasi pengguna
    const updatedComment = await Comment.findByPk(commentId, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'username']
        }
      ]
    });
    
    res.json({
      success: true,
      message: status === 'approved' 
        ? 'Komentar berhasil diperbarui' 
        : 'Komentar berhasil diperbarui dan sedang menunggu moderasi',
      data: updatedComment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Menghapus komentar (pengguna hanya bisa menghapus komentar sendiri)
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    
    // Validasi apakah pengguna login
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Login diperlukan untuk menghapus komentar'
      });
      return;
    }
    
    // Cari komentar
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      res.status(404).json({
        success: false,
        message: 'Komentar tidak ditemukan'
      });
      return;
    }
    
    // Pastikan pengguna hanya bisa menghapus komentar sendiri
    if (comment.userId !== req.userId && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Anda hanya dapat menghapus komentar Anda sendiri'
      });
      return;
    }
    
    // Jika menghapus komentar induk, juga hapus semua balasannya
    if (!comment.parentId) {
      // Gunakan where clause terpisah dengan casting yang tepat
      const whereClause = {
        parentId: commentId
      } as WhereOptions<any>;
      
      // Hapus semua balasan
      await Comment.destroy({
        where: whereClause
      });
    }
    
    // Hapus komentar
    await comment.destroy();
    
    res.json({
      success: true,
      message: 'Komentar berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};