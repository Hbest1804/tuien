import User from '../models/User.js';
import Inventory from '../models/Inventory.js';
import AuctionListing from '../models/AuctionListing.js';
import { ITEMS } from '../data/items.js';
import supabase from '../config/supabase.js';

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

    const itemData = ITEMS[itemId];

    const { data, error } = await supabase.rpc('list_auction_item', {
      p_user_id: user.id,
      p_user_name: user.username,
      p_item_id: itemId,
      p_item_name: itemData.name,
      p_item_rarity: itemData.rarity || 'Thường',
      p_item_type: itemData.type || 'MATERIAL',
      p_quantity: quantity,
      p_starting_price: startingPrice,
      p_buyout_price: buyoutPrice,
      p_duration_hours: durationHours
    });

    if (error) {
      console.error('Lỗi RPC list_auction_item:', error);
      return res.status(500).json({ message: 'Lỗi server khi đăng bán.' });
    }

    if (!data.success) {
      return res.status(data.status || 400).json({ message: data.message });
    }

    res.json({
      message: data.message,
      listing: data.listing,
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

    const { data, error } = await supabase.rpc('place_auction_bid', {
      p_user_id: user.id,
      p_user_name: user.username,
      p_listing_id: listingId,
      p_bid_amount: bidAmount
    });

    if (error) {
      console.error('Lỗi RPC place_auction_bid:', error);
      return res.status(500).json({ message: 'Lỗi server khi đặt thầu.' });
    }

    if (!data.success) {
      return res.status(data.status || 400).json({ message: data.message });
    }

    res.json({
      message: data.message,
      spiritStones: data.spiritStones,
      listing: data.listing,
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

    const { data, error } = await supabase.rpc('auction_buyout', {
      p_user_id: user.id,
      p_user_name: user.username,
      p_listing_id: listingId
    });

    if (error) {
      console.error('Lỗi RPC auction_buyout:', error);
      return res.status(500).json({ message: 'Lỗi server khi mua ngay.' });
    }

    if (!data.success) {
      return res.status(data.status || 400).json({ message: data.message });
    }

    res.json({
      message: data.message,
      spiritStones: data.spiritStones,
      listing: data.listing,
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

    const { data, error } = await supabase.rpc('claim_auction_listing', {
      p_user_id: user.id,
      p_listing_id: listingId
    });

    if (error) {
      console.error('Lỗi RPC claim_auction_listing:', error);
      return res.status(500).json({ message: 'Lỗi server khi claim.' });
    }

    if (!data.success) {
      return res.status(data.status || 400).json({ message: data.message });
    }

    res.json({ 
      message: data.message, 
      spiritStones: data.spiritStones, 
      listing: data.listing 
    });
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

    const { data, error } = await supabase.rpc('cancel_auction_listing', {
      p_user_id: user.id,
      p_listing_id: id
    });

    if (error) {
      console.error('Lỗi RPC cancel_auction_listing:', error);
      return res.status(500).json({ message: 'Lỗi server khi huỷ đấu giá.' });
    }

    if (!data.success) {
      return res.status(data.status || 400).json({ message: data.message });
    }

    res.json({
      message: data.message,
      listing: data.listing,
    });
  } catch (err) {
    console.error('Lỗi cancelListing:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
