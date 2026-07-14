import cron from 'node-cron';
import RefreshToken from '../models/RefreshToken.js';

/**
 * Khởi động các cron jobs cho server
 * - Mỗi ngày lúc 3:00 AM: xóa refresh tokens hết hạn và đã revoke
 */
export const startCronJobs = () => {
  // Chạy mỗi ngày lúc 03:00 AM (giờ server)
  cron.schedule('0 3 * * *', async () => {
    console.log('[Cron] 🧹 Đang dọn dẹp refresh tokens hết hạn...');
    try {
      await RefreshToken.deleteExpired();
      console.log('[Cron] ✅ Xóa refresh tokens hết hạn thành công.');
    } catch (err) {
      console.error('[Cron] ❌ Lỗi khi xóa refresh tokens:', err.message);
    }
  }, {
    timezone: 'Asia/Ho_Chi_Minh',
  });

  console.log('[Cron] ✅ Đã đăng ký cron job: dọn dẹp token lúc 3:00 AM hàng ngày.');
};
