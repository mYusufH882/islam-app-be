import { Request, Response, NextFunction } from 'express';
import commentFilterUtil from '../utils/commentFilter.util';

export const validateCreateComment = (req: Request, res: Response, next: NextFunction): void => {
  const { content, blogId, parentId } = req.body;

  // Validasi konten komentar
  if (!content || content.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'Konten komentar tidak boleh kosong'
    });
    return;
  }

  // Validasi panjang konten (misalnya, maks 1000 karakter)
  if (content.length > 1000) {
    res.status(400).json({
      success: false,
      message: 'Komentar terlalu panjang, maksimal 1000 karakter'
    });
    return;
  }

  // Validasi blogId
  if (!blogId) {
    res.status(400).json({
      success: false,
      message: 'ID blog diperlukan'
    });
    return;
  }

  // Jika komentar mengandung kata terlarang, tambahkan flag untuk controller
  if (commentFilterUtil.containsForbiddenWords(content)) {
    req.body.containsForbiddenWords = true;
  }

  // Jika komentar mungkin spam, tambahkan flag untuk controller
  if (commentFilterUtil.isLikelySpam(content)) {
    req.body.isLikelySpam = true;
  }

  next();
};

export const validateUpdateComment = (req: Request, res: Response, next: NextFunction): void => {
  const { content } = req.body;

  // Validasi konten
  if (!content || content.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'Konten komentar tidak boleh kosong'
    });
    return;
  }

  // Validasi panjang
  if (content.length > 1000) {
    res.status(400).json({
      success: false,
      message: 'Komentar terlalu panjang, maksimal 1000 karakter'
    });
    return;
  }

  // Jika komentar mengandung kata terlarang, tambahkan flag untuk controller
  if (commentFilterUtil.containsForbiddenWords(content)) {
    req.body.containsForbiddenWords = true;
  }

  // Jika komentar mungkin spam, tambahkan flag untuk controller
  if (commentFilterUtil.isLikelySpam(content)) {
    req.body.isLikelySpam = true;
  }

  next();
};