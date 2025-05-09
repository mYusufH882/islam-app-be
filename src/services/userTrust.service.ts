import UserTrust from '../models/userTrust.model';
import User from '../models/user.model';

class UserTrustService {
  // Threshold untuk naik ke level 'trusted'
  private TRUST_THRESHOLD = 3;
  
  // Threshold untuk turun kembali ke level 'new'
  private DISTRUST_THRESHOLD = 2;

  /**
   * Mendapatkan atau membuat data kepercayaan pengguna jika belum ada
   */
  async getOrCreateUserTrust(userId: number): Promise<UserTrust> {
    let userTrust = await UserTrust.findOne({
      where: { userId }
    });

    if (!userTrust) {
      userTrust = await UserTrust.create({
        userId,
        trustLevel: 'new',
        approvedComments: 0,
        rejectedComments: 0
      });
    }

    return userTrust;
  }

  /**
   * Periksa apakah pengguna dalam status terpercaya
   */
  async isUserTrusted(userId: number): Promise<boolean> {
    const userTrust = await this.getOrCreateUserTrust(userId);
    return userTrust.trustLevel === 'trusted';
  }

  /**
   * Update status kepercayaan pengguna setelah komentar disetujui
   */
  async handleApprovedComment(userId: number): Promise<void> {
    const userTrust = await this.getOrCreateUserTrust(userId);
    
    // Tambahkan jumlah komentar yang disetujui
    const approvedComments = userTrust.approvedComments + 1;
    
    // Jika sudah mencapai threshold dan masih 'new', ubah ke 'trusted'
    let trustLevel = userTrust.trustLevel;
    if (approvedComments >= this.TRUST_THRESHOLD && trustLevel === 'new') {
      trustLevel = 'trusted';
    }
    
    await userTrust.update({
      approvedComments,
      trustLevel
    });
  }

  /**
   * Update status kepercayaan pengguna setelah komentar ditolak
   */
  async handleRejectedComment(userId: number): Promise<void> {
    const userTrust = await this.getOrCreateUserTrust(userId);
    
    // Tambahkan jumlah komentar yang ditolak
    const rejectedComments = userTrust.rejectedComments + 1;
    
    // Jika sudah mencapai threshold dan masih 'trusted', ubah ke 'new'
    let trustLevel = userTrust.trustLevel;
    if (rejectedComments >= this.DISTRUST_THRESHOLD && trustLevel === 'trusted') {
      trustLevel = 'new';
      
      // Reset perhitungan saat kembali ke level 'new'
      await userTrust.update({
        rejectedComments: 0,
        approvedComments: 0,
        trustLevel
      });
    } else {
      await userTrust.update({
        rejectedComments
      });
    }
  }
}

export default new UserTrustService();