import express from 'express';
import { getPavilionItems, exchangeItem } from '../controllers/pavilionController.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getPavilionItems);
router.post('/exchange', protect, exchangeItem);

export default router;
