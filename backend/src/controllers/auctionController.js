import mongoose from 'mongoose';
import User from '../models/User.js';
import Inventory from '../models/Inventory.js';
import AuctionListing from '../models/AuctionListing.js';
import { ITEMS } from '../data/items.js';

// Phí đăng bán: 5% giá bán cuối (tối thiểu 1)
const AUCTION_FEE_RATE = 0.05;
// Giá thầu tối thiểu = hiện tại + 5%
const MIN_BID_INCREMENT = 0.05;
// Thời hạn hợp lệ (giờ)
const VALID_DURATIONS_H = [12, 24, 48];

const getOrCreateInventory = async (userId, session = null) => {
  const existing = await Inventory.findOne({ userId }).session(session);
  if (existing) return existing;
  return await Inventory.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );
};

// Helper: kiểm tra và cập nhật trạng thái listing hết hạn
const resolveExpiredListings = async () => {
  const now = new Date();
  // active + hết hạn + có bid → pending_claim
  await AuctionListing.updateMany(
    { status: 'active', expiresAt: { $lte: now }, bidderId: { $ne: null } },
    { $set: { status: 'pending_claim' }, $inc: { __v: 1 } }
  );
  // active + hết hạn + không có bid → expired
  await AuctionListing.updateMany(
    { status: 'active', expiresAt: { $lte: now }, bidderId: null },
    { $set: { status: 'expired' }, $inc: { __v: 1 } }
  );
};

