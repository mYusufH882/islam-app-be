import { Router } from 'express';
import * as AdminCommentController from '../controllers/adminComment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminRoleMiddleware } from '../middlewares/role.middleware';

const router = Router();

// Semua route admin memerlukan autentikasi dan admin role
router.use(authMiddleware, adminRoleMiddleware);

// Mendapatkan daftar komentar dengan filter
router.get(
  '/comments',
  AdminCommentController.getComments
);

// Mendapatkan jumlah komentar berdasarkan status
router.get(
  '/comments/count',
  AdminCommentController.getCommentCounts
);

// Memperbarui status komentar (approve/reject)
router.put(
  '/comments/:commentId',
  AdminCommentController.updateCommentStatus
);

// Menandai komentar sudah dibaca
router.put(
  '/comments/:commentId/read',
  AdminCommentController.markCommentAsRead
);

// Menghapus komentar
router.delete(
  '/comments/:commentId',
  AdminCommentController.deleteComment
);

export default router;