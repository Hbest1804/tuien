import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import { getAchievements } from '../controllers/achievementController.js';

const router = express.Router();
router.get('/', protect, getAchievements);
export default router;
