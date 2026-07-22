import express from 'express';
import { getPublicProfile } from '../controllers/userController.js';

const router = express.Router();

// Public route — không cần đăng nhập
router.get('/:username', getPublicProfile);

export default router;
