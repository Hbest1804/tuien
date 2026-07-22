import protect from './authMiddleware.js';

/**
 * Middleware isAdmin — kiểm tra role admin sau khi đã xác thực token.
 * Dùng kết hợp: router.use(protect, isAdmin)
 */
const isAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Chưa xác thực.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Không có quyền Admin.' });
  }
  next();
};

export { isAdmin };
export default isAdmin;
