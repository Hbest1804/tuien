import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import { getVipPackages, purchaseJade, spendJade, getVipStatus } from '../controllers/vipController.js';

const router = express.Router();

router.get('/packages', protect, getVipPackages);
router.get('/status', protect, getVipStatus);
router.post('/purchase', protect, purchaseJade);
router.post('/spend', protect, spendJade);

export default router;
