// ─── Định nghĩa Thành Tựu ────────────────────────────────────────────────────
export const ACHIEVEMENTS = {
  // ── Tu Luyện ──────────────────────────────────────────────────────────────
  'ach_first_cultivation': {
    id: 'ach_first_cultivation',
    name: 'Sơ Nhập Đạo Môn',
    desc: 'Tu luyện lần đầu tiên.',
    icon: '⚡',
    trigger: 'cultivation_start',
    titleReward: null,
  },
  'ach_first_breakthrough': {
    id: 'ach_first_breakthrough',
    name: 'Vạn Lý Hành Trình',
    desc: 'Đột phá cảnh giới lần đầu tiên.',
    icon: '🌟',
    trigger: 'breakthrough_success',
    titleReward: 'Tân Tú',
  },
  'ach_reach_truc_co': {
    id: 'ach_reach_truc_co',
    name: 'Trúc Cơ Đăng Thiên',
    desc: 'Đạt cảnh giới Trúc Cơ.',
    icon: '🏔️',
    trigger: 'realm_1',
    titleReward: 'Tu Sĩ',
  },
  'ach_reach_kim_dan': {
    id: 'ach_reach_kim_dan',
    name: 'Kim Đan Ngưng Tụ',
    desc: 'Đạt cảnh giới Kim Đan.',
    icon: '💛',
    trigger: 'realm_2',
    titleReward: 'Đạo Nhân',
  },
  'ach_reach_nguyen_anh': {
    id: 'ach_reach_nguyen_anh',
    name: 'Nguyên Anh Phi Thăng',
    desc: 'Đạt cảnh giới Nguyên Anh.',
    icon: '🟣',
    trigger: 'realm_3',
    titleReward: 'Chân Nhân',
  },
  'ach_reach_hoa_than': {
    id: 'ach_reach_hoa_than',
    name: 'Hóa Thần Bất Diệt',
    desc: 'Đạt cảnh giới Hóa Thần — Thiên Địa Vĩnh Hằng!',
    icon: '🔴',
    trigger: 'realm_4',
    titleReward: 'Thần Nhân',
  },
  'ach_survive_tribulation': {
    id: 'ach_survive_tribulation',
    name: 'Độ Kiếp Thành Công',
    desc: 'Vượt qua Lôi Kiếp trong đột phá.',
    icon: '⚡',
    trigger: 'tribulation_survived',
    titleReward: null,
  },

  // ── Kinh Tế ───────────────────────────────────────────────────────────────
  'ach_first_purchase': {
    id: 'ach_first_purchase',
    name: 'Sơ Nhập Thương Trường',
    desc: 'Mua đồ tại Thương Hội lần đầu tiên.',
    icon: '🛒',
    trigger: 'shop_buy',
    titleReward: null,
  },
  'ach_millionaire': {
    id: 'ach_millionaire',
    name: 'Linh Thạch Vạn Thạch',
    desc: 'Sở hữu 10,000 Linh Thạch cùng lúc.',
    icon: '💎',
    trigger: 'stones_10000',
    titleReward: 'Phú Ông',
  },
  'ach_big_spender': {
    id: 'ach_big_spender',
    name: 'Đại Gia Linh Thạch',
    desc: 'Sở hữu 100,000 Linh Thạch cùng lúc.',
    icon: '💍',
    trigger: 'stones_100000',
    titleReward: 'Thương Thánh',
  },

  // ── Đấu Giá ───────────────────────────────────────────────────────────────
  'ach_first_bid': {
    id: 'ach_first_bid',
    name: 'Sơ Nhập Đấu Trường',
    desc: 'Đặt thầu tại Đấu Giá Hội lần đầu.',
    icon: '🏮',
    trigger: 'auction_bid',
    titleReward: null,
  },
  'ach_auction_winner': {
    id: 'ach_auction_winner',
    name: 'Đại Thắng Đấu Giá',
    desc: 'Thắng phiên đấu giá lần đầu tiên.',
    icon: '🏆',
    trigger: 'auction_win',
    titleReward: null,
  },
  'ach_first_sell': {
    id: 'ach_first_sell',
    name: 'Hành Thương Trên Đỉnh',
    desc: 'Đăng bán vật phẩm tại Đấu Giá Hội lần đầu.',
    icon: '📦',
    trigger: 'auction_list',
    titleReward: null,
  },

  // ── Tông Môn ──────────────────────────────────────────────────────────────
  'ach_join_sect': {
    id: 'ach_join_sect',
    name: 'Gia Nhập Tông Môn',
    desc: 'Lần đầu gia nhập một tông môn.',
    icon: '🏯',
    trigger: 'join_sect',
    titleReward: 'Đệ Tử',
  },
  'ach_sect_elder': {
    id: 'ach_sect_elder',
    name: 'Trưởng Lão Đức Vọng',
    desc: 'Đạt chức vụ Trưởng Lão trong tông môn.',
    icon: '🎖️',
    trigger: 'sect_rank_elder',
    titleReward: 'Trưởng Lão',
  },

  // ── Luyện Đan ─────────────────────────────────────────────────────────────
  'ach_first_craft': {
    id: 'ach_first_craft',
    name: 'Luyện Đan Sơ Nhập',
    desc: 'Luyện chế thành công đan dược lần đầu.',
    icon: '⚗️',
    trigger: 'alchemy_craft',
    titleReward: 'Đan Sư',
  },

  // ── Chiến Đấu ─────────────────────────────────────────────────────────────
  'ach_first_kill': {
    id: 'ach_first_kill',
    name: 'Sát Yêu Sơ Trận',
    desc: 'Tiêu diệt yêu thú lần đầu.',
    icon: '⚔️',
    trigger: 'combat_win',
    titleReward: 'Chiến Binh',
  },
  'ach_dragon_slayer': {
    id: 'ach_dragon_slayer',
    name: 'Đồ Long Chi Thủ',
    desc: 'Đánh bại Hỗn Nguyên Long.',
    icon: '🐉',
    trigger: 'combat_win_chaos_dragon',
    titleReward: 'Đồ Long',
  },

  // ── Bí Cảnh ───────────────────────────────────────────────────────────────
  'ach_first_dungeon': {
    id: 'ach_first_dungeon',
    name: 'Phám Hiểm Bí Cảnh',
    desc: 'Hoàn thành bí cảnh lần đầu.',
    icon: '🗺️',
    trigger: 'dungeon_complete',
    titleReward: null,
  },
};
