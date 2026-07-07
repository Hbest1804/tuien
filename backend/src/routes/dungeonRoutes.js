import express from 'express';
import { getDungeonStatus, startExploration, claimDungeonRewards } from '../controllers/dungeonController.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getDungeonStatus);
router.post('/start', protect, startExploration);
router.post('/claim', protect, claimDungeonRewards);

export default router;
