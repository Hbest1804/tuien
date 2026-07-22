import express from 'express';
import { getMissions, startMission, completeMission } from '../controllers/sectController.js';
import { getSectBuildings, upgradeSectBuilding } from '../controllers/sectBuildingController.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/missions', protect, getMissions);
router.post('/missions/start', protect, startMission);
router.post('/missions/complete', protect, completeMission);

router.get('/buildings', protect, getSectBuildings);
router.post('/buildings/upgrade', protect, upgradeSectBuilding);

export default router;
