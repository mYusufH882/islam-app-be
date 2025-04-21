import NodeCache from 'node-cache';

// Cache instance dengan standar TTL 1 jam
const cache = new NodeCache({ stdTTL: 3600 });

/**
 * Utility class untuk manajemen cache
 */
class CacheUtil {
  /**
   * Mendapatkan data dari cache
   * @param key - Kunci cache
   */
  get<T>(key: string): T | undefined {
    return cache.get<T>(key);
  }

  /**
   * Menyimpan data ke cache
   * @param key - Kunci cache
   * @param data - Data yang akan disimpan
   * @param ttl - Time-to-live dalam detik (opsional)
   */
  set<T>(key: string, data: T, ttl?: number): boolean {
    // Jika ttl tidak didefinisikan, gunakan nilai default dari NodeCache
    if (ttl === undefined) {
      return cache.set<T>(key, data);
    }
    // Jika ttl didefinisikan, gunakan nilai tersebut
    return cache.set<T>(key, data, ttl);
  }

  /**
   * Menghapus data dari cache
   * @param key - Kunci cache
   */
  delete(key: string): number {
    return cache.del(key);
  }

  /**
   * Memeriksa apakah kunci ada di cache
   * @param key - Kunci cache
   */
  has(key: string): boolean {
    return cache.has(key);
  }

  /**
   * Membersihkan seluruh cache
   */
  flush(): void {
    cache.flushAll();
  }
}

export default new CacheUtil();