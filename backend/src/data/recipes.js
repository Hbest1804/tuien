// ─── Công thức Luyện Đan ─────────────────────────────────────────────────────
// ingredients: [{ itemId, quantity }]
// output: { itemId, quantity }
// successRate: 0-1 (tỷ lệ thành công cơ bản, có thể tăng theo cảnh giới)
// realmRequired: Cảnh giới tối thiểu để luyện

export const RECIPES = {
  'recipe_tu_khi': {
    id: 'recipe_tu_khi',
    name: 'Luyện Tụ Khí Đan',
    desc: 'Kết hợp linh thảo thô để chế Tụ Khí Đan.',
    icon: '⚗️',
    realmRequired: 0,
    successRate: 0.9,
    ingredients: [
      { itemId: 'mat_huyet_linh_thao', quantity: 3 },
    ],
    output: { itemId: 'pill_tu_khi_dan', quantity: 1 },
  },

  'recipe_truc_co': {
    id: 'recipe_truc_co',
    name: 'Luyện Trúc Cơ Đan',
    desc: 'Kết hợp Kim Đan Thảo và Huyết Linh Thảo thành Trúc Cơ Đan.',
    icon: '⚗️',
    realmRequired: 1,
    successRate: 0.75,
    ingredients: [
      { itemId: 'mat_kim_dan_thao',    quantity: 2 },
      { itemId: 'mat_huyet_linh_thao', quantity: 1 },
    ],
    output: { itemId: 'pill_truc_co_dan', quantity: 1 },
  },

  'recipe_tay_tuy': {
    id: 'recipe_tay_tuy',
    name: 'Luyện Tẩy Tủy Đan',
    desc: 'Thanh lọc kinh mạch, tạo đan buff tăng tốc x2.',
    icon: '⚗️',
    realmRequired: 0,
    successRate: 0.8,
    ingredients: [
      { itemId: 'mat_huyet_linh_thao', quantity: 2 },
      { itemId: 'mat_kim_dan_thao',    quantity: 1 },
    ],
    output: { itemId: 'pill_tay_tuy_dan', quantity: 1 },
  },

  'recipe_linh_khi': {
    id: 'recipe_linh_khi',
    name: 'Luyện Linh Khí Đan',
    desc: 'Cô đặc linh khí từ nguyên liệu hiếm, tạo đan buff x3 tốc độ.',
    icon: '⚗️',
    realmRequired: 1,
    successRate: 0.6,
    ingredients: [
      { itemId: 'mat_kim_dan_thao',     quantity: 2 },
      { itemId: 'mat_nguyen_anh_thach', quantity: 1 },
    ],
    output: { itemId: 'pill_linh_khi_dan', quantity: 1 },
  },

  'recipe_pha_canh': {
    id: 'recipe_pha_canh',
    name: 'Luyện Phá Cảnh Đan',
    desc: 'Luyện đan dược hỗ trợ đột phá thành công +15%.',
    icon: '⚗️',
    realmRequired: 1,
    successRate: 0.7,
    ingredients: [
      { itemId: 'mat_kim_dan_thao',    quantity: 3 },
      { itemId: 'mat_huyet_linh_thao', quantity: 2 },
    ],
    output: { itemId: 'pill_pha_canh_dan', quantity: 1 },
  },

  'recipe_thien_dieu': {
    id: 'recipe_thien_dieu',
    name: 'Luyện Thiên Diệu Đan',
    desc: 'Thần đan tối thượng hỗ trợ đột phá +30%.',
    icon: '⚗️',
    realmRequired: 2,
    successRate: 0.5,
    ingredients: [
      { itemId: 'mat_nguyen_anh_thach', quantity: 2 },
      { itemId: 'mat_kim_dan_thao',     quantity: 3 },
    ],
    output: { itemId: 'pill_thien_dieu_dan', quantity: 1 },
  },

  'recipe_tho_nguyen': {
    id: 'recipe_tho_nguyen',
    name: 'Luyện Thọ Nguyên Quả',
    desc: 'Dùng tinh chất Nguyên Anh Thạch tạo Thọ Nguyên Quả.',
    icon: '⚗️',
    realmRequired: 2,
    successRate: 0.55,
    ingredients: [
      { itemId: 'mat_nguyen_anh_thach', quantity: 1 },
      { itemId: 'mat_hoa_than_tinh',    quantity: 1 },
    ],
    output: { itemId: 'pill_tho_nguyen_qua', quantity: 1 },
  },

  'recipe_kim_dan_thượng': {
    id: 'recipe_kim_dan_thuong',
    name: 'Luyện Kim Đan (Thượng Phẩm)',
    desc: 'Luyện Kim Đan thượng phẩm từ tinh chất quý hiếm nhất.',
    icon: '⚗️',
    realmRequired: 3,
    successRate: 0.4,
    ingredients: [
      { itemId: 'mat_hoa_than_tinh',    quantity: 2 },
      { itemId: 'mat_nguyen_anh_thach', quantity: 3 },
    ],
    output: { itemId: 'pill_kim_dan', quantity: 1 },
  },
};
