import express from 'express';
import { getInventoryStatus, addTestItem, useItem, equipItem, unequipItem, learnTechnique } from '../controllers/inventoryController.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // Yêu cầu đăng nhập cho tất cả các route bên dưới

// Lấy trạng thái túi đồ
router.get('/', getInventoryStatus);

// API Cheat: Thêm item vào túi
if (process.env.NODE_ENV === 'development') {
  router.post('/add-test-item', addTestItem);
}

// API Sử dụng vật phẩm
router.post('/use', useItem);

// API Trang bị / tháo trang bị
router.post('/equip', equipItem);
router.post('/unequip', unequipItem);

// API Học công pháp
router.post('/learn-technique', learnTechnique);

export default router;
