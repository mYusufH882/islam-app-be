/**
 * Format respons standar untuk API
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    timestamp: string;
    cached?: boolean;
}
  
/**
 * Class utilitas untuk membuat respons API yang konsisten
 */
class ResponseUtil {
    /**
     * Membuat respons sukses
     * @param data - Data yang akan dikembalikan
     * @param message - Pesan sukses opsional
     * @param cached - Apakah data berasal dari cache
     */
    success<T>(data: T, message?: string, cached = false): ApiResponse<T> {
      return {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
        cached
      };
    }
  
    /**
     * Membuat respons error
     * @param message - Pesan error
     * @param data - Data tambahan opsional
     */
    error<T>(message: string, data?: T): ApiResponse<T> {
      return {
        success: false,
        message,
        data,
        timestamp: new Date().toISOString()
      };
    }
}
  
export default new ResponseUtil();