class CommentFilterUtil {
  // Daftar kata terlarang yang mungkin ingin disaring
  private forbiddenWords: string[] = [
    'judi', 'poker', 'casino', 'togel', 'bandar', 
    'xxx', 'sex', 'porn', 'viagra', 'anjing', 'goblok', 'asu', 'pantek',
    'tolol', 'bego', 'bangsat'
    // tambahkan kata terlarang lainnya
  ];

  /**
   * Memeriksa apakah konten mengandung kata-kata terlarang
   * @param content - Teks komentar
   * @returns boolean - true jika mengandung kata terlarang
   */
  containsForbiddenWords(content: string): boolean {
    const lowerContent = content.toLowerCase();
    return this.forbiddenWords.some(word => lowerContent.includes(word));
  }

  /**
   * Menghitung jumlah tautan dalam konten
   * @param content - Teks komentar
   * @returns number - Jumlah tautan yang ditemukan
   */
  countLinks(content: string): number {
    // Cari http://, https://, www.
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    const matches = content.match(urlRegex);
    return matches ? matches.length : 0;
  }

  /**
   * Memeriksa apakah komentar kemungkinan adalah spam
   * @param content - Teks komentar
   * @returns boolean - true jika kemungkinan spam
   */
  isLikelySpam(content: string): boolean {
    // Komentar dianggap mungkin spam jika:
    // 1. Mengandung kata terlarang, atau
    // 2. Memiliki lebih dari 2 tautan
    return this.containsForbiddenWords(content) || this.countLinks(content) > 2;
  }
}

export default new CommentFilterUtil();