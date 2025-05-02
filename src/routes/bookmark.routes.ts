import { Router } from 'express';
import * as BookmarkController from '../controllers/bookmark.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateBookmarkCreation, validateBookmarkUpdate } from '../middlewares/bookmark.validator.middleware';
import { adminRoleMiddleware, userRoleMiddleware } from '../middlewares/role.middleware';

const router = Router();

// Admin route to get all bookmarks
router.get('/admin/bookmarks', authMiddleware, adminRoleMiddleware, BookmarkController.getAllBookmarks);

// Admin route to delete any bookmark
router.delete('/admin/bookmarks/:id', authMiddleware, adminRoleMiddleware, BookmarkController.deleteBookmark);

// Create a new bookmark
router.post('/', 
    authMiddleware, 
    userRoleMiddleware, 
    validateBookmarkCreation, 
    BookmarkController.createBookmark
);

// Get all bookmarks for the authenticated user
router.get('/', 
    authMiddleware, 
    userRoleMiddleware, 
    BookmarkController.getUserBookmarks
);

// Get a specific bookmark by ID
router.get('/:id', 
    authMiddleware, 
    userRoleMiddleware, 
    BookmarkController.getBookmarkById
);

// Update a bookmark
router.put('/:id', 
    authMiddleware, 
    userRoleMiddleware, 
    validateBookmarkUpdate, 
    BookmarkController.updateBookmark
);

// Delete a bookmark
router.delete('/:id', 
    authMiddleware, 
    userRoleMiddleware, 
    BookmarkController.deleteBookmark
);

export default router;