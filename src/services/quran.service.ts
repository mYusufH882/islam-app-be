import axios from 'axios';
import cacheUtil from '../utils/cache.util';

// Konfigurasi API Al-Quran
const API_BASE_URL = 'https://api.quran.gading.dev';

// TTL caching dalam detik
const CACHE_TTL = {
  SURAH_LIST: 7 * 24 * 60 * 60, // 1 minggu
  SURAH_DETAIL: 7 * 24 * 60 * 60, // 1 minggu
  VERSE: 7 * 24 * 60 * 60 // 1 minggu
};

/**
 * Service untuk berinteraksi dengan API Al-Quran
 */
class QuranService {
  /**
   * Mendapatkan daftar seluruh surah dari API atau cache
   */
  async getAllSurah() {
    const cacheKey = 'quran_surah_list';
    
    // Cek cache dulu
    const cachedData = cacheUtil.get(cacheKey);
    if (cachedData) {
      return { data: cachedData, cached: true };
    }
    
    // Jika tidak ada di cache, ambil dari API
    try {
      const response = await axios.get(`${API_BASE_URL}/surah`);
      
      if (response.data.code === 200) {
        // Simpan ke cache
        cacheUtil.set(cacheKey, response.data.data, CACHE_TTL.SURAH_LIST);
        return { data: response.data.data, cached: false };
      }
      
      throw new Error('Failed to fetch surah list');
    } catch (error) {
      console.error('Error fetching surah list:', error);
      throw error;
    }
  }
  
  /**
   * Mendapatkan detail surah berdasarkan nomor
   * @param number - Nomor surah (1-114)
   */
  async getSurahByNumber(number: number) {
    if (number < 1 || number > 114) {
      throw new Error('Invalid surah number. Must be between 1 and 114.');
    }
    
    const cacheKey = `quran_surah_${number}`;
    
    // Cek cache dulu
    const cachedData = cacheUtil.get(cacheKey);
    if (cachedData) {
      return { data: cachedData, cached: true };
    }
    
    // Jika tidak ada di cache, ambil dari API
    try {
      const response = await axios.get(`${API_BASE_URL}/surah/${number}`);
      
      if (response.data.code === 200) {
        // Simpan ke cache
        cacheUtil.set(cacheKey, response.data.data, CACHE_TTL.SURAH_DETAIL);
        return { data: response.data.data, cached: false };
      }
      
      throw new Error(`Failed to fetch surah #${number}`);
    } catch (error) {
      console.error(`Error fetching surah #${number}:`, error);
      throw error;
    }
  }
  
  /**
   * Mendapatkan ayat tertentu dari surah
   * @param surahNumber - Nomor surah (1-114)
   * @param verseNumber - Nomor ayat
   */
  async getVerse(surahNumber: number, verseNumber: number) {
    if (surahNumber < 1 || surahNumber > 114) {
      throw new Error('Invalid surah number. Must be between 1 and 114.');
    }
    
    const cacheKey = `quran_verse_${surahNumber}_${verseNumber}`;
    
    // Cek cache dulu
    const cachedData = cacheUtil.get(cacheKey);
    if (cachedData) {
      return { data: cachedData, cached: true };
    }
    
    try {
      // Ambil seluruh surah dulu
      const { data: surah } = await this.getSurahByNumber(surahNumber);
      
      // Cek apakah nomor ayat valid
      if (verseNumber < 1 || verseNumber > surah.numberOfVerses) {
        throw new Error(`Invalid verse number. Surah #${surahNumber} has ${surah.numberOfVerses} verses.`);
      }
      
      // Ambil ayat yang diminta
      const verse = surah.verses[verseNumber - 1];
      
      // Simpan ke cache
      cacheUtil.set(cacheKey, verse, CACHE_TTL.VERSE);
      return { data: verse, cached: false };
    } catch (error) {
      console.error(`Error fetching verse #${verseNumber} from surah #${surahNumber}:`, error);
      throw error;
    }
  }
}

export default new QuranService();