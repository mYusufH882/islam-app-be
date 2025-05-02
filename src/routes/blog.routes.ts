import { Router } from 'express';
import * as BlogController from '../controllers/blog.controller';
import * as CategoryController from '../controllers/category.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateCreateBlog, validateUpdateBlog, validateCategory } from '../middlewares/blog.validator.middleware';
import { adminRoleMiddleware } from '../middlewares/role.middleware';

const router = Router();

// Blog routes
router.get('/blogs/stats', BlogController.getBlogStats);

// Public routes
router.get('/blogs', BlogController.getAllBlogs);
router.get('/blogs/:id', BlogController.getBlogById);
router.get('/authors/:userId/blogs', BlogController.getBlogsByAuthor);

// Admin-only routes for blog management
router.post('/blogs', authMiddleware, adminRoleMiddleware, validateCreateBlog, BlogController.createBlog);
router.put('/blogs/:id', authMiddleware, adminRoleMiddleware, validateUpdateBlog, BlogController.updateBlog);
router.delete('/blogs/:id', authMiddleware, adminRoleMiddleware, BlogController.deleteBlog);

// Category routes
// Public routes
router.get('/categories', CategoryController.getAllCategories);
router.get('/categories/:id', CategoryController.getCategoryById);

// Admin routes
router.post('/categories', authMiddleware, adminRoleMiddleware, validateCategory, CategoryController.createCategory);
router.put('/categories/:id', authMiddleware, adminRoleMiddleware, validateCategory, CategoryController.updateCategory);
router.delete('/categories/:id', authMiddleware, adminRoleMiddleware, CategoryController.deleteCategory);

export default router;