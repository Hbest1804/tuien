// ─── Blacksmith Recipes (Luyện Khí) ──────────────────────────────────────────
// Mỗi công thức: nguyên liệu → pháp bảo chế tạo

export const BLACKSMITH_RECIPES = {
  // ─── VŨ KHÍ ─────────────────────────────────────────────────────────────────
  'recipe_moc_kiem': {
    id: 'recipe_moc_kiem',
    resultItemId: 'weapon_moc_kiem',
    resultQuantity: 1,
    name: 'Chế Tác Mộc Kiếm',
    description: 'Dùng Huyết Linh Thảo chế tác Mộc Kiếm căn bản.',
    requiredRealmIndex: 0,
    materials: [
      { itemId: 'mat_huyet_linh_thao', quantity: 3 },
    ],
    craftTime: 60, // giây
    successRate: 0.95,
    category: 'weapon',
  },
  'recipe_huyen_thiet_kiem': {
    id: 'recipe_huyen_thiet_kiem',
    resultItemId: 'weapon_huyen_thiet_kiem',
    resultQuantity: 1,
    name: 'Rèn Huyền Thiết Trọng Kiếm',
    description: 'Dùng Kim Đan Thảo và Nguyên Anh Thạch rèn đúc Huyền Thiết Kiếm.',
    requiredRealmIndex: 1,
    materials: [
      { itemId: 'mat_kim_dan_thao', quantity: 5 },
      { itemId: 'mat_nguyen_anh_thach', quantity: 2 },
    ],
    craftTime: 300,
    successRate: 0.75,
    category: 'weapon',
  },
  'recipe_tuyet_han_kiem': {
    id: 'recipe_tuyet_han_kiem',
    resultItemId: 'weapon_tuyet_han_kiem',
    resultQuantity: 1,
    name: 'Đúc Tuyết Hàn Kiếm',
    description: 'Dùng Hóa Thần Tinh và Nguyên Anh Thạch đúc nên Tuyết Hàn Kiếm thần thoại.',
    requiredRealmIndex: 2,
    materials: [
      { itemId: 'mat_nguyen_anh_thach', quantity: 10 },
      { itemId: 'mat_hoa_than_tinh', quantity: 3 },
    ],
    craftTime: 600,
    successRate: 0.50,
    category: 'weapon',
  },

  // ─── GIÁP ────────────────────────────────────────────────────────────────────
  'recipe_tho_vu_giac': {
    id: 'recipe_tho_vu_giac',
    resultItemId: 'armor_tho_vu_giac',
    resultQuantity: 1,
    name: 'Đúc Thổ Vũ Giáp',
    description: 'Dùng Huyết Linh Thảo đúc Thổ Vũ Giáp phòng ngự cơ bản.',
    requiredRealmIndex: 0,
    materials: [
      { itemId: 'mat_huyet_linh_thao', quantity: 5 },
    ],
    craftTime: 120,
    successRate: 0.90,
    category: 'armor',
  },
  'recipe_huyen_vu_giac': {
    id: 'recipe_huyen_vu_giac',
    resultItemId: 'armor_huyen_vu_giac',
    resultQuantity: 1,
    name: 'Rèn Huyền Vũ Giáp',
    description: 'Dùng Kim Đan Thảo rèn Huyền Vũ Giáp hiếm quý.',
    requiredRealmIndex: 1,
    materials: [
      { itemId: 'mat_kim_dan_thao', quantity: 8 },
      { itemId: 'mat_nguyen_anh_thach', quantity: 1 },
    ],
    craftTime: 400,
    successRate: 0.70,
    category: 'armor',
  },

  // ─── PHÁP BẢO ────────────────────────────────────────────────────────────────
  'recipe_ti_loi_phu': {
    id: 'recipe_ti_loi_phu',
    resultItemId: 'artifact_ti_loi_phu',
    resultQuantity: 1,
    name: 'Vẽ Tị Lôi Phù',
    description: 'Vẽ bùa Tị Lôi Phù để chống lôi kiếp.',
    requiredRealmIndex: 0,
    materials: [
      { itemId: 'mat_huyet_linh_thao', quantity: 8 },
      { itemId: 'mat_kim_dan_thao', quantity: 2 },
    ],
    craftTime: 180,
    successRate: 0.85,
    category: 'artifact',
  },
  'recipe_huyen_vu_khien': {
    id: 'recipe_huyen_vu_khien',
    resultItemId: 'artifact_huyen_vu_khien',
    resultQuantity: 1,
    name: 'Đúc Huyền Vũ Khiên',
    description: 'Đúc Huyền Vũ Khiên từ nguyên liệu siêu cấp.',
    requiredRealmIndex: 2,
    materials: [
      { itemId: 'mat_nguyen_anh_thach', quantity: 8 },
      { itemId: 'mat_hoa_than_tinh', quantity: 2 },
    ],
    craftTime: 500,
    successRate: 0.55,
    category: 'artifact',
  },

  // ─── ĐAN DƯỢC ─────────────────────────────────────────────────────────────────
  'recipe_tu_khi_dan': {
    id: 'recipe_tu_khi_dan',
    resultItemId: 'pill_tu_khi_dan',
    resultQuantity: 3,
    name: 'Luyện Tụ Khí Đan',
    description: 'Luyện 3 viên Tụ Khí Đan từ Huyết Linh Thảo.',
    requiredRealmIndex: 0,
    materials: [
      { itemId: 'mat_huyet_linh_thao', quantity: 5 },
    ],
    craftTime: 60,
    successRate: 0.95,
    category: 'pill',
  },
  'recipe_tay_tuy_dan': {
    id: 'recipe_tay_tuy_dan',
    resultItemId: 'pill_tay_tuy_dan',
    resultQuantity: 1,
    name: 'Luyện Tẩy Tủy Đan',
    description: 'Luyện Tẩy Tủy Đan từ nguyên liệu quý.',
    requiredRealmIndex: 1,
    materials: [
      { itemId: 'mat_kim_dan_thao', quantity: 6 },
      { itemId: 'mat_huyet_linh_thao', quantity: 10 },
    ],
    craftTime: 240,
    successRate: 0.75,
    category: 'pill',
  },
};

// Đá khảm nạm (gems for enchanting)
export const ENCHANT_GEMS = {
  'gem_hoa_tinh': {
    id: 'gem_hoa_tinh',
    name: 'Hỏa Tinh',
    description: 'Đá quý hỏa hệ. Khảm vào vũ khí tăng công kích.',
    bonus: { atkBonus: 50 },
    rarity: 'Hiếm',
    craftable: true,
    craftMaterials: [{ itemId: 'mat_hoa_than_tinh', quantity: 1 }],
  },
  'gem_thuy_ngoc': {
    id: 'gem_thuy_ngoc',
    name: 'Thủy Ngọc',
    description: 'Đá quý thủy hệ. Khảm vào giáp tăng phòng ngự.',
    bonus: { defBonus: 50 },
    rarity: 'Hiếm',
    craftable: true,
    craftMaterials: [{ itemId: 'mat_nguyen_anh_thach', quantity: 2 }],
  },
  'gem_loi_tinh': {
    id: 'gem_loi_tinh',
    name: 'Lôi Tinh',
    description: 'Đá quý lôi hệ. Khảm vào pháp bảo tăng tốc độ tu luyện.',
    bonus: { speedBonus: 0.05 },
    rarity: 'Cực Phẩm',
    craftable: true,
    craftMaterials: [{ itemId: 'mat_hoa_than_tinh', quantity: 3 }],
  },
};
