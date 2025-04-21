import { Request, Response } from 'express';
import quranService from '../services/quran.service';
import responseUtil from '../utils/response.util';

class QuranController {
  // Gunakan arrow function untuk binding otomatis
  getAllSurah = async (req: Request, res: Response) => {
    try {
      const { data, cached } = await quranService.getAllSurah();
      
      return res.json(responseUtil.success(
        data,
        'Successfully retrieved surah list',
        cached
      ));
    } catch (error) {
      console.error('Error in getAllSurah controller:', error);
      return res.status(500).json(responseUtil.error(
        'Failed to retrieve surah list'
      ));
    }
  }
  
  getSurahByNumber = async (req: Request, res: Response) => {
    try {
      const number = parseInt(req.params.number);
      
      if (isNaN(number)) {
        return res.status(400).json(responseUtil.error(
          'Invalid surah number'
        ));
      }
      
      const { data, cached } = await quranService.getSurahByNumber(number);
      
      return res.json(responseUtil.success(
        data,
        `Successfully retrieved surah #${number}`,
        cached
      ));
    } catch (error: any) {
      console.error('Error in getSurahByNumber controller:', error);
      
      if (error.message?.includes('Invalid surah number')) {
        return res.status(400).json(responseUtil.error(error.message));
      }
      
      return res.status(500).json(responseUtil.error(
        `Failed to retrieve surah #${req.params.number}`
      ));
    }
  }
  
  getVerse = async (req: Request, res: Response) => {
    try {
      const surahNumber = parseInt(req.params.surahNumber);
      const verseNumber = parseInt(req.params.verseNumber);
      
      if (isNaN(surahNumber) || isNaN(verseNumber)) {
        return res.status(400).json(responseUtil.error(
          'Invalid surah or verse number'
        ));
      }
      
      const { data, cached } = await quranService.getVerse(surahNumber, verseNumber);
      
      return res.json(responseUtil.success(
        data,
        `Successfully retrieved verse #${verseNumber} from surah #${surahNumber}`,
        cached
      ));
    } catch (error: any) {
      console.error('Error in getVerse controller:', error);
      
      if (error.message?.includes('Invalid')) {
        return res.status(400).json(responseUtil.error(error.message));
      }
      
      return res.status(500).json(responseUtil.error(
        `Failed to retrieve verse #${req.params.verseNumber} from surah #${req.params.surahNumber}`
      ));
    }
  }
}

export default new QuranController();