// src/routes/blog.routes.ts
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

// Protected routes
router.post('/blogs', authMiddleware, validateCreateBlog, BlogController.createBlog);
router.put('/blogs/:id', authMiddleware, validateUpdateBlog, BlogController.updateBlog);
router.delete('/blogs/:id', authMiddleware, BlogController.deleteBlog);

// Category routes
// Public routes
router.get('/categories', CategoryController.getAllCategories);
router.get('/categories/:id', CategoryController.getCategoryById);

// Admin routes
router.post('/categories', authMiddleware, adminMiddleware, validateCategory, CategoryController.createCategory);
router.put('/categories/:id', authMiddleware, adminMiddleware, validateCategory, CategoryController.updateCategory);
router.delete('/categories/:id', authMiddleware, adminMiddleware, CategoryController.deleteCategory);

export default router;