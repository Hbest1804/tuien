export const DUNGEONS = {
  'dung_sect': {
    id: 'dung_sect',
    name: 'Thiên Kiếm Tông',
    description: 'Tông môn của bạn, nơi đây linh khí dồi dào, tuyệt đối an toàn. Chuyên tâm bế quan tu luyện chứ không phải để đi đánh quái.',
    requiredRealmIndex: 0,
    recommendedRealmIndex: 0,
    spiritStonesPerHour: 0,
    drops: [],
    // UI Metadata
    top: '30%', left: '40%',
    type: 'sect',
    color: 'primary',
    danger: 0,
  },
  'dung_thu_thach_coc': {
    id: 'dung_thu_thach_coc',
    name: 'Thử Thách Cốc',
    description: 'Bí cảnh dành cho người mới bước chân vào con đường tu tiên. Nơi đây có linh thảo cấp thấp và yêu thú yếu ớt.',
    requiredRealmIndex: 0, // Luyện Khí
    recommendedRealmIndex: 0,
    spiritStonesPerHour: 500, // 500 linh thạch / giờ
    drops: [
      { itemId: 'mat_huyet_linh_thao', dropRate: 0.5 }, // 50% rớt 1 cái mỗi giờ
      { itemId: 'pill_tu_khi_dan', dropRate: 0.1 },     // 10% rớt 1 đan mỗi giờ
    ],
    // UI Metadata
    top: '70%', left: '25%',
    type: 'vein',
    color: 'secondary',
    danger: 10,
  },
  'dung_thuy_tinh_dong': {
    id: 'dung_thuy_tinh_dong',
    name: 'Thủy Tinh Động',
    description: 'Hang động ẩm ướt tràn ngập linh khí. Rất nguy hiểm đối với tu sĩ dưới Trúc Cơ.',
    requiredRealmIndex: 1, // Trúc Cơ
    recommendedRealmIndex: 1,
    spiritStonesPerHour: 1500,
    drops: [
      { itemId: 'mat_kim_dan_thao', dropRate: 0.4 },
      { itemId: 'pill_truc_co_dan', dropRate: 0.1 },
      { itemId: 'weapon_huyen_thiet_kiem', dropRate: 0.01 }, // 1% rớt vũ khí
    ],
    // UI Metadata
    top: '20%', left: '75%',
    type: 'vein',
    color: 'secondary',
    danger: 30,
  },
  'dung_van_co_cam_dia': {
    id: 'dung_van_co_cam_dia',
    name: 'Vạn Cổ Cấm Địa',
    description: 'Vùng đất chết chóc chôn vùi vô số đại năng. Chỉ có kẻ mạnh thực sự mới dám bước vào.',
    requiredRealmIndex: 2, // Kim Đan
    recommendedRealmIndex: 2,
    spiritStonesPerHour: 5000,
    drops: [
      { itemId: 'mat_nguyen_anh_thach', dropRate: 0.3 },
      { itemId: 'pill_kim_dan', dropRate: 0.05 },
      { itemId: 'pill_tho_nguyen_qua', dropRate: 0.02 },
      { itemId: 'artifact_huyen_vu_khien', dropRate: 0.01 },
    ],
    // UI Metadata
    top: '60%', left: '70%',
    type: 'forbidden',
    color: 'error',
    danger: 95,
  },
  'dung_thien_cung_di_tich': {
    id: 'dung_thien_cung_di_tich',
    name: 'Thiên Cung Di Tích',
    description: 'Di tích còn sót lại của Tiên Giới thượng cổ. Nguy hiểm ngập tràn nhưng cơ ngộ vô tận.',
    requiredRealmIndex: 3, // Nguyên Anh
    recommendedRealmIndex: 4, // Hóa Thần
    spiritStonesPerHour: 20000,
    drops: [
      { itemId: 'mat_hoa_than_tinh', dropRate: 0.2 },
      { itemId: 'pill_thien_dieu_dan', dropRate: 0.05 },
      { itemId: 'weapon_tuyet_han_kiem', dropRate: 0.02 },
      { itemId: 'tech_cuu_long_quyet', dropRate: 0.005 }, // 0.5% rớt siêu công pháp
    ],
    // UI Metadata
    top: '15%', left: '15%',
    type: 'forbidden',
    color: 'error',
    danger: 99,
  }
};
