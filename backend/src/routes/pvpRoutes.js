import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import { getPvpStatus, getPvpRankings, challengePlayer, findRandomOpponent } from '../controllers/pvpController.js';

const router = express.Router();

router.get('/status', protect, getPvpStatus);
router.get('/rankings', protect, getPvpRankings);
router.get('/find-opponent', protect, findRandomOpponent);
router.post('/challenge', protect, challengePlayer);

export default router;
