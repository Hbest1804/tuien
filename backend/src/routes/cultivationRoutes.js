import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import {
  getStatus,
  startTraining,
  stopTraining,
  breakthrough,
  joinSect,
  leaveSect,
} from '../controllers/cultivationController.js';

const router = express.Router();

// Tất cả routes đều yêu cầu đăng nhập
router.use(protect);

router.get('/status', getStatus);
router.post('/start', startTraining);
router.post('/stop', stopTraining);
router.post('/breakthrough', breakthrough);
router.post('/join-sect', joinSect);
router.post('/leave-sect', leaveSect);

export default router;
