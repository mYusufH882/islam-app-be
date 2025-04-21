import axios from 'axios';
import cacheUtil from '../utils/cache.util';

// Konfigurasi API Jadwal Sholat
const API_BASE_URL = 'https://api.aladhan.com/v1';

// Method untuk perhitungan waktu sholat
const DEFAULT_METHOD = 3; // Umm al-Qura University, Makkah

// TTL caching dalam detik
const CACHE_TTL = {
  TODAY: 12 * 60 * 60, // 12 jam
  DATE: 7 * 24 * 60 * 60, // 1 minggu
  CALENDAR: 30 * 24 * 60 * 60 // 1 bulan
};

/**
 * Service untuk berinteraksi dengan API Jadwal Sholat
 */
class PrayerService {
  /**
   * Format tanggal menjadi YYYY-MM-DD
   * @param date - Objek Date
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  /**
   * Mendapatkan jadwal sholat untuk hari ini
   * @param latitude - Koordinat latitude
   * @param longitude - Koordinat longitude
   * @param method - Metode perhitungan (opsional)
   */
  async getTodayPrayerTimes(latitude: number, longitude: number, method: number = DEFAULT_METHOD) {
    const today = new Date();
    return this.getPrayerTimesByDate(this.formatDate(today), latitude, longitude, method);
  }
  
  /**
   * Mendapatkan jadwal sholat untuk tanggal tertentu
   * @param date - Tanggal dalam format YYYY-MM-DD
   * @param latitude - Koordinat latitude
   * @param longitude - Koordinat longitude
   * @param method - Metode perhitungan (opsional)
   */
  async getPrayerTimesByDate(date: string, latitude: number, longitude: number, method: number = DEFAULT_METHOD) {
    // Validasi koordinat
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Invalid coordinates');
    }
    
    const cacheKey = `prayer_times_${date}_${latitude.toFixed(4)}_${longitude.toFixed(4)}_${method}`;
    
    // Cek cache dulu
    const cachedData = cacheUtil.get(cacheKey);
    if (cachedData) {
      return { data: cachedData, cached: true };
    }
    
    // Jika tidak ada di cache, ambil dari API
    try {
      const response = await axios.get(`${API_BASE_URL}/timings/${date}`, {
        params: {
          latitude,
          longitude,
          method
        }
      });
      
      if (response.data.code === 200) {
        const prayerData = {
          timings: response.data.data.timings,
          date: response.data.data.date,
          meta: response.data.data.meta
        };
        
        // Simpan ke cache
        // Jika tanggal hari ini, gunakan TTL yang lebih pendek
        const isToday = date === this.formatDate(new Date());
        const ttl = isToday ? CACHE_TTL.TODAY : CACHE_TTL.DATE;
        
        cacheUtil.set(cacheKey, prayerData, ttl);
        return { data: prayerData, cached: false };
      }
      
      throw new Error(`Failed to fetch prayer times for ${date}`);
    } catch (error) {
      console.error(`Error fetching prayer times for ${date}:`, error);
      throw error;
    }
  }
  
  /**
   * Mendapatkan kalender sholat untuk bulan tertentu
   * @param year - Tahun (contoh: 2025)
   * @param month - Bulan (1-12)
   * @param latitude - Koordinat latitude
   * @param longitude - Koordinat longitude
   * @param method - Metode perhitungan (opsional)
   */
  async getMonthlyCalendar(year: number, month: number, latitude: number, longitude: number, method: number = DEFAULT_METHOD) {
    // Validasi input
    if (month < 1 || month > 12) {
      throw new Error('Invalid month. Must be between 1 and 12.');
    }
    
    const cacheKey = `prayer_calendar_${year}_${month}_${latitude.toFixed(4)}_${longitude.toFixed(4)}_${method}`;
    
    // Cek cache dulu
    const cachedData = cacheUtil.get(cacheKey);
    if (cachedData) {
      return { data: cachedData, cached: true };
    }
    
    // Jika tidak ada di cache, ambil dari API
    try {
      const response = await axios.get(`${API_BASE_URL}/calendar/${year}/${month}`, {
        params: {
          latitude,
          longitude,
          method
        }
      });
      
      if (response.data.code === 200) {
        // Simpan ke cache
        cacheUtil.set(cacheKey, response.data.data, CACHE_TTL.CALENDAR);
        return { data: response.data.data, cached: false };
      }
      
      throw new Error(`Failed to fetch prayer calendar for ${year}-${month}`);
    } catch (error) {
      console.error(`Error fetching prayer calendar for ${year}-${month}:`, error);
      throw error;
    }
  }
  
  /**
   * Mendapatkan informasi lokasi dari koordinat
   * @param latitude - Koordinat latitude
   * @param longitude - Koordinat longitude
   */
  async getLocation(latitude: number, longitude: number) {
    try {
      const response = await axios.get('https://api.bigdatacloud.net/data/reverse-geocode-client', {
        params: {
          latitude,
          longitude,
          localityLanguage: 'id'
        }
      });
      
      return {
        city: response.data.city || response.data.locality || 'Unknown',
        country: response.data.countryName,
        latitude,
        longitude
      };
    } catch (error) {
      console.error('Error getting location name:', error);
      // Fallback jika API gagal
      return {
        city: 'Unknown',
        country: 'Unknown',
        latitude,
        longitude
      };
    }
  }
}

export default new PrayerService();