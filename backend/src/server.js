import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import seedAdmin from './config/seedAdmin.js';

const PORT = process.env.PORT || 3000;

// Kết nối database rồi mới khởi động server
connectDB()
  .then(() => seedAdmin())          // Tự động tạo admin nếu chưa có
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
      console.log(`📌 Môi trường: ${process.env.NODE_ENV}`);
    });
  });
