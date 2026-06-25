import express from 'express';
import authRoutes from './authRoutes.js';
import cultivationRoutes from './cultivationRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/cultivation', cultivationRoutes);



export default router;
