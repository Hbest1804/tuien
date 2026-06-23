import express from 'express';
import { registerUser, loginUser, getMe, setupCharacter } from '../controllers/authController.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (cần đăng nhập)
router.get('/me', protect, getMe);
router.post('/setup-character', protect, setupCharacter);

export default router;