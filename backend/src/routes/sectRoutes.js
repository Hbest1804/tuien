import express from 'express';
import { getMissions, startMission, completeMission } from '../controllers/sectController.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/missions', protect, getMissions);
router.post('/missions/start', protect, startMission);
router.post('/missions/complete', protect, completeMission);

export default router;
