export const ITEM_TYPES = {
  PILL: 'PILL',             // Đan dược
  ARTIFACT: 'ARTIFACT',     // Pháp bảo / Trang bị
  MATERIAL: 'MATERIAL',     // Nguyên liệu / Thiên tài địa bảo
  TECHNIQUE: 'TECHNIQUE',   // Công pháp / Kỹ năng sách
};

export const ITEM_SUBTYPES = {
  // PILL
  EXP: 'EXP',               // Cộng EXP ngay lập tức
  SPEED_BUFF: 'SPEED_BUFF', // Tăng tốc độ tu luyện
  LIFESPAN: 'LIFESPAN',     // Cộng thọ nguyên
  BREAKTHROUGH: 'BREAKTHROUGH', // Tỷ lệ thành công đột phá
  
  // ARTIFACT
  WEAPON: 'WEAPON',         // Vũ khí
  ARMOR: 'ARMOR',           // Phòng cụ
  PROTECTION: 'PROTECTION', // Pháp bảo đỡ lôi kiếp

  // TECHNIQUE
  SPEED_PASSIVE: 'SPEED_PASSIVE',   // Tăng vĩnh viễn tốc độ tu luyện
};

export const ITEMS = {
  // ─── ĐAN DƯỢC (PILLS) ────────────────────────────────────────────────────────
  'pill_tu_khi_dan': {
    id: 'pill_tu_khi_dan',
    name: 'Tụ Khí Đan',
    type: ITEM_TYPES.PILL,
    subType: ITEM_SUBTYPES.EXP,
    description: 'Đan dược cấp thấp giúp gia tăng 500 EXP. Hiệu quả tốt nhất cho Luyện Khí kỳ.',
    rarity: 'Thường',
    targetRealmIndex: 0,
    effects: {
      expAmount: 500,
    }
  },
  'pill_truc_co_dan': {
    id: 'pill_truc_co_dan',
    name: 'Trúc Cơ Đan',
    type: ITEM_TYPES.PILL,
    subType: ITEM_SUBTYPES.EXP,
    description: 'Đan dược quý giá chứa lượng linh khí khổng lồ. Cộng ngay 5000 EXP. Hiệu quả tốt nhất cho Trúc Cơ kỳ.',
    rarity: 'Hiếm',
    targetRealmIndex: 1,
    effects: {
      expAmount: 5000,
    }
  },
  'pill_kim_dan': {
    id: 'pill_kim_dan',
    name: 'Kim Đan',
    type: ITEM_TYPES.PILL,
    subType: ITEM_SUBTYPES.EXP,
    description: 'Linh đan thượng phẩm, cộng ngay 20000 EXP. Chuyên dụng cho Kim Đan kỳ tu sĩ.',
    rarity: 'Cực Phẩm',
    targetRealmIndex: 2,
    sectContributionPrice: 5000,
    effects: {
      expAmount: 20000,
    }
  },
  'pill_tay_tuy_dan': {
    id: 'pill_tay_tuy_dan',
    name: 'Tẩy Tủy Đan',
    type: ITEM_TYPES.PILL,
    subType: ITEM_SUBTYPES.SPEED_BUFF,
    description: 'Tẩy rửa kinh mạch, giúp x2 tốc độ tu luyện trong 2 giờ. Phù hợp mọi cảnh giới.',
    rarity: 'Hiếm',
    targetRealmIndex: 99, // Không giảm hiệu quả
    effects: {
      buffType: 'SPEED_X2',
      multiplier: 2.0,
      durationHours: 2,
    }
  },
  'pill_linh_khi_dan': {
    id: 'pill_linh_khi_dan',
    name: 'Linh Khí Đan',
    type: ITEM_TYPES.PILL,
    subType: ITEM_SUBTYPES.SPEED_BUFF,
    description: 'Linh đan đặc biệt chứa đựng linh khí đặc, x3 tốc độ tu luyện trong 1 giờ.',
    rarity: 'Cực Phẩm',
    targetRealmIndex: 99,
    effects: {
      buffType: 'SPEED_X3',
      multiplier: 3.0,
      durationHours: 1,
    }
  },
  'pill_tho_nguyen_qua': {
    id: 'pill_tho_nguyen_qua',
    name: 'Thọ Nguyên Quả',
    type: ITEM_TYPES.PILL,
    subType: ITEM_SUBTYPES.LIFESPAN,
    description: 'Linh quả sinh trưởng ngàn năm, ăn vào gia tăng 50 năm thọ nguyên. Hiệu quả mọi cảnh giới.',
    rarity: 'Cực Phẩm',
    targetRealmIndex: 99, // Không giảm hiệu quả
    effects: {
      lifespanAmount: 50,
    }
  },
  'pill_pha_canh_dan': {
    id: 'pill_pha_canh_dan',
    name: 'Phá Cảnh Đan',
    type: ITEM_TYPES.PILL,
    subType: ITEM_SUBTYPES.BREAKTHROUGH,
    description: 'Tăng 15% tỷ lệ đột phá thành công. Có hiệu lực cho mọi cảnh giới.',
    rarity: 'Hiếm',
    targetRealmIndex: 99,
    effects: {
      successRateBonus: 0.15,
    }
  },
  'pill_thien_dieu_dan': {
    id: 'pill_thien_dieu_dan',
    name: 'Thiên Diệu Đan',
    type: ITEM_TYPES.PILL,
    subType: ITEM_SUBTYPES.BREAKTHROUGH,
    description: 'Thần đan hiếm có, tăng 30% tỷ lệ đột phá thành công. Chuyên dành cho Kim Đan+ đột phá.',
    rarity: 'Cực Phẩm',
    targetRealmIndex: 99,
    effects: {
      successRateBonus: 0.30,
    }
  },

  // ─── PHÁP BẢO (ARTIFACTS) ──────────────────────────────────────────────────
  'weapon_moc_kiem': {
    id: 'weapon_moc_kiem',
    name: 'Mộc Kiếm',
    type: ITEM_TYPES.ARTIFACT,
    subType: ITEM_SUBTYPES.WEAPON,
    description: 'Thanh kiếm gỗ rẻ tiền của Luyện Khí kỳ. +10 Công kích.',
    rarity: 'Thường',
    effects: {
      atkBonus: 10,
    }
  },
  'weapon_huyen_thiet_kiem': {
    id: 'weapon_huyen_thiet_kiem',
    name: 'Huyền Thiết Trọng Kiếm',
    type: ITEM_TYPES.ARTIFACT,
    subType: ITEM_SUBTYPES.WEAPON,
    description: 'Đúc từ Huyền Thiết ngàn năm, rất nặng. +150 Công kích.',
    rarity: 'Hiếm',
    effects: {
      atkBonus: 150,
    }
  },
  'weapon_tuyet_han_kiem': {
    id: 'weapon_tuyet_han_kiem',
    name: 'Tuyết Hàn Kiếm',
    type: ITEM_TYPES.ARTIFACT,
    subType: ITEM_SUBTYPES.WEAPON,
    description: 'Pháp bảo chứa băng hàn vạn cổ, +500 Công kích. Kim Đan kỳ chuyên dụng.',
    rarity: 'Cực Phẩm',
    effects: {
      atkBonus: 500,
    }
  },
  'armor_tho_vu_giac': {
    id: 'armor_tho_vu_giac',
    name: 'Thổ Vũ Giáp',
    type: ITEM_TYPES.ARTIFACT,
    subType: ITEM_SUBTYPES.ARMOR,
    description: 'Giáp phòng thủ cơ bản đúc từ thổ linh thạch. +30 Phòng ngự.',
    rarity: 'Thường',
    effects: {
      defBonus: 30,
    }
  },
  'armor_huyen_vu_giac': {
    id: 'armor_huyen_vu_giac',
    name: 'Huyền Vũ Giáp',
    type: ITEM_TYPES.ARTIFACT,
    subType: ITEM_SUBTYPES.ARMOR,
    description: 'Giáp hạng hiếm đúc từ Huyền Vũ Kim, +200 Phòng ngự.',
    rarity: 'Hiếm',
    effects: {
      defBonus: 200,
    }
  },
  'artifact_ti_loi_phu': {
    id: 'artifact_ti_loi_phu',
    name: 'Tị Lôi Phù',
    type: ITEM_TYPES.ARTIFACT,
    subType: ITEM_SUBTYPES.PROTECTION,
    description: 'Bùa chú đỡ lôi kiếp, có thể cản 500 điểm sát thương thiên lôi.',
    rarity: 'Thường',
    effects: {
      tribulationDefense: 500,
    }
  },
  'artifact_huyen_vu_khien': {
    id: 'artifact_huyen_vu_khien',
    name: 'Huyền Vũ Khiên',
    type: ITEM_TYPES.ARTIFACT,
    subType: ITEM_SUBTYPES.PROTECTION,
    description: 'Pháp bảo phòng ngự cao cấp, cản được 5000 điểm sát thương lôi kiếp.',
    effectDesc: 'Tu luyện tăng thêm 25%',
    sectContributionPrice: 2000,
    effects: {
      tribulationDefense: 5000,
    }
  },

  // --- SECT ULTIMATE TECHNIQUES (CÔNG PHÁP TRẤN TÔNG) ---
  'tech_thien_kiem_than_quyet': {
    id: 'tech_thien_kiem_than_quyet',
    name: 'Thiên Kiếm Thần Quyết',
    type: ITEM_TYPES.TECHNIQUE,
    subType: ITEM_SUBTYPES.SPEED_PASSIVE,
    description: 'Công pháp trấn phái của Thiên Kiếm Tông. Kiếm khí xé rách hư không.',
    rarity: 'Cực Phẩm',
    effectDesc: 'Tu luyện tăng thêm 100%',
    sectContributionPrice: 10000,
    isSectUltimate: true,
    effects: { speedPassiveBonus: 1.0 }
  },
  'tech_huyet_ma_dai_phap': {
    id: 'tech_huyet_ma_dai_phap',
    name: 'Huyết Ma Đại Pháp',
    type: ITEM_TYPES.TECHNIQUE,
    subType: ITEM_SUBTYPES.SPEED_PASSIVE,
    description: 'Công pháp trấn phái của Huyết Ma Tông. Thôn phệ linh khí thiên địa để cường hóa bản thân.',
    rarity: 'Cực Phẩm',
    effectDesc: 'Tu luyện tăng thêm 100%',
    sectContributionPrice: 10000,
    isSectUltimate: true,
    effects: { speedPassiveBonus: 1.0 }
  },

  // ─── NGUYÊN LIỆU (MATERIALS) ───────────────────────────────────────────────
  'mat_huyet_linh_thao': {
    id: 'mat_huyet_linh_thao',
    name: 'Huyết Linh Thảo',
    type: ITEM_TYPES.MATERIAL,
    subType: null,
    description: 'Thảo dược có tính nóng, dùng để luyện đan Luyện Khí kỳ.',
    rarity: 'Thường',
    realmTier: 0,
    effects: {}
  },
  'mat_kim_dan_thao': {
    id: 'mat_kim_dan_thao',
    name: 'Kim Đan Thảo',
    type: ITEM_TYPES.MATERIAL,
    subType: null,
    description: 'Linh thảo chứa kim hệ linh khí, nguyên liệu luyện đan Trúc Cơ — Kim Đan kỳ.',
    rarity: 'Hiếm',
    realmTier: 1,
    effects: {}
  },
  'mat_nguyen_anh_thach': {
    id: 'mat_nguyen_anh_thach',
    name: 'Nguyên Anh Thạch',
    type: ITEM_TYPES.MATERIAL,
    subType: null,
    description: 'Ngọc thạch chứa tinh chất nguyên anh, cực kỳ quý hiếm. Dùng để luyện Kim Đan — Nguyên Anh cấp.',
    rarity: 'Cực Phẩm',
    realmTier: 2,
    effects: {}
  },
  'mat_hoa_than_tinh': {
    id: 'mat_hoa_than_tinh',
    name: 'Hóa Thần Tinh',
    type: ITEM_TYPES.MATERIAL,
    subType: null,
    description: 'Thiên vật địa bảo chỉ xuất hiện ở vùng đất thần thánh. Dùng để luyện đan cấp Nguyên Anh+.',
    rarity: 'Cực Phẩm',
    realmTier: 3,
    effects: {}
  },

  // ─── CÔNG PHÁP (TECHNIQUES) ────────────────────────────────────────────────
  'tech_lu_khi_quyet': {
    id: 'tech_lu_khi_quyet',
    name: 'Luyện Khí Quyết',
    type: ITEM_TYPES.TECHNIQUE,
    subType: ITEM_SUBTYPES.SPEED_PASSIVE,
    description: 'Công pháp nhập môn. Học được tăng vĩnh viễn tốc độ tu luyện thêm 10%.',
    rarity: 'Thường',
    targetRealmIndex: 99,
    sectContributionPrice: 100,
    effects: {
      speedPassiveBonus: 0.10, // +10% tốc độ tu luyện vĩnh viễn
    }
  },
  'tech_thien_long_quyet': {
    id: 'tech_thien_long_quyet',
    name: 'Thiên Long Quyết',
    type: ITEM_TYPES.TECHNIQUE,
    subType: ITEM_SUBTYPES.SPEED_PASSIVE,
    description: 'Công pháp thượng cổ bí truyền. Học được tăng vĩnh viễn tốc độ tu luyện thêm 25%.',
    rarity: 'Hiếm',
    targetRealmIndex: 99,
    sectContributionPrice: 1000,
    effects: {
      speedPassiveBonus: 0.25, // +25% tốc độ tu luyện vĩnh viễn
    }
  },
  'tech_cuu_long_quyet': {
    id: 'tech_cuu_long_quyet',
    name: 'Cửu Long Thần Quyết',
    type: ITEM_TYPES.TECHNIQUE,
    subType: ITEM_SUBTYPES.SPEED_PASSIVE,
    description: 'Thiên hạ đệ nhất công pháp truyền thuyết. Học được tăng vĩnh viễn tốc độ tu luyện thêm 50%.',
    rarity: 'Cực Phẩm',
    targetRealmIndex: 99,
    sectContributionPrice: 5000,
    effects: {
      speedPassiveBonus: 0.50, // +50% tốc độ tu luyện vĩnh viễn
    }
  },
};
