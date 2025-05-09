import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Comment from '../models/comment.model';
import User from '../models/user.model';
import Blog from '../models/blog.model';
import { Op } from 'sequelize';
import sequelize from '../config/database';
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

// Mendapatkan statistik komentar yang lebih detail
export const getCommentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Pastikan hanya admin yang bisa mengakses
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }
    
    // Statistik dasar status
    const pendingCount = await Comment.count({ where: { status: 'pending' } });
    const approvedCount = await Comment.count({ where: { status: 'approved' } });
    const rejectedCount = await Comment.count({ where: { status: 'rejected' } });
    const spamCount = await Comment.count({ where: { status: 'spam' } });
    const unreadCount = await Comment.count({ where: { isRead: false } });
    
    // Statistik komentar per blog (5 blog teratas)
    // Perbaiki kolom ambigu dengan menentukan tabel secara eksplisit
    const commentsByBlog = await Comment.findAll({
      attributes: [
        'blogId',
        [sequelize.fn('COUNT', sequelize.col('Comment.id')), 'commentCount'] // Perbaikan di sini
      ],
      include: [
        {
          model: Blog,
          attributes: ['title']
        }
      ],
      group: ['blogId'],
      order: [[sequelize.fn('COUNT', sequelize.col('Comment.id')), 'DESC']], // Perbaikan di sini
      limit: 5
    });
    
    // Statistik per tanggal (7 hari terakhir)
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const commentsByDate = await Comment.findAll({
      attributes: [
        [sequelize.fn('date', sequelize.col('Comment.createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('Comment.id')), 'commentCount']
      ],
      where: sequelize.where(
        sequelize.col('Comment.createdAt'), 
        Op.gte, 
        oneWeekAgo
      ),
      group: [sequelize.fn('date', sequelize.col('Comment.createdAt'))],
      order: [[sequelize.fn('date', sequelize.col('Comment.createdAt')), 'ASC']]
    });
    
    // Pengguna paling aktif (5 teratas)
    const activeUsers = await Comment.findAll({
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('Comment.id')), 'commentCount'] // Perbaikan di sini
      ],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['name', 'username']
        }
      ],
      group: ['userId'],
      order: [[sequelize.fn('COUNT', sequelize.col('Comment.id')), 'DESC']], // Perbaikan di sini
      limit: 5
    });
    
    // Hitung persentase komentar yang disetujui
    const totalComments = pendingCount + approvedCount + rejectedCount + spamCount;
    const approvalRate = totalComments > 0 ? (approvedCount / totalComments) * 100 : 0;
    
    res.json({
      success: true,
      data: {
        statusCounts: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          spam: spamCount,
          unread: unreadCount,
          total: totalComments
        },
        approvalRate: parseFloat(approvalRate.toFixed(2)),
        commentsByBlog,
        commentsByDate,
        activeUsers
      }
    });
  } catch (error) {
    console.error('Error getting comment stats:', error);
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

// Melakukan aksi massal pada komentar (approve/reject/spam)
export const bulkActionComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Pastikan hanya admin yang bisa mengakses
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }
    
    const { commentIds, action, adminNote } = req.body;
    
    // Validasi parameter
    if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Harap sediakan array ID komentar yang valid'
      });
      return;
    }
    
    if (!action || !['approve', 'reject', 'spam', 'delete', 'markAsRead'].includes(action)) {
      res.status(400).json({
        success: false,
        message: 'Aksi tidak valid. Gunakan approve, reject, spam, delete, atau markAsRead'
      });
      return;
    }
    
    // Cari komentar yang ada
    const comments = await Comment.findAll({
      where: {
        id: {
          [Op.in]: commentIds
        }
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'username']
        }
      ]
    });
    
    // Jika tidak ada komentar yang ditemukan
    if (comments.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Tidak ada komentar yang ditemukan dengan ID yang diberikan'
      });
      return;
    }
    
    // Lakukan aksi berdasarkan jenis yang dipilih
    let successCount = 0;
    let errorCount = 0;
    const userTrustUpdates = new Map(); // Untuk melacak user yang perlu diupdate trust level-nya
    
    if (action === 'delete') {
      // Untuk aksi delete, hapus semua komentar sekaligus
      
      // Cari ID komentar induk untuk menghapus balasannya
      const parentIds = comments
        .filter(comment => !comment.parentId)
        .map(comment => comment.id);
      
      // Hapus semua balasan dari komentar induk
      if (parentIds.length > 0) {
        await Comment.destroy({
          where: {
            parentId: {
              [Op.in]: parentIds
            }
          }
        });
      }
      
      // Hapus komentar yang dipilih
      const result = await Comment.destroy({
        where: {
          id: {
            [Op.in]: commentIds
          }
        }
      });
      
      successCount = result;
    } else if (action === 'markAsRead') {
      // Untuk aksi mark as read, update isRead menjadi true
      const result = await Comment.update(
        { isRead: true },
        {
          where: {
            id: {
              [Op.in]: commentIds
            }
          }
        }
      );
      
      successCount = result[0];
    } else {
      // Untuk aksi approve/reject/spam, proses satu per satu untuk update trust level
      for (const comment of comments) {
        try {
          // Simpan status sebelumnya
          const previousStatus = comment.status;
          
          // Status baru berdasarkan aksi
          let newStatus: 'approved' | 'rejected' | 'spam';
          
          if (action === 'approve') {
            newStatus = 'approved';
          } else if (action === 'reject') {
            newStatus = 'rejected';
          } else {
            newStatus = 'spam';
          }
          
          // Update komentar
          await comment.update({
            status: newStatus,
            adminNote: adminNote || comment.adminNote,
            isRead: true
          });
          
          // Jika status berubah, tambahkan userID ke map untuk diupdate trust level-nya
          if (previousStatus !== newStatus) {
            userTrustUpdates.set(comment.userId, { 
              action: newStatus, 
              previousStatus 
            });
          }
          
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error processing comment ID ${comment.id}:`, error);
        }
      }
      
      // Update trust level untuk user yang terdampak
      for (const [userId, updateInfo] of userTrustUpdates.entries()) {
        try {
          if (updateInfo.action === 'approved') {
            await userTrustService.handleApprovedComment(userId);
          } else if (updateInfo.action === 'rejected' || updateInfo.action === 'spam') {
            await userTrustService.handleRejectedComment(userId);
          }
        } catch (error) {
          console.error(`Error updating trust level for user ${userId}:`, error);
        }
      }
    }
    
    res.json({
      success: true,
      message: `Berhasil melakukan aksi ${action} pada ${successCount} komentar${errorCount > 0 ? `, gagal pada ${errorCount} komentar` : ''}`,
      data: {
        successCount,
        errorCount,
        totalProcessed: comments.length
      }
    });
  } catch (error) {
    console.error('Error performing bulk action on comments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};