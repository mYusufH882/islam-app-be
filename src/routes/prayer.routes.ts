// prayer.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import prayerController from '../controllers/prayer.controller';

const router = Router();

router.get('/timings', (req: Request, res: Response, next: NextFunction) => {
  prayerController.getTodayPrayerTimes(req, res).catch(next);
});

router.get('/timings/:date', (req: Request, res: Response, next: NextFunction) => {
  prayerController.getPrayerTimesByDate(req, res).catch(next);
});

router.get('/calendar/:year/:month', (req: Request, res: Response, next: NextFunction) => {
  prayerController.getMonthlyCalendar(req, res).catch(next);
});

export default router;