export const ITEM_TYPES = {
  PILL: 'PILL',             // Đan dược
  ARTIFACT: 'ARTIFACT',     // Pháp bảo / Trang bị
  MATERIAL: 'MATERIAL',     // Nguyên liệu / Thiên tài địa bảo
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

  // ─── PHÁP BẢO (ARTIFACTS) ──────────────────────────────────────────────────
  'weapon_moc_kiem': {
    id: 'weapon_moc_kiem',
    name: 'Mộc Kiếm',
    type: ITEM_TYPES.ARTIFACT,
    subType: ITEM_SUBTYPES.WEAPON,
    description: 'Thanh kiếm gỗ rẻ tiền của Luyện Khí kỳ.',
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
    description: 'Đúc từ Huyền Thiết ngàn năm, rất nặng.',
    rarity: 'Hiếm',
    effects: {
      atkBonus: 150,
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
    rarity: 'Cực Phẩm',
    effects: {
      tribulationDefense: 5000,
    }
  },

  // ─── NGUYÊN LIỆU (MATERIALS) ───────────────────────────────────────────────
  'mat_huyet_linh_thao': {
    id: 'mat_huyet_linh_thao',
    name: 'Huyết Linh Thảo',
    type: ITEM_TYPES.MATERIAL,
    subType: null,
    description: 'Thảo dược có tính nóng, dùng để luyện đan. (Có hỗ trợ tăng thuộc tính khi luyện).',
    rarity: 'Thường',
    effects: {}
  }
};
