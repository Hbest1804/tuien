import rateLimit from 'express-rate-limit';

/**
 * Rate limiter tổng quát — áp dụng cho toàn bộ /api
 * Giới hạn: 100 request / 15 phút / IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000, // Tăng lên 1000 cho môi trường dev
  standardHeaders: true,  // Gửi RateLimit-* headers chuẩn RFC
  legacyHeaders: false,
  message: {
    message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút.',
  },
  skip: (req) => {
    // Bỏ qua health check
    return req.path === '/' || req.path === '/health';
  },
});

/**
 * Rate limiter nghiêm ngặt cho Auth endpoints
 * Giới hạn: 5 request / 15 phút / IP
 * Áp dụng cho: /login, /register, /forgot-password
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 50, // Tăng lên 50 cho môi trường dev
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.',
  },
});

/**
 * Rate limiter cho OTP request (forgot-password) — rất nghiêm ngặt
 * Giới hạn: 3 request / 60 phút / IP
 */
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 phút
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Quá nhiều yêu cầu OTP. Vui lòng thử lại sau 1 giờ.',
  },
});

/**
 * Rate limiter riêng cho verify-otp — thưa lơn hơn để tránh khóa do nhập sai
 * Giới hạn: 10 request / 60 phút / IP
 */
export const otpVerifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 phút
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Quá nhiều lần xác thực OTP. Vui lòng thử lại sau 1 giờ.',
  },
});
