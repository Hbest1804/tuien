import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import {
  getDungeonStatus,
  startExploration,
  retreatDungeon,
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
router.post('/retreat', protect, retreatDungeon); // Thoát bí cảnh giữa chừng (không thưởng)

export default router;
