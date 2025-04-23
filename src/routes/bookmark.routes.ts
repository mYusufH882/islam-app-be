import { Router } from 'express';
import * as BookmarkController from '../controllers/bookmark.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateBookmarkCreation, validateBookmarkUpdate } from '../middlewares/bookmark.validator.middleware';

const router = Router();

// All bookmark routes require authentication
router.use(authMiddleware);

// Create a new bookmark
router.post('/bookmarks', validateBookmarkCreation, BookmarkController.createBookmark);

// Get all bookmarks for the authenticated user
router.get('/bookmarks', BookmarkController.getUserBookmarks);

// Get a specific bookmark by ID
router.get('/bookmarks/:id', BookmarkController.getBookmarkById);

// Update a bookmark
router.put('/bookmarks/:id', validateBookmarkUpdate, BookmarkController.updateBookmark);

// Delete a bookmark
router.delete('/bookmarks/:id', BookmarkController.deleteBookmark);

export default router;