// quran.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import quranController from '../controllers/quran.controller';

const router = Router();

router.get('/surah', (req: Request, res: Response, next: NextFunction) => {
  quranController.getAllSurah(req, res).catch(next);
});

router.get('/surah/:number', (req: Request, res: Response, next: NextFunction) => {
  quranController.getSurahByNumber(req, res).catch(next);
});

router.get('/surah/:surahNumber/verse/:verseNumber', (req: Request, res: Response, next: NextFunction) => {
  quranController.getVerse(req, res).catch(next);
});

export default router;