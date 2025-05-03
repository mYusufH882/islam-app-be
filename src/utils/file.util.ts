import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

class FileUtil {
  /**
   * Membuat direktori secara rekursif jika belum ada
   */
  ensureDirectoryExists(directoryPath: string): void {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  }

  /**
   * Menghapus file lama jika ada
   */
  removeFile(filePath: string): void {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`File berhasil dihapus: ${filePath}`);
      } catch (error) {
        console.error(`Error menghapus file ${filePath}:`, error);
      }
    }
  }

  /**
   * Menghasilkan nama file unik dengan UUID
   */
  generateUniqueFilename(originalFilename: string): string {
    const fileExtension = path.extname(originalFilename);
    return `${uuidv4()}${fileExtension}`;
  }

  /**
   * Menghasilkan path penyimpanan berdasarkan tahun/bulan
   */
  getUploadPath(baseDir: string): string {
    const now = new Date();
    const year = now.getFullYear();
    // Bulan dimulai dari 0, jadi perlu ditambah 1
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const uploadPath = path.join(baseDir, String(year), month);
    this.ensureDirectoryExists(uploadPath);
    
    return uploadPath;
  }
}

export default new FileUtil();