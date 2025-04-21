import { Router } from 'express';
import * as BookmarkController from '../controllers/bookmark.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateCreateBookmark, validateUpdateBookmark } from '../middlewares/bookmark.validator.middleware';

const router = Router();

// All bookmark routes require authentication
router.use(authMiddleware);

// Bookmark CRUD routes
router.post('/bookmarks', validateCreateBookmark, BookmarkController.createBookmark);
router.get('/bookmarks', BookmarkController.getAllBookmarks);
router.get('/bookmarks/:id', BookmarkController.getBookmarkById);
router.put('/bookmarks/:id', validateUpdateBookmark, BookmarkController.updateBookmark);
router.delete('/bookmarks/:id', BookmarkController.deleteBookmark);

// Get bookmarks by type
router.get('/bookmarks/type/:type', BookmarkController.getBookmarksByType);

export default router;