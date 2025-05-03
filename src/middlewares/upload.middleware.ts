import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fileUtil from '../utils/file.util';

// Base directory untuk uploads blog
const BLOG_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'blog');

// Setup storage untuk multer
const storage = multer.diskStorage({
  destination: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    // Buat path upload berdasarkan tahun/bulan
    const uploadPath = fileUtil.getUploadPath(BLOG_UPLOAD_DIR);
    cb(null, uploadPath);
  },
  filename: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Generate nama file unik
    const uniqueFilename = fileUtil.generateUniqueFilename(file.originalname);
    cb(null, uniqueFilename);
  }
});

// Filter untuk memvalidasi tipe file
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // Izinkan hanya gambar
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipe file tidak didukung. Harap unggah file gambar (JPG, PNG, GIF, WebP)'));
  }
};

// Setup multer untuk blog
const blogUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// Middleware error handling untuk multer
export const handleUploadError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    // Error dari multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Ukuran file melebihi batas maksimum 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Error upload: ${err.message}`
    });
  } else if (err) {
    // Error lainnya
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// Export middlewares
// Di upload.middleware.ts

// Buat middleware wrapper untuk menangkap error
export const uploadBlogImage = (req: Request, res: Response, next: NextFunction) => {
    const upload = multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      }
    }).single('image');
  
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Error dari multer
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Ukuran file melebihi batas maksimum 5MB'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Error upload: ${err.message}`
        });
      } else if (err) {
        // Error lainnya
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      // Tidak ada error, lanjutkan
      next();
    });
};

// Function untuk mendapatkan path relatif dari file yang diupload
export const getRelativeImagePath = (file: Express.Multer.File | undefined): string | null => {
  if (!file) return null;
  
  // Mengubah absolute path menjadi path relatif untuk disimpan di database dan diakses dari web
  // Contoh: /uploads/blog/2025/05/abcd1234.jpg
  const relativePath = file.path.split('public')[1].replace(/\\/g, '/');
  return relativePath;
};