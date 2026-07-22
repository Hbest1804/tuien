import 'dotenv/config';
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import seedAdmin from './config/seedAdmin.js';
import { startCronJobs } from './config/cronJobs.js';
import { initWebSocket } from './config/wsServer.js';

const PORT = process.env.PORT || 3000;

// Kết nối database rồi mới khởi động server
connectDB()
  .then(() => seedAdmin())
  .then(() => startCronJobs())
  .then(() => {
    const httpServer = http.createServer(app);

    // Khởi tạo WebSocket server (chat + notifications)
    initWebSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
      console.log(`🔌 WebSocket sẵn sàng tại ws://localhost:${PORT}/ws`);
      console.log(`📌 Môi trường: ${process.env.NODE_ENV}`);
    });
  });

