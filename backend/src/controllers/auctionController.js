import User from '../models/User.js';
import Inventory from '../models/Inventory.js';
import AuctionListing from '../models/AuctionListing.js';
import { ITEMS } from '../data/items.js';

const AUCTION_FEE_RATE = 0.05;
const MIN_BID_INCREMENT = 0.05;
const VALID_DURATIONS_H = [12, 24, 48];

const getOrCreateInventory = async (userId) => {
  return await Inventory.findOneAndUpdate(
    { userId },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const resolveExpiredListings = async () => {
  const now = new Date();
  // active + hết hạn + có bid → pending_claim
  await AuctionListing.updateMany(
    { status: 'active', expiresAt: { $lte: now }, bidderId: { $ne: null } },
    { $set: { status: 'pending_claim' } }
  );
  // active + hết hạn + không có bid → expired
  await AuctionListing.updateMany(
    { status: 'active', expiresAt: { $lte: now }, bidderId: null },
    { $set: { status: 'expired' } }
  );
};

// ─── GET /auction ─────────────────────────────────────────────────────────────
export const getListings = async (req, res) => {
  try {
    const { itemType, rarity, name, sort = 'newest', page = 1, limit = 20 } = req.query;
    const now = new Date();
    const filter = { status: 'active', expiresAt: { $gt: now } };
    if (itemType) filter.itemType = itemType;
    if (rarity) filter.itemRarity = rarity;
    if (name && name.trim()) filter.itemName = { $regex: name.trim() };

    let sortOption = {};
    if (sort === 'price_asc')   sortOption = { currentBid: 1 };
    else if (sort === 'price_desc') sortOption = { currentBid: -1 };
    else if (sort === 'ending_soon') sortOption = { expiresAt: 1 };
    else sortOption = { createdAt: -1 };

    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [listings, total] = await Promise.all([
      AuctionListing.find(filter, { sort: sortOption, skip, limit: limitNum }),
      AuctionListing.countDocuments(filter),
    ]);

    res.json({ listings, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error('Lỗi getListings:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── GET /auction/my ──────────────────────────────────────────────────────────
export const getMyListings = async (req, res) => {
  try {
    await resolveExpiredListings();
    const userId = req.user.id;

    const [selling, bidding] = await Promise.all([
      AuctionListing.find({ sellerId: userId }, { sort: { createdAt: -1 } }),
      AuctionListing.find({
        bidderId: userId,
        status: { $in: ['active', 'pending_claim'] },
        sellerId: { $ne: userId },
      }, { sort: { expiresAt: 1 } }),
    ]);

    res.json({ selling, bidding });
  } catch (err) {
    console.error('Lỗi getMyListings:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /auction/list ───────────────────────────────────────────────────────
export const listItem = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const { itemId, quantity = 1, startingPrice, buyoutPrice = null, durationHours = 24 } = req.body;

    if (!itemId || !ITEMS[itemId]) return res.status(400).json({ message: 'Vật phẩm không hợp lệ.' });
    if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: 'Số lượng không hợp lệ.' });
    if (!Number.isInteger(startingPrice) || startingPrice < 1) return res.status(400).json({ message: 'Giá khởi điểm phải ≥ 1 Linh Thạch.' });
    if (buyoutPrice !== null && (!Number.isInteger(buyoutPrice) || buyoutPrice <= startingPrice)) {
      return res.status(400).json({ message: 'Giá mua ngay phải lớn hơn giá khởi điểm.' });
    }
    if (!VALID_DURATIONS_H.includes(durationHours)) {
      return res.status(400).json({ message: 'Thời hạn không hợp lệ (12h, 24h hoặc 48h).' });
    }

    const inventory = await getOrCreateInventory(user.id);
    const itemIdx = inventory.items.findIndex(i => i.itemId === itemId);
    if (itemIdx === -1 || inventory.items[itemIdx].quantity < quantity) {
      return res.status(400).json({ message: 'Không đủ vật phẩm trong túi đồ.' });
    }

    inventory.items[itemIdx].quantity -= quantity;
    if (inventory.items[itemIdx].quantity <= 0) inventory.items.splice(itemIdx, 1);
    await Inventory.save(inventory);

    const itemData = ITEMS[itemId];
    const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000);
    const listing = await AuctionListing.create({
      sellerId:      user.id,
      sellerName:    user.username,
      itemId,
      itemName:      itemData.name,
      itemRarity:    itemData.rarity || 'Thường',
      itemType:      itemData.type || 'MATERIAL',
      quantity,
      startingPrice,
      currentBid:    0,
      buyoutPrice,
      expiresAt,
    });

    res.json({
      message: `Đã đăng bán ${quantity} ${itemData.name} với giá khởi điểm ${startingPrice} Linh Thạch.`,
      listing,
    });
  } catch (err) {
    console.error('Lỗi listItem:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /auction/bid ────────────────────────────────────────────────────────
export const placeBid = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const { listingId, bidAmount } = req.body;
    if (!listingId || !bidAmount) return res.status(400).json({ message: 'Thiếu thông tin đấu giá.' });
    if (!Number.isInteger(bidAmount) || bidAmount < 1) return res.status(400).json({ message: 'Số tiền đặt thầu không hợp lệ.' });

    const listing = await AuctionListing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Phiên đấu giá không tồn tại.' });
    if (listing.status !== 'active') return res.status(400).json({ message: 'Phiên đấu giá đã kết thúc.' });
    if (new Date() >= new Date(listing.expiresAt)) return res.status(400).json({ message: 'Phiên đấu giá đã hết hạn.' });
    if (listing.sellerId === user.id) return res.status(400).json({ message: 'Không thể tự đấu giá vật phẩm của mình.' });

    if (listing.buyoutPrice !== null && bidAmount >= listing.buyoutPrice) {
      return res.status(400).json({ message: `Giá thầu lớn hơn hoặc bằng giá mua ngay (${listing.buyoutPrice}). Vui lòng sử dụng tính năng Mua Ngay.` });
    }

    const currentPrice = listing.currentBid > 0 ? listing.currentBid : listing.startingPrice;
    const minBid = Math.ceil(currentPrice * (1 + MIN_BID_INCREMENT));
    if (bidAmount < minBid) {
      return res.status(400).json({ message: `Giá thầu tối thiểu là ${minBid} Linh Thạch.` });
    }

    const freshUser = await User.findById(user.id);
    if (!freshUser) return res.status(404).json({ message: 'Người dùng không tồn tại.' });

    const activeBidRefund = (listing.bidderId && listing.bidderId === user.id) ? listing.currentBid : 0;
    if ((freshUser.spiritStones || 0) + activeBidRefund < bidAmount) {
      return res.status(400).json({ message: `Không đủ Linh Thạch! Cần ${bidAmount} nhưng chỉ có ${(freshUser.spiritStones || 0) + activeBidRefund}.` });
    }

    // Hoàn tiền người thầu cũ
    if (listing.bidderId && listing.currentBid > 0) {
      if (listing.bidderId === user.id) {
        freshUser.spiritStones = (freshUser.spiritStones || 0) + listing.currentBid;
      } else {
        const oldBidder = await User.findById(listing.bidderId);
        if (oldBidder) {
          oldBidder.spiritStones = (oldBidder.spiritStones || 0) + listing.currentBid;
          await User.save(oldBidder);
        }
      }
    }

    freshUser.spiritStones = (freshUser.spiritStones || 0) - bidAmount;
    await User.save(freshUser);

    listing.currentBid  = bidAmount;
    listing.bidderId    = user.id;
    listing.bidderName  = user.username;
    await listing.save();

    res.json({
      message: `Đặt thầu ${bidAmount} Linh Thạch thành công!`,
      spiritStones: freshUser.spiritStones,
      listing,
    });
  } catch (err) {
    console.error('Lỗi placeBid:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /auction/buyout ─────────────────────────────────────────────────────
export const buyout = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) return res.status(403).json({ message: 'Chưa tạo nhân vật' });

    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ message: 'Thiếu listingId.' });

    const listing = await AuctionListing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Phiên đấu giá không tồn tại.' });
    if (listing.status !== 'active') return res.status(400).json({ message: 'Phiên đấu giá đã kết thúc.' });
    if (new Date() >= new Date(listing.expiresAt)) return res.status(400).json({ message: 'Phiên đấu giá đã hết hạn.' });
    if (!listing.buyoutPrice) return res.status(400).json({ message: 'Phiên này không hỗ trợ mua ngay.' });
    if (listing.sellerId === user.id) return res.status(400).json({ message: 'Không thể mua vật phẩm của chính mình.' });

    const freshUser = await User.findById(user.id);
    if (!freshUser) return res.status(404).json({ message: 'Người dùng không tồn tại.' });

    const activeBidRefund = (listing.bidderId && listing.bidderId === user.id) ? listing.currentBid : 0;
    if ((freshUser.spiritStones || 0) + activeBidRefund < listing.buyoutPrice) {
      return res.status(400).json({ message: `Không đủ Linh Thạch! Cần ${listing.buyoutPrice} nhưng chỉ có ${freshUser.spiritStones}.` });
    }

    // Hoàn tiền người thầu cũ
    if (listing.bidderId && listing.currentBid > 0) {
      if (listing.bidderId === user.id) {
        freshUser.spiritStones = (freshUser.spiritStones || 0) + listing.currentBid;
      } else {
        const oldBidder = await User.findById(listing.bidderId);
        if (oldBidder) {
          oldBidder.spiritStones = (oldBidder.spiritStones || 0) + listing.currentBid;
          await User.save(oldBidder);
        }
      }
    }

    freshUser.spiritStones = (freshUser.spiritStones || 0) - listing.buyoutPrice;
    await User.save(freshUser);

    // Người bán nhận tiền
    const fee = Math.ceil(listing.buyoutPrice * AUCTION_FEE_RATE);
    const sellerReceives = listing.buyoutPrice - fee;
    const seller = await User.findById(listing.sellerId);
    if (seller) {
      seller.spiritStones = (seller.spiritStones || 0) + sellerReceives;
      await User.save(seller);
    }

    // Thêm vào túi người mua
    const inventory = await getOrCreateInventory(user.id);
    const existingItem = inventory.items.find(i => i.itemId === listing.itemId);
    if (existingItem) {
      existingItem.quantity += listing.quantity;
    } else {
      if (inventory.items.length >= inventory.maxSlots) {
        return res.status(400).json({ message: 'Túi đồ đã đầy!' });
      }
      inventory.items.push({ itemId: listing.itemId, quantity: listing.quantity });
    }
    await Inventory.save(inventory);

    listing.status       = 'sold';
    listing.bidderId     = user.id;
    listing.bidderName   = user.username;
    listing.currentBid   = listing.buyoutPrice;
    listing.sellerClaimed = true;
    listing.buyerClaimed  = true;
    await listing.save();

    res.json({
      message: `Mua thành công ${listing.quantity} ${listing.itemName} với giá ${listing.buyoutPrice} Linh Thạch!`,
      spiritStones: freshUser.spiritStones,
      listing,
    });
  } catch (err) {
    console.error('Lỗi buyout:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /auction/claim ──────────────────────────────────────────────────────
export const claimListing = async (req, res) => {
  try {
    const user = req.user;
    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ message: 'Thiếu listingId.' });

    const listing = await AuctionListing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Phiên đấu giá không tồn tại.' });

    if (listing.status === 'active' && new Date() >= new Date(listing.expiresAt)) {
      listing.status = listing.bidderId ? 'pending_claim' : 'expired';
      await listing.save();
    }

    const isSeller = listing.sellerId === user.id;
    const isBuyer  = listing.bidderId === user.id;

    if (!isSeller && !isBuyer) {
      return res.status(403).json({ message: 'Bạn không liên quan đến phiên đấu giá này.' });
    }

    let message = '';
    const freshUser = await User.findById(user.id);
    if (!freshUser) return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    freshUser.spiritStones = freshUser.spiritStones || 0;

    if (isSeller && !listing.sellerClaimed && listing.status === 'pending_claim') {
      const fee = Math.ceil(listing.currentBid * AUCTION_FEE_RATE);
      const sellerReceives = listing.currentBid - fee;
      freshUser.spiritStones += sellerReceives;
      await User.save(freshUser);
      listing.sellerClaimed = true;
      message = `Nhận được ${sellerReceives} Linh Thạch (đã trừ phí ${fee}).`;
    }

    if (isBuyer && !listing.buyerClaimed && listing.status === 'pending_claim') {
      const inventory = await getOrCreateInventory(user.id);
      const existingItem = inventory.items.find(i => i.itemId === listing.itemId);
      if (existingItem) {
        existingItem.quantity += listing.quantity;
      } else {
        if (inventory.items.length >= inventory.maxSlots) {
          return res.status(400).json({ message: 'Túi đồ đã đầy!' });
        }
        inventory.items.push({ itemId: listing.itemId, quantity: listing.quantity });
      }
      await Inventory.save(inventory);
      listing.buyerClaimed = true;
      message = `Nhận được ${listing.quantity} ${listing.itemName} vào túi đồ!`;
    }

    if (isSeller && !listing.sellerClaimed && listing.status === 'expired') {
      const inventory = await getOrCreateInventory(user.id);
      const existingItem = inventory.items.find(i => i.itemId === listing.itemId);
      if (existingItem) {
        existingItem.quantity += listing.quantity;
      } else {
        if (inventory.items.length >= inventory.maxSlots) {
          return res.status(400).json({ message: 'Túi đồ đã đầy!' });
        }
        inventory.items.push({ itemId: listing.itemId, quantity: listing.quantity });
      }
      await Inventory.save(inventory);
      listing.sellerClaimed = true;
      message = `Không ai mua. Đã thu hồi ${listing.quantity} ${listing.itemName}.`;
    }

    if (listing.sellerClaimed && listing.buyerClaimed) listing.status = 'sold';
    if (listing.sellerClaimed && listing.status === 'expired') listing.status = 'cancelled';

    await listing.save();
    res.json({ message: message || 'Không có gì để claim.', spiritStones: freshUser.spiritStones, listing });
  } catch (err) {
    console.error('Lỗi claimListing:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── DELETE /auction/:id ──────────────────────────────────────────────────────
export const cancelListing = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const listing = await AuctionListing.findById(id);
    if (!listing) return res.status(404).json({ message: 'Phiên đấu giá không tồn tại.' });
    if (listing.sellerId !== user.id) return res.status(403).json({ message: 'Chỉ người bán mới có thể huỷ.' });
    if (listing.status !== 'active') return res.status(400).json({ message: 'Phiên đấu giá đã kết thúc, không thể huỷ.' });
    if (listing.bidderId) return res.status(400).json({ message: 'Đã có người đặt thầu, không thể huỷ.' });

    const inventory = await getOrCreateInventory(user.id);
    const existingItem = inventory.items.find(i => i.itemId === listing.itemId);
    if (existingItem) {
      existingItem.quantity += listing.quantity;
    } else {
      if (inventory.items.length >= inventory.maxSlots) {
        return res.status(400).json({ message: 'Túi đồ đã đầy!' });
      }
      inventory.items.push({ itemId: listing.itemId, quantity: listing.quantity });
    }
    await Inventory.save(inventory);

    listing.status = 'cancelled';
    await listing.save();

    res.json({
      message: `Đã huỷ đấu giá và thu hồi ${listing.quantity} ${listing.itemName}.`,
      listing,
    });
  } catch (err) {
    console.error('Lỗi cancelListing:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
