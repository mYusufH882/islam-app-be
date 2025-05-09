import { Router } from 'express';
import * as CommentController from '../controllers/comment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateCreateComment, validateUpdateComment } from '../middlewares/comment.validator.middleware';

const router = Router();

router.get(
  '/user/comments',
  authMiddleware,
  CommentController.getUserComments
);

router.get(
  '/user/comment-counts',
  authMiddleware,
  CommentController.getUserCommentCounts
);

// Mendapatkan komentar untuk blog tertentu
router.get(
  '/blogs/:blogId/comments',
  CommentController.getBlogComments
);

// Mendapatkan jumlah komentar berdasarkan status
router.get(
  '/user/comment-counts',
  authMiddleware,
  CommentController.getUserCommentCounts
);

// Membuat komentar baru
router.post(
  '/blogs/:blogId/comments',
  authMiddleware,
  validateCreateComment,
  CommentController.createComment
);

// Membalas komentar
router.post(
  '/comments/:commentId/reply',
  authMiddleware,
  validateCreateComment,
  CommentController.replyToComment
);

// Memperbarui komentar (pengguna hanya bisa update komentar sendiri)
router.put(
  '/comments/:commentId',
  authMiddleware,
  validateUpdateComment,
  CommentController.updateComment
);

// Menghapus komentar (pengguna hanya bisa menghapus komentar sendiri)
router.delete(
  '/comments/:commentId',
  authMiddleware,
  CommentController.deleteComment
);

export default router;