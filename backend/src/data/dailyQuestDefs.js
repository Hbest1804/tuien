// ─── Định nghĩa Nhiệm Vụ Hàng Ngày ──────────────────────────────────────────
// trigger: event name gửi từ controller khi action xảy ra
// reward: { spiritStones?, expBonus?, itemId?, itemQty? }

export const DAILY_QUEST_DEFS = [
  {
    id: 'dq_login',
    name: 'Ngày Mới Bắt Đầu',
    desc: 'Đăng nhập vào game hôm nay.',
    icon: '🌅',
    trigger: 'login',
    targetCount: 1,
    reward: { spiritStones: 100 },
  },
  {
    id: 'dq_cultivate',
    name: 'Chuyên Tâm Tu Đạo',
    desc: 'Tu luyện ít nhất 30 phút trong ngày.',
    icon: '⚡',
    trigger: 'cultivate_minutes',
    targetCount: 30,   // tính bằng phút
    reward: { spiritStones: 200 },
  },
  {
    id: 'dq_buy_item',
    name: 'Thương Hội Giao Dịch',
    desc: 'Mua 1 vật phẩm tại Thương Hội.',
    icon: '🛒',
    trigger: 'shop_buy',
    targetCount: 1,
    reward: { spiritStones: 150 },
  },
  {
    id: 'dq_sell_item',
    name: 'Thanh Lý Hàng Hóa',
    desc: 'Bán 1 vật phẩm (shop hoặc đấu giá).',
    icon: '📦',
    trigger: 'sell_item',
    targetCount: 1,
    reward: { spiritStones: 150 },
  },
  {
    id: 'dq_auction_bid',
    name: 'Tham Chiến Đấu Trường',
    desc: 'Đặt thầu 1 phiên đấu giá.',
    icon: '🏮',
    trigger: 'auction_bid',
    targetCount: 1,
    reward: { spiritStones: 200 },
  },
  {
    id: 'dq_dungeon',
    name: 'Thám Hiểm Bí Cảnh',
    desc: 'Hoàn thành 1 lần thám hiểm bí cảnh.',
    icon: '🗺️',
    trigger: 'dungeon_complete',
    targetCount: 1,
    reward: { spiritStones: 300 },
  },
  {
    id: 'dq_breakthrough_attempt',
    name: 'Thử Thách Cảnh Giới',
    desc: 'Thực hiện 1 lần đột phá (thành công hoặc thất bại đều tính).',
    icon: '🌟',
    trigger: 'breakthrough_attempt',
    targetCount: 1,
    reward: { spiritStones: 250 },
  },
  {
    id: 'dq_combat',
    name: 'Trảm Yêu Diệt Ma',
    desc: 'Tham chiến 1 trận với yêu thú.',
    icon: '⚔️',
    trigger: 'combat_fight',
    targetCount: 1,
    reward: { spiritStones: 200 },
  },
];

// Mỗi ngày, user nhận ngẫu nhiên 5 trong 8 nhiệm vụ
export const DAILY_QUEST_COUNT = 5;
