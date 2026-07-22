import express from 'express';
import { getChatHistory } from '../controllers/chatController.js';

const router = express.Router();
// Lịch sử chat là public (không cần auth) để load khi kết nối
router.get('/history', getChatHistory);
export default router;
