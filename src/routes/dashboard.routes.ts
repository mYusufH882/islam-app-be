import { Router } from 'express';
import * as DashboardController from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminRoleMiddleware } from '../middlewares/role.middleware';

const router = Router();

// Semua endpoint dashboard memerlukan autentikasi admin
router.get('/stats', 
  authMiddleware, 
  adminRoleMiddleware, 
  DashboardController.getDashboardStats
);

router.get('/chart-data', 
  authMiddleware, 
  adminRoleMiddleware, 
  DashboardController.getChartData
);

router.get('/recent-activities', 
  authMiddleware, 
  adminRoleMiddleware, 
  DashboardController.getRecentActivities
);

export default router;