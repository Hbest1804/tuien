import supabase from '../config/supabase.js';

// ─── Helper: map DB row → JS object ──────────────────────────────────────────
export const mapAuction = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    itemId: row.item_id,
    itemName: row.item_name,
    itemRarity: row.item_rarity,
    itemType: row.item_type,
    quantity: row.quantity,
    startingPrice: row.starting_price,
    currentBid: row.current_bid,
    buyoutPrice: row.buyout_price,
    bidderId: row.bidder_id,
    bidderName: row.bidder_name,
    status: row.status,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    sellerClaimed: row.seller_claimed,
    buyerClaimed: row.buyer_claimed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const attachSave = (auction) => {
  if (!auction) return null;
  auction.save = async function () {
    const { error } = await supabase
      .from('auction_listings')
      .update({
        seller_id:      this.sellerId,
        seller_name:    this.sellerName,
        current_bid:    this.currentBid,
        bidder_id:      this.bidderId,
        bidder_name:    this.bidderName,
        status:         this.status,
        seller_claimed: this.sellerClaimed,
        buyer_claimed:  this.buyerClaimed,
      })
      .eq('id', this.id || this._id);
    if (error) throw error;
    return this;
  };
  return auction;
};

export const AuctionListing = {
  async findById(id) {
    const { data, error } = await supabase
      .from('auction_listings').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return attachSave(mapAuction(data));
  },

  async find(filter = {}, opts = {}) {
    let query = supabase.from('auction_listings').select('*');
    if (filter.status) {
      if (filter.status.$in) {
        query = query.in('status', filter.status.$in);
      } else {
        query = query.eq('status', filter.status);
      }
    }
    if (filter.sellerId) {
      if (filter.sellerId.$ne) {
        query = query.neq('seller_id', filter.sellerId.$ne);
      } else {
        query = query.eq('seller_id', filter.sellerId);
      }
    }
    if (filter.bidderId) {
      if (filter.bidderId.$ne === null) {
        query = query.not('bidder_id', 'is', null);
      } else {
        query = query.eq('bidder_id', filter.bidderId);
      }
    }
    if (filter.expiresAt?.$gt) query = query.gt('expires_at', filter.expiresAt.$gt.toISOString());
    if (filter.expiresAt?.$lte) query = query.lte('expires_at', filter.expiresAt.$lte.toISOString());

    if (filter.itemType) query = query.eq('item_type', filter.itemType);
    if (filter.itemRarity) query = query.eq('item_rarity', filter.itemRarity);
    if (filter.itemName?.$regex) {
      query = query.ilike('item_name', `%${filter.itemName.$regex}%`);
    }

    // Sorting
    if (opts.sort) {
      const [field, dir] = Object.entries(opts.sort)[0];
      const col = field === 'currentBid' ? 'current_bid'
                : field === 'startingPrice' ? 'starting_price'
                : field === 'expiresAt' ? 'expires_at'
                : field === 'createdAt' ? 'created_at'
                : field;
      query = query.order(col, { ascending: dir === 1 });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (opts.skip) query = query.range(opts.skip, opts.skip + (opts.limit || 20) - 1);
    else if (opts.limit) query = query.limit(opts.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(row => attachSave(mapAuction(row)));
  },

  async countDocuments(filter = {}) {
    let query = supabase.from('auction_listings').select('id', { count: 'exact', head: true });
    if (filter.status) {
      if (filter.status.$in) {
        query = query.in('status', filter.status.$in);
      } else {
        query = query.eq('status', filter.status);
      }
    }
    if (filter.sellerId) {
      if (filter.sellerId.$ne) {
        query = query.neq('seller_id', filter.sellerId.$ne);
      } else {
        query = query.eq('seller_id', filter.sellerId);
      }
    }
    if (filter.bidderId) {
      if (filter.bidderId.$ne === null) {
        query = query.not('bidder_id', 'is', null);
      } else {
        query = query.eq('bidder_id', filter.bidderId);
      }
    }
    if (filter.expiresAt?.$gt) query = query.gt('expires_at', filter.expiresAt.$gt.toISOString());
    if (filter.expiresAt?.$lte) query = query.lte('expires_at', filter.expiresAt.$lte.toISOString());

    if (filter.itemType) query = query.eq('item_type', filter.itemType);
    if (filter.itemRarity) query = query.eq('item_rarity', filter.itemRarity);
    if (filter.itemName?.$regex) {
      query = query.ilike('item_name', `%${filter.itemName.$regex}%`);
    }
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },

  async create(dataArr) {
    const d = Array.isArray(dataArr) ? dataArr[0] : dataArr;
    const { data, error } = await supabase
      .from('auction_listings')
      .insert({
        seller_id:      d.sellerId,
        seller_name:    d.sellerName,
        item_id:        d.itemId,
        item_name:      d.itemName,
        item_rarity:    d.itemRarity,
        item_type:      d.itemType,
        quantity:       d.quantity,
        starting_price: d.startingPrice,
        current_bid:    d.currentBid || 0,
        buyout_price:   d.buyoutPrice,
        expires_at:     d.expiresAt,
        status:         d.status || 'active',
      })
      .select('*')
      .single();
    if (error) throw error;
    return attachSave(mapAuction(data));
  },

  async updateMany(filter, update) {
    const dbUpdates = {};
    if (update.$set?.status) dbUpdates.status = update.$set.status;

    let query = supabase.from('auction_listings').update(dbUpdates);
    if (filter.status) query = query.eq('status', filter.status);
    if (filter.expiresAt?.$lte) query = query.lte('expires_at', filter.expiresAt.$lte.toISOString());
    if (filter.bidderId === null) query = query.is('bidder_id', null);
    if (filter.bidderId?.$ne === null) query = query.not('bidder_id', 'is', null);

    const { error } = await query;
    if (error) throw error;
  },
};

export default AuctionListing;
