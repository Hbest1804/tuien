import express from 'express';
import authRoutes from './authRoutes.js';
import cultivationRoutes from './cultivationRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import economyRoutes from './economyRoutes.js';
import auctionRoutes from './auctionRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/cultivation', cultivationRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/economy', economyRoutes);
router.use('/auction', auctionRoutes);



export default router;
