import express from 'express';
import { getBalance, collectIdleStones, getShopItems, buyShopItem } from '../controllers/economyController.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

// ─── Linh Thạch Balance ───────────────────────────────────────────────────────
router.get('/balance', getBalance);
router.post('/idle-collect', collectIdleStones);

// ─── Thương Hội (Shop) ────────────────────────────────────────────────────────
router.get('/shop', getShopItems);
router.post('/shop/buy', buyShopItem);

export default router;
