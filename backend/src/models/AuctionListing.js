import mongoose from 'mongoose';

const auctionListingSchema = new mongoose.Schema(
  {
    // ─── Người bán ─────────────────────────────────────────────────────────────
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sellerName: {
      type: String,
      required: true,
    },

    // ─── Vật phẩm ─────────────────────────────────────────────────────────────
    itemId: {
      type: String,
      required: true,
    },
    itemName: {
      type: String,
      required: true,
    },
    itemRarity: {
      type: String,
      default: 'Thường',
    },
    itemType: {
      type: String,
      default: 'MATERIAL',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // ─── Giá cả ───────────────────────────────────────────────────────────────
    startingPrice: {
      type: Number,
      required: true,
      min: 1,
    },
    currentBid: {
      type: Number,
      default: 0,
    },
    // Giá mua ngay (null = không có buyout)
    buyoutPrice: {
      type: Number,
      default: null,
    },

    // ─── Người thầu cao nhất ─────────────────────────────────────────────────
    bidderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    bidderName: {
      type: String,
      default: null,
    },

    // ─── Trạng thái ──────────────────────────────────────────────────────────
    // active = đang đấu giá
    // sold   = đã bán (buyout hoặc bid kết thúc)
    // expired = hết giờ, chưa có bid
    // cancelled = người bán huỷ (chỉ khi chưa có bid)
    // pending_claim = hết giờ, có bid, chờ claim
    status: {
      type: String,
      enum: ['active', 'sold', 'expired', 'cancelled', 'pending_claim'],
      default: 'active',
      index: true,
    },

    // Thời hạn đấu giá
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    // Người bán đã claim tiền chưa
    sellerClaimed: {
      type: Boolean,
      default: false,
    },
    // Người mua đã claim hàng chưa
    buyerClaimed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

// Index composite để query nhanh
auctionListingSchema.index({ status: 1, expiresAt: 1 });
auctionListingSchema.index({ sellerId: 1, status: 1 });

const AuctionListing = mongoose.model('AuctionListing', auctionListingSchema);

export default AuctionListing;
