import express from 'express';
import authRoutes from './authRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);

// Thêm các routes khác ở đây:
// router.use('/users', userRoutes);
// router.use('/products', productRoutes);

export default router;
