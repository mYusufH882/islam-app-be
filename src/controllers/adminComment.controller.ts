import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Comment from '../models/comment.model';
import User from '../models/user.model';
import Blog from '../models/blog.model';
import { Op } from 'sequelize';
import userTrustService from '../services/userTrust.service';

// Mendapatkan daftar komentar dengan filter untuk admin
export const getComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Pastikan hanya admin yang bisa mengakses
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }
    
    const { 
      status, 
      blogId, 
      search, 
      isRead,
      page = 1, 
      limit = 10 
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    // Build where clause
    const whereClause: any = {};
    
    // Filter berdasarkan status
    if (status && ['pending', 'approved', 'rejected', 'spam'].includes(status as string)) {
      whereClause.status = status;
    }
    
    // Filter berdasarkan blogId
    if (blogId) {
      whereClause.blogId = blogId;
    }
    
    // Filter berdasarkan isRead
    if (isRead !== undefined) {
      whereClause.isRead = isRead === 'true';
    }
    
    // Filter berdasarkan pencarian
    if (search) {
      whereClause[Op.or] = [
        { content: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Ambil komentar dengan paginasi
    const { rows: comments, count } = await Comment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'username']
        },
        {
          model: Blog,
          attributes: ['id', 'title']
        },
        {
          model: Comment,
          as: 'parent',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'name', 'username']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: offset
    });
    
    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error getting admin comments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Mendapatkan jumlah komentar berdasarkan status (untuk dashboard/notifikasi)
export const getCommentCounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Pastikan hanya admin yang bisa mengakses
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }
    
    // Hitung total komentar berdasarkan status
    const pendingCount = await Comment.count({ where: { status: 'pending' } });
    const approvedCount = await Comment.count({ where: { status: 'approved' } });
    const rejectedCount = await Comment.count({ where: { status: 'rejected' } });
    const spamCount = await Comment.count({ where: { status: 'spam' } });
    
    // Hitung komentar yang belum dibaca
    const unreadCount = await Comment.count({ where: { isRead: false } });
    
    res.json({
      success: true,
      data: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        spam: spamCount,
        unread: unreadCount,
        total: pendingCount + approvedCount + rejectedCount + spamCount
      }
    });
  } catch (error) {
    console.error('Error getting comment counts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Memperbarui status komentar (approve/reject)
export const updateCommentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Pastikan hanya admin yang bisa mengakses
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }
    
    const { commentId } = req.params;
    const { status, adminNote } = req.body;
    
    // Validasi status
    if (!status || !['approved', 'rejected', 'spam'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Status tidak valid. Gunakan approved, rejected, atau spam'
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
    
    // Simpan status sebelumnya
    const previousStatus = comment.status;
    
    // Update komentar
    await comment.update({
      status,
      adminNote: adminNote || null,
      isRead: true
    });
    
    // Update trust level pengguna berdasarkan keputusan admin
    if (previousStatus !== status) {
      if (status === 'approved') {
        await userTrustService.handleApprovedComment(comment.userId);
      } else if (status === 'rejected' || status === 'spam') {
        await userTrustService.handleRejectedComment(comment.userId);
      }
    }
    
    // Ambil komentar yang diperbarui
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
      message: `Komentar berhasil ${status === 'approved' ? 'disetujui' : status === 'rejected' ? 'ditolak' : 'ditandai sebagai spam'}`,
      data: updatedComment
    });
  } catch (error) {
    console.error('Error updating comment status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Menandai komentar sudah dibaca
export const markCommentAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Pastikan hanya admin yang bisa mengakses
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }
    
    const { commentId } = req.params;
    
    // Cari komentar
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      res.status(404).json({
        success: false,
        message: 'Komentar tidak ditemukan'
      });
      return;
    }
    
    // Update isRead
    await comment.update({ isRead: true });
    
    res.json({
      success: true,
      message: 'Komentar ditandai sebagai sudah dibaca'
    });
  } catch (error) {
    console.error('Error marking comment as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Menghapus komentar (admin)
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Pastikan hanya admin yang bisa mengakses
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }
    
    const { commentId } = req.params;
    
    // Cari komentar
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      res.status(404).json({
        success: false,
        message: 'Komentar tidak ditemukan'
      });
      return;
    }
    
    // Jika menghapus komentar induk, juga hapus semua balasannya
    if (!comment.parentId) {
      // Hapus semua balasan
      await Comment.destroy({
        where: {
          parentId: commentId
        }
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