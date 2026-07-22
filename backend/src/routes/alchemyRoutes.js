import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import { getRecipes, craftItem } from '../controllers/alchemyController.js';

const router = express.Router();
router.get('/recipes', protect, getRecipes);
router.post('/craft', protect, craftItem);
export default router;