// ─── GET /auction — Lấy danh sách đấu giá ─────────────────────────────────────
export const getListings = async (req, res) => {
  try {
    const { itemType, rarity, sort = 'newest', page = 1, limit = 20 } = req.query;

    const now = new Date();
    const filter = { status: 'active', expiresAt: { $gt: now } };
    if (itemType) filter.itemType = itemType;
    if (rarity) filter.itemRarity = rarity;

    let sortOption = {};
    if (sort === 'price_asc') sortOption = { currentBid: 1, startingPrice: 1 };
    else if (sort === 'price_desc') sortOption = { currentBid: -1, startingPrice: -1 };
    else if (sort === 'ending_soon') sortOption = { expiresAt: 1 };
    else sortOption = { createdAt: -1 }; // newest

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;
    const [listings, total] = await Promise.all([
      AuctionListing.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuctionListing.countDocuments(filter),
    ]);

    res.json({
      listings,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error('Lỗi getListings:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── GET /auction/my — Listings của tôi + đang thắng thầu ─────────────────────
export const getMyListings = async (req, res) => {
  try {
    await resolveExpiredListings();
    const userId = req.user._id;

    const [selling, bidding] = await Promise.all([
      AuctionListing.find({ sellerId: userId }).sort({ createdAt: -1 }).lean(),
      AuctionListing.find({
        bidderId: userId,
        status: { $in: ['active', 'pending_claim'] },
        sellerId: { $ne: userId },
      }).sort({ expiresAt: 1 }).lean(),
    ]);

    res.json({ selling, bidding });
  } catch (err) {
    console.error('Lỗi getMyListings:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /auction/list — Đăng bán vật phẩm ──────────────────────────────────
export const listItem = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const { itemId, quantity = 1, startingPrice, buyoutPrice = null, durationHours = 24 } = req.body;

    // Validate
    if (!itemId || !ITEMS[itemId]) return res.status(400).json({ message: 'Vật phẩm không hợp lệ.' });
    if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: 'Số lượng không hợp lệ.' });
    if (!Number.isInteger(startingPrice) || startingPrice < 1) return res.status(400).json({ message: 'Giá khởi điểm phải ≥ 1 Linh Thạch.' });
    if (buyoutPrice !== null && (!Number.isInteger(buyoutPrice) || buyoutPrice <= startingPrice)) {
      return res.status(400).json({ message: 'Giá mua ngay phải lớn hơn giá khởi điểm.' });
    }
    if (!VALID_DURATIONS_H.includes(durationHours)) {
      return res.status(400).json({ message: 'Thời hạn không hợp lệ (12h, 24h hoặc 48h).' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const inventory = await getOrCreateInventory(user._id, session);

      const itemIdx = inventory.items.findIndex(i => i.itemId === itemId);
      if (itemIdx === -1 || inventory.items[itemIdx].quantity < quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Không đủ vật phẩm trong túi đồ.' });
      }

      // Trừ item từ inventory
      inventory.items[itemIdx].quantity -= quantity;
      if (inventory.items[itemIdx].quantity <= 0) inventory.items.splice(itemIdx, 1);
      await inventory.save({ session });

      // Tạo listing
      const itemData = ITEMS[itemId];
      const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000);
      const listing = await AuctionListing.create([{
        sellerId: user._id,
        sellerName: user.username,
        itemId,
        itemName: itemData.name,
        itemRarity: itemData.rarity || 'Thường',
        itemType: itemData.type || 'MATERIAL',
        quantity,
        startingPrice,
        currentBid: 0,
        buyoutPrice,
        expiresAt,
      }], { session });

      await session.commitTransaction();
      session.endSession();

      res.json({
        message: `Đã đăng bán ${quantity} ${itemData.name} với giá khởi điểm ${startingPrice} Linh Thạch.`,
        listing: listing[0],
      });
    } catch (innerErr) {
      await session.abortTransaction();
      session.endSession();
      if (innerErr.name === 'VersionError') {
        return res.status(409).json({ message: 'Dữ liệu thay đổi, vui lòng thử lại.' });
      }
      throw innerErr;
    }
  } catch (err) {
    console.error('Lỗi listItem:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /auction/bid — Đặt giá thầu ────────────────────────────────────────
export const placeBid = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const { listingId, bidAmount } = req.body;
    if (!listingId || !bidAmount) return res.status(400).json({ message: 'Thiếu thông tin đấu giá.' });
    if (!Number.isInteger(bidAmount) || bidAmount < 1) return res.status(400).json({ message: 'Số tiền đặt thầu không hợp lệ.' });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const listing = await AuctionListing.findById(listingId).session(session);
      if (!listing) { await session.abortTransaction(); session.endSession(); return res.status(404).json({ message: 'Phiên đấu giá không tồn tại.' }); }
      if (listing.status !== 'active') { await session.abortTransaction(); session.endSession(); return res.status(400).json({ message: 'Phiên đấu giá đã kết thúc.' }); }
      if (new Date() >= listing.expiresAt) { await session.abortTransaction(); session.endSession(); return res.status(400).json({ message: 'Phiên đấu giá đã hết hạn.' }); }
      if (listing.sellerId.toString() === user._id.toString()) { await session.abortTransaction(); session.endSession(); return res.status(400).json({ message: 'Không thể tự đấu giá vật phẩm của mình.' }); }

      // Ngăn đặt thầu >= giá mua ngay (phải dùng tính năng Mua Ngay)
      if (listing.buyoutPrice !== null && bidAmount >= listing.buyoutPrice) {
        await session.abortTransaction(); session.endSession();
        return res.status(400).json({ message: `Giá thầu lớn hơn hoặc bằng giá mua ngay (${listing.buyoutPrice}). Vui lòng sử dụng tính năng Mua Ngay.` });
      }

      // Kiểm tra giá thầu tối thiểu
      const currentPrice = listing.currentBid > 0 ? listing.currentBid : listing.startingPrice;
      const minBid = Math.ceil(currentPrice * (1 + MIN_BID_INCREMENT));
      if (bidAmount < minBid) {
        await session.abortTransaction(); session.endSession();
        return res.status(400).json({ message: `Giá thầu tối thiểu là ${minBid} Linh Thạch.` });
      }

      // Kiểm tra Linh Thạch
      const freshUser = await User.findById(user._id).session(session);
      if (freshUser.spiritStones < bidAmount) {
        await session.abortTransaction(); session.endSession();
        return res.status(400).json({ message: `Không đủ Linh Thạch! Cần ${bidAmount} nhưng chỉ có ${freshUser.spiritStones}.` });
      }

      // Hoàn tiền người thầu cũ
      if (listing.bidderId && listing.currentBid > 0) {
        if (listing.bidderId.toString() === user._id.toString()) {
          freshUser.spiritStones += listing.currentBid;
        } else {
          const oldBidder = await User.findById(listing.bidderId).session(session);
          if (oldBidder) {
            oldBidder.spiritStones += listing.currentBid;
            await oldBidder.save({ session });
          }
        }
      }

      // Trừ tiền người thầu mới
      freshUser.spiritStones -= bidAmount;
      await freshUser.save({ session });

      // Cập nhật listing
      listing.currentBid = bidAmount;
      listing.bidderId = user._id;
      listing.bidderName = user.username;
      await listing.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.json({
        message: `Đặt thầu ${bidAmount} Linh Thạch thành công!`,
        spiritStones: freshUser.spiritStones,
        listing,
      });
    } catch (innerErr) {
      await session.abortTransaction();
      session.endSession();
      if (innerErr.name === 'VersionError') return res.status(409).json({ message: 'Dữ liệu thay đổi, vui lòng thử lại.' });
      throw innerErr;
    }
  } catch (err) {
    console.error('Lỗi placeBid:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /auction/buyout — Mua ngay ─────────────────────────────────────────
export const buyout = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) return res.status(403).json({ message: 'Chưa tạo nhân vật' });

    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ message: 'Thiếu listingId.' });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const listing = await AuctionListing.findById(listingId).session(session);
      if (!listing) { await session.abortTransaction(); session.endSession(); return res.status(404).json({ message: 'Phiên đấu giá không tồn tại.' }); }
      if (listing.status !== 'active') { await session.abortTransaction(); session.endSession(); return res.status(400).json({ message: 'Phiên đấu giá đã kết thúc.' }); }
      if (new Date() >= listing.expiresAt) { await session.abortTransaction(); session.endSession(); return res.status(400).json({ message: 'Phiên đấu giá đã hết hạn.' }); }
      if (!listing.buyoutPrice) { await session.abortTransaction(); session.endSession(); return res.status(400).json({ message: 'Phiên này không hỗ trợ mua ngay.' }); }
      if (listing.sellerId.toString() === user._id.toString()) { await session.abortTransaction(); session.endSession(); return res.status(400).json({ message: 'Không thể mua vật phẩm của chính mình.' }); }

      const freshUser = await User.findById(user._id).session(session);
      const activeBidRefund = (listing.bidderId && listing.bidderId.toString() === user._id.toString()) ? listing.currentBid : 0;
      if (freshUser.spiritStones + activeBidRefund < listing.buyoutPrice) {
        await session.abortTransaction(); session.endSession();
        return res.status(400).json({ message: `Không đủ Linh Thạch! Cần ${listing.buyoutPrice} nhưng chỉ có ${freshUser.spiritStones}.` });
      }

      // Hoàn tiền người thầu cũ (nếu có)
      if (listing.bidderId && listing.currentBid > 0) {
        if (listing.bidderId.toString() === user._id.toString()) {
          freshUser.spiritStones += listing.currentBid;
        } else {
          const oldBidder = await User.findById(listing.bidderId).session(session);
          if (oldBidder) {
            oldBidder.spiritStones += listing.currentBid;
            await oldBidder.save({ session });
          }
        }
      }

      // Trừ tiền người mua
      freshUser.spiritStones -= listing.buyoutPrice;
      await freshUser.save({ session });

      // Người bán nhận tiền (trừ phí 5%)
      const fee = Math.ceil(listing.buyoutPrice * AUCTION_FEE_RATE);
      const sellerReceives = listing.buyoutPrice - fee;
      const seller = await User.findById(listing.sellerId).session(session);
      if (seller) {
        seller.spiritStones += sellerReceives;
        await seller.save({ session });
      }

      // Thêm item vào túi người mua
      const inventory = await getOrCreateInventory(user._id, session);
      const existingItem = inventory.items.find(i => i.itemId === listing.itemId);
      if (existingItem) {
        existingItem.quantity += listing.quantity;
      } else {
        if (inventory.items.length >= inventory.maxSlots) {
          await session.abortTransaction(); session.endSession();
          return res.status(400).json({ message: 'Túi đồ đã đầy!' });
        }
        inventory.items.push({ itemId: listing.itemId, quantity: listing.quantity });
      }
      await inventory.save({ session });

      // Đánh dấu listing đã bán
      listing.status = 'sold';
      listing.bidderId = user._id;
      listing.bidderName = user.username;
      listing.currentBid = listing.buyoutPrice;
      listing.sellerClaimed = true;
      listing.buyerClaimed = true;
      await listing.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.json({
        message: `Mua thành công ${listing.quantity} ${listing.itemName} với giá ${listing.buyoutPrice} Linh Thạch!`,
        spiritStones: freshUser.spiritStones,
        listing,
      });
    } catch (innerErr) {
      await session.abortTransaction();
      session.endSession();
      if (innerErr.name === 'VersionError') return res.status(409).json({ message: 'Dữ liệu thay đổi, vui lòng thử lại.' });
      throw innerErr;
    }
  } catch (err) {
    console.error('Lỗi buyout:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /auction/claim — Claim sau khi đấu giá kết thúc ────────────────────
export const claimListing = async (req, res) => {
  try {
    const user = req.user;
    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ message: 'Thiếu listingId.' });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const listing = await AuctionListing.findById(listingId).session(session);
      if (!listing) { await session.abortTransaction(); session.endSession(); return res.status(404).json({ message: 'Phiên đấu giá không tồn tại.' }); }

      // Tự động chuyển trạng thái nếu listing đã hết hạn nhưng chưa được resolve
      if (listing.status === 'active' && new Date() >= listing.expiresAt) {
        listing.status = listing.bidderId ? 'pending_claim' : 'expired';
        await listing.save({ session });
      }

      const isSeller = listing.sellerId.toString() === user._id.toString();
      const isBuyer = listing.bidderId?.toString() === user._id.toString();

      if (!isSeller && !isBuyer) {
        await session.abortTransaction(); session.endSession();
        return res.status(403).json({ message: 'Bạn không liên quan đến phiên đấu giá này.' });
      }

      let message = '';
      const freshUser = await User.findById(user._id).session(session);

      // Người bán claim tiền
      if (isSeller && !listing.sellerClaimed && listing.status === 'pending_claim') {
        const fee = Math.ceil(listing.currentBid * AUCTION_FEE_RATE);
        const sellerReceives = listing.currentBid - fee;
        freshUser.spiritStones += sellerReceives;
        await freshUser.save({ session });
        listing.sellerClaimed = true;
        message = `Nhận được ${sellerReceives} Linh Thạch (đã trừ phí ${fee}).`;
      }

      // Người mua claim hàng
      if (isBuyer && !listing.buyerClaimed && listing.status === 'pending_claim') {
        const inventory = await getOrCreateInventory(user._id, session);
        const existingItem = inventory.items.find(i => i.itemId === listing.itemId);
        if (existingItem) {
          existingItem.quantity += listing.quantity;
        } else {
          if (inventory.items.length >= inventory.maxSlots) {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ message: 'Túi đồ đã đầy!' });
          }
          inventory.items.push({ itemId: listing.itemId, quantity: listing.quantity });
        }
        await inventory.save({ session });
        listing.buyerClaimed = true;
        message = `Nhận được ${listing.quantity} ${listing.itemName} vào túi đồ!`;
      }

      // Người bán claim lại hàng khi listing expired
      if (isSeller && !listing.sellerClaimed && listing.status === 'expired') {
        const inventory = await getOrCreateInventory(user._id, session);
        const existingItem = inventory.items.find(i => i.itemId === listing.itemId);
        if (existingItem) {
          existingItem.quantity += listing.quantity;
        } else {
          if (inventory.items.length >= inventory.maxSlots) {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ message: 'Túi đồ đã đầy!' });
          }
          inventory.items.push({ itemId: listing.itemId, quantity: listing.quantity });
        }
        await inventory.save({ session });
        listing.sellerClaimed = true;
        message = `Không ai mua. Đã thu hồi ${listing.quantity} ${listing.itemName}.`;
      }

      // Cập nhật status nếu cả hai đã claim
      if (listing.sellerClaimed && listing.buyerClaimed) {
        listing.status = 'sold';
      }
      if (listing.sellerClaimed && listing.status === 'expired') {
        listing.status = 'cancelled';
      }

      await listing.save({ session });
      await session.commitTransaction();
      session.endSession();

      res.json({ message: message || 'Không có gì để claim.', spiritStones: freshUser.spiritStones, listing });
    } catch (innerErr) {
      await session.abortTransaction();
      session.endSession();
      if (innerErr.name === 'VersionError') return res.status(409).json({ message: 'Dữ liệu thay đổi, vui lòng thử lại.' });
      throw innerErr;
    }
  } catch (err) {
    console.error('Lỗi claimListing:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── DELETE /auction/:id — Huỷ đăng bán ─────────────────────────────────────
export const cancelListing = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const listing = await AuctionListing.findById(id).session(session);
      if (!listing) { await session.abortTransaction(); session.endSession(); return res.status(404).json({ message: 'Phiên đấu giá không tồn tại.' }); }
      if (listing.sellerId.toString() !== user._id.toString()) { await session.abortTransaction(); session.endSession(); return res.status(403).json({ message: 'Chỉ người bán mới có thể huỷ.' }); }
      if (listing.status !== 'active') { await session.abortTransaction(); session.endSession(); return res.status(400).json({ message: 'Phiên đấu giá đã kết thúc, không thể huỷ.' }); }
      if (listing.bidderId) { await session.abortTransaction(); session.endSession(); return res.status(400).json({ message: 'Đã có người đặt thầu, không thể huỷ.' }); }

      // Trả lại hàng cho người bán
      const inventory = await getOrCreateInventory(user._id, session);
      const existingItem = inventory.items.find(i => i.itemId === listing.itemId);
      if (existingItem) {
        existingItem.quantity += listing.quantity;
      } else {
        if (inventory.items.length >= inventory.maxSlots) {
          await session.abortTransaction(); session.endSession();
          return res.status(400).json({ message: 'Túi đồ đã đầy!' });
        }
        inventory.items.push({ itemId: listing.itemId, quantity: listing.quantity });
      }
      await inventory.save({ session });

      listing.status = 'cancelled';
      await listing.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.json({
        message: `Đã huỷ đấu giá và thu hồi ${listing.quantity} ${listing.itemName}.`,
        listing,
      });
    } catch (innerErr) {
      await session.abortTransaction();
      session.endSession();
      throw innerErr;
    }
  } catch (err) {
    console.error('Lỗi cancelListing:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
