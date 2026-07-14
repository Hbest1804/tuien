import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import { getRecipes, craftItem, enchantItem } from '../controllers/blacksmithController.js';

const router = express.Router();

router.get('/recipes', protect, getRecipes);
router.post('/craft', protect, craftItem);
router.post('/enchant', protect, enchantItem);

export default router;
