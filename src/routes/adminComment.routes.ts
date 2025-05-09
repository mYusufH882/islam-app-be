import { Router } from 'express';
import * as AdminCommentController from '../controllers/adminComment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminRoleMiddleware } from '../middlewares/role.middleware';

const router = Router();

// Semua route admin memerlukan autentikasi dan admin role
router.use(authMiddleware, adminRoleMiddleware);

// Route yang sudah ada
router.get(
  '/comments',
  AdminCommentController.getComments
);

router.get(
  '/comments/count',
  AdminCommentController.getCommentCounts
);

// Rute statistik baru
router.get(
  '/comments/stats',
  AdminCommentController.getCommentStats
);

// Rute aksi massal baru
router.post(
  '/comments/bulk-action',
  AdminCommentController.bulkActionComments
);

// Route yang sudah ada lainnya
router.put(
  '/comments/:commentId',
  AdminCommentController.updateCommentStatus
);

router.put(
  '/comments/:commentId/read',
  AdminCommentController.markCommentAsRead
);

router.delete(
  '/comments/:commentId',
  AdminCommentController.deleteComment
);

export default router;