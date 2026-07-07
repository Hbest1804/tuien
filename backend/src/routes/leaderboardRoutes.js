import express from 'express';
import { getLeaderboard } from '../controllers/leaderboardController.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public: Bảng xếp hạng (yêu cầu đăng nhập để xem chi tiết)
router.get('/', protect, getLeaderboard);

export default router;
