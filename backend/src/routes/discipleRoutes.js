import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import { getDiscipleStatus, acceptDisciple, releaseDisciple, requestPartner, divorcePartner } from '../controllers/discipleController.js';

const router = express.Router();

router.get('/status', protect, getDiscipleStatus);
router.post('/accept', protect, acceptDisciple);
router.post('/release', protect, releaseDisciple);
router.post('/partner', protect, requestPartner);
router.post('/divorce', protect, divorcePartner);

export default router;
