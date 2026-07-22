import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import { getMonsters, fight } from '../controllers/combatController.js';

const router = express.Router();
router.get('/monsters', protect, getMonsters);
router.post('/fight', protect, fight);
export default router;
