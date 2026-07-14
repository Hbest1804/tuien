import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import { getSectWarStatus, declareWar, attackLinhMach, getSectWarLeaderboard } from '../controllers/sectWarController.js';

const router = express.Router();

router.get('/status', protect, getSectWarStatus);
router.get('/leaderboard', protect, getSectWarLeaderboard);
router.post('/declare', protect, declareWar);
router.post('/attack', protect, attackLinhMach);

export default router;
