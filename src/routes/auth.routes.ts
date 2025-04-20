import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
// Make sure the path is correct and the file exists
import { validateLogin, validateRegister } from '../middlewares/validator.middleware';

const router = Router();

// Public routes
router.post('/register', validateRegister, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/profile', authMiddleware, AuthController.getProfile);

export default router;