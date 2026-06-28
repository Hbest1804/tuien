import express from 'express';
import {
  getListings,
  getMyListings,
  listItem,
  placeBid,
  buyout,
  claimListing,
  cancelListing,
} from '../controllers/auctionController.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

// Danh sách đấu giá public
router.get('/', getListings);
// Listing của tôi + đang thắng thầu
router.get('/my', getMyListings);
// Đăng bán vật phẩm
router.post('/list', listItem);
// Đặt giá thầu
router.post('/bid', placeBid);
// Mua ngay
router.post('/buyout', buyout);
// Claim (nhận hàng / nhận tiền)
router.post('/claim', claimListing);
// Huỷ listing (chỉ khi chưa có bid)
router.delete('/:id', cancelListing);

export default router;
