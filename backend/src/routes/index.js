import express from 'express';
import authRoutes from './authRoutes.js';
import cultivationRoutes from './cultivationRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/cultivation', cultivationRoutes);
router.use('/inventory', inventoryRoutes);



export default router;
