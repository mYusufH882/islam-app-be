import { Router } from 'express';
import * as BlogController from '../controllers/blog.controller';
import * as CategoryController from '../controllers/category.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';
import { validateCreateBlog, validateUpdateBlog, validateCategory } from '../middlewares/blog.validator.middleware';

const router = Router();

// Blog routes
// Public routes
router.get('/blogs', BlogController.getAllBlogs);
router.get('/blogs/:id', BlogController.getBlogById);
router.get('/authors/:userId/blogs', BlogController.getBlogsByAuthor);

// Admin-only routes for blog management
router.post('/blogs', authMiddleware, adminMiddleware, validateCreateBlog, BlogController.createBlog);
router.put('/blogs/:id', authMiddleware, adminMiddleware, validateUpdateBlog, BlogController.updateBlog);
router.delete('/blogs/:id', authMiddleware, adminMiddleware, BlogController.deleteBlog);

// Category routes
// Public routes
router.get('/categories', CategoryController.getAllCategories);
router.get('/categories/:id', CategoryController.getCategoryById);

// Admin routes
router.post('/categories', authMiddleware, adminMiddleware, validateCategory, CategoryController.createCategory);
router.put('/categories/:id', authMiddleware, adminMiddleware, validateCategory, CategoryController.updateCategory);
router.delete('/categories/:id', authMiddleware, adminMiddleware, CategoryController.deleteCategory);

export default router;