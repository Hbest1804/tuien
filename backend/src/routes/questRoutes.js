import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import { getDailyQuests, claimDailyQuest } from '../controllers/dailyQuestController.js';
import { getMainQuests, checkMainQuest } from '../controllers/mainQuestController.js';

const router = express.Router();

// Daily quests
router.get('/daily', protect, getDailyQuests);
router.post('/daily/claim/:questId', protect, claimDailyQuest);

// Main quest chain
router.get('/main', protect, getMainQuests);
router.post('/main/check', protect, checkMainQuest);

export default router;
