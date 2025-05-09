import { Router } from 'express';
import * as CommentController from '../controllers/comment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateCreateComment, validateUpdateComment } from '../middlewares/comment.validator.middleware';

const router = Router();

// Mendapatkan komentar untuk blog tertentu
router.get(
  '/blogs/:blogId/comments',
  CommentController.getBlogComments
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