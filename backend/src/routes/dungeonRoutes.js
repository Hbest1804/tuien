import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import {
  getDungeonStatus,
  startExploration,
  claimDungeonRewards,
  advanceFloor,
  resolveFloorEvent,
  fightBoss,
} from '../controllers/dungeonController.js';

const router = express.Router();

router.get('/', protect, getDungeonStatus);
router.post('/start', protect, startExploration);
router.post('/advance-floor', protect, advanceFloor);
router.post('/resolve-event', protect, resolveFloorEvent);
router.post('/fight-boss', protect, fightBoss);
router.post('/claim', protect, claimDungeonRewards);

export default router;
