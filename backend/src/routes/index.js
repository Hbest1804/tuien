import express from 'express';
import authRoutes from './authRoutes.js';
import cultivationRoutes from './cultivationRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import economyRoutes from './economyRoutes.js';
import auctionRoutes from './auctionRoutes.js';
import leaderboardRoutes from './leaderboardRoutes.js';
import pavilionRoutes from './pavilionRoutes.js';
import dungeonRoutes from './dungeonRoutes.js';
import sectRoutes from './sectRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/cultivation', cultivationRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/economy', economyRoutes);
router.use('/auction', auctionRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/pavilion', pavilionRoutes);
router.use('/dungeons', dungeonRoutes);
router.use('/sect', sectRoutes);
router.use('/admin', adminRoutes);

export default router;
