import express from 'express';
import { getBalance, collectIdleStones, getShopItems, buyShopItem, sellShopItem, getSellPrices, getTransactionHistory } from '../controllers/economyController.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

// ─── Linh Thạch Balance ───────────────────────────────────────────────────────
router.get('/balance', getBalance);
router.post('/idle-collect', collectIdleStones);

// ─── Thương Hội (Shop) ────────────────────────────────────────────────────────
router.get('/shop', getShopItems);
router.post('/shop/buy', buyShopItem);
router.post('/shop/sell', sellShopItem);
router.get('/shop/sell-prices', getSellPrices);

// ─── Lịch sử giao dịch cá nhân ──────────────────────────────────────
router.get('/history', getTransactionHistory);

export default router;
