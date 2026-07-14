import express from 'express';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getMe,
  setupCharacter,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from '../controllers/authController.js';
import protect from '../middlewares/authMiddleware.js';
import { authLimiter, otpLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// ── Public routes (có rate limit nghiêm ngặt) ──────────────────────────────
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/refresh', refreshAccessToken);           // Không giới hạn vì frontend tự refresh
router.post('/logout', logoutUser);                    // Thu hồi refresh token

// ── Quên mật khẩu / Reset qua OTP ─────────────────────────────────────────
router.post('/forgot-password', otpLimiter, forgotPassword);    // Gửi OTP qua email
router.post('/verify-otp', otpLimiter, verifyOtp);              // Xác thực OTP → nhận resetToken
router.post('/reset-password', resetPassword);                   // Đặt lại mật khẩu với resetToken

// ── Protected routes (cần đăng nhập) ──────────────────────────────────────
router.get('/me', protect, getMe);
router.post('/setup-character', protect, setupCharacter);
router.post('/change-password', protect, changePassword);        // Đổi mật khẩu (biết MK cũ)

export default router;